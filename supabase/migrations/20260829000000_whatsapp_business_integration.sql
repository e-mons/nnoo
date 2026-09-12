-- ==============================================================================
-- NNOO Tranche 3 — Prompt 10: WhatsApp Business Integration
-- Migration: 20260829000000_whatsapp_business_integration.sql
-- Description: Creates public.whatsapp_connections, public.whatsapp_link_requests,
--              public.whatsapp_deliveries, public.whatsapp_webhook_receipts,
--              and updates notification preferences constraint for WHATSAPP channel.
-- ==============================================================================

-- 1. WhatsApp Connections
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'meta_cloud_api',
  provider_phone_number_id TEXT NOT NULL,
  phone_lookup_key TEXT NOT NULL,
  masked_phone TEXT NOT NULL,
  encrypted_phone TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'OPTED_OUT', 'REVOKED')),
  consent_status TEXT NOT NULL DEFAULT 'CONSENTED' CHECK (consent_status IN ('CONSENTED', 'OPTED_OUT', 'REVOKED')),
  consent_version TEXT NOT NULL DEFAULT 'v1',
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opted_out_at TIMESTAMPTZ,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  active_business_context BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_whatsapp_connections_business_user UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_user_biz_status 
  ON public.whatsapp_connections(user_id, business_id, status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_lookup_status 
  ON public.whatsapp_connections(phone_lookup_key, status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_biz 
  ON public.whatsapp_connections(business_id);

-- Enable RLS
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;

-- Multi-tenant and recipient-isolated RLS policies
CREATE POLICY "tenant_isolation_whatsapp_connections"
  ON public.whatsapp_connections
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = public.whatsapp_connections.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = public.whatsapp_connections.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  );

-- 2. WhatsApp Link Requests (One-time short-lived cryptographically hashed link codes)
CREATE TABLE IF NOT EXISTS public.whatsapp_link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  code_display TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_link_requests_token_hash 
  ON public.whatsapp_link_requests(token_hash);

CREATE INDEX IF NOT EXISTS idx_whatsapp_link_requests_user_biz 
  ON public.whatsapp_link_requests(user_id, business_id, consumed_at, expires_at);

-- Enable RLS
ALTER TABLE public.whatsapp_link_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_isolation_whatsapp_link_requests"
  ON public.whatsapp_link_requests
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = public.whatsapp_link_requests.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = public.whatsapp_link_requests.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  );

-- 3. WhatsApp Deliveries (Channel delivery tracking)
CREATE TABLE IF NOT EXISTS public.whatsapp_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.business_notifications(id) ON DELETE SET NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.whatsapp_connections(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'WHATSAPP',
  provider TEXT NOT NULL DEFAULT 'meta_cloud_api',
  template_key TEXT,
  provider_message_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED')),
  message_type TEXT NOT NULL DEFAULT 'template' CHECK (message_type IN ('template', 'text')),
  rendered_body TEXT NOT NULL,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_deliveries_biz_recipient_status 
  ON public.whatsapp_deliveries(business_id, recipient_user_id, status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_deliveries_provider_msg_id 
  ON public.whatsapp_deliveries(provider_message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_deliveries_idempotency 
  ON public.whatsapp_deliveries(idempotency_key);

-- Enable RLS
ALTER TABLE public.whatsapp_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_recipient_isolation_whatsapp_deliveries"
  ON public.whatsapp_deliveries
  FOR SELECT
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = public.whatsapp_deliveries.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  );

-- 4. WhatsApp Webhook Receipts (Deduplication of incoming webhook events)
CREATE TABLE IF NOT EXISTS public.whatsapp_webhook_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  sender_lookup_key TEXT,
  recipient_phone TEXT,
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  correlation_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_receipts_event_id 
  ON public.whatsapp_webhook_receipts(provider_event_id);

-- Enable RLS (Service/server access only)
ALTER TABLE public.whatsapp_webhook_receipts ENABLE ROW LEVEL SECURITY;

-- 5. Update notification_preferences table channel constraint to allow 'WHATSAPP'
ALTER TABLE public.notification_preferences 
  DROP CONSTRAINT IF EXISTS notification_preferences_channel_check;

ALTER TABLE public.notification_preferences 
  ADD CONSTRAINT notification_preferences_channel_check 
  CHECK (channel IN ('IN_APP', 'WHATSAPP'));
