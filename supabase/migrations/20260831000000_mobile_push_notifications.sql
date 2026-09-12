-- ==============================================================================
-- Migration: 20260831000000_mobile_push_notifications.sql
-- Description: Production NNOO Mobile Push Device Registry & Deliveries
-- Tables: public.mobile_push_devices, public.mobile_push_deliveries
-- Features: Push token registration, token rollover, user-device binding,
--           PUSH preference extension, delivery idempotency, RLS policies.
-- ==============================================================================

-- 1. Extend notification_preferences channel constraint to include 'PUSH'
ALTER TABLE public.notification_preferences
  DROP CONSTRAINT IF EXISTS chk_notification_preferences_channel;

ALTER TABLE public.notification_preferences
  ADD CONSTRAINT chk_notification_preferences_channel 
  CHECK (channel IN ('IN_APP', 'WHATSAPP', 'PUSH'));

-- 2. Table: public.mobile_push_devices
CREATE TABLE IF NOT EXISTS public.mobile_push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installation_id text NOT NULL,
  provider text NOT NULL DEFAULT 'EXPO',
  push_token text NOT NULL,
  platform text NOT NULL,
  app_version text,
  environment text NOT NULL DEFAULT 'development',
  status text NOT NULL DEFAULT 'ACTIVE',
  permission_state text NOT NULL DEFAULT 'GRANTED',
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT chk_push_device_provider CHECK (provider IN ('EXPO', 'FCM', 'APNS')),
  CONSTRAINT chk_push_device_platform CHECK (platform IN ('ios', 'android', 'web')),
  CONSTRAINT chk_push_device_status CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
  CONSTRAINT chk_push_device_permission CHECK (permission_state IN ('GRANTED', 'DENIED', 'UNDETERMINED')),
  CONSTRAINT uq_push_device_user_installation UNIQUE (user_id, installation_id)
);

-- Indexes for device queries and token lookups
CREATE INDEX IF NOT EXISTS idx_push_devices_user_status 
  ON public.mobile_push_devices(user_id, status)
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_push_devices_token 
  ON public.mobile_push_devices(push_token);

-- Enable RLS
ALTER TABLE public.mobile_push_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies on mobile_push_devices
CREATE POLICY users_view_own_push_devices
  ON public.mobile_push_devices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY users_insert_own_push_devices
  ON public.mobile_push_devices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY users_update_own_push_devices
  ON public.mobile_push_devices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY users_delete_own_push_devices
  ON public.mobile_push_devices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Table: public.mobile_push_deliveries
CREATE TABLE IF NOT EXISTS public.mobile_push_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  notification_id uuid NOT NULL REFERENCES public.business_notifications(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.mobile_push_devices(id) ON DELETE SET NULL,
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'QUEUED',
  provider_ticket_id text,
  provider_receipt_status text,
  error_code text,
  rendered_title text NOT NULL,
  rendered_body text NOT NULL,
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_push_delivery_status CHECK (status IN ('QUEUED', 'SENT', 'FAILED', 'SKIPPED'))
);

-- Indexes for delivery lookups
CREATE INDEX IF NOT EXISTS idx_push_deliveries_biz_recip 
  ON public.mobile_push_deliveries(business_id, recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_push_deliveries_notif 
  ON public.mobile_push_deliveries(notification_id);

CREATE INDEX IF NOT EXISTS idx_push_deliveries_status 
  ON public.mobile_push_deliveries(status, created_at DESC);

-- Enable RLS
ALTER TABLE public.mobile_push_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: users can view their own push deliveries
CREATE POLICY users_view_own_push_deliveries
  ON public.mobile_push_deliveries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_user_id);
