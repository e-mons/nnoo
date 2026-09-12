-- ==============================================================================
-- Migration: 20260828000000_notification_attention_center.sql
-- Description: Production NNOO Notification & Attention Center Schema
-- Tables: public.business_notifications, public.notification_preferences
-- Features: Recipient-specific in-app notifications, per-user preferences,
--           deduplication, RLS policies, zero financial mutation constraints.
-- ==============================================================================

-- 1. Table: public.business_notifications
CREATE TABLE IF NOT EXISTS public.business_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_event_id text,
  notification_category text NOT NULL,
  notification_type text NOT NULL,
  dedupe_key text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  primary_action_key text NOT NULL,
  source_reference_type text,
  source_reference_id text,
  required_capabilities text[] NOT NULL DEFAULT '{}',
  channel text NOT NULL DEFAULT 'IN_APP',
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  resolved_at timestamptz,
  CONSTRAINT chk_business_notifications_channel CHECK (channel IN ('IN_APP')),
  CONSTRAINT chk_business_notifications_category CHECK (
    notification_category IN (
      'INVENTORY',
      'INVOICES',
      'BOOKKEEPER',
      'BUSINESS_HEALTH',
      'CREDIT_PASSPORT',
      'BUSINESS_SUMMARIES',
      'AUTOMATIONS'
    )
  ),
  CONSTRAINT uq_business_notifications_dedupe UNIQUE (business_id, recipient_user_id, dedupe_key)
);

-- Indexes for efficient feed queries and unread counting
CREATE INDEX IF NOT EXISTS idx_business_notifications_user_biz 
  ON public.business_notifications(recipient_user_id, business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_notifications_user_unread 
  ON public.business_notifications(recipient_user_id, business_id, read_at) 
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_business_notifications_biz_source 
  ON public.business_notifications(business_id, source_event_id);

-- 2. Table: public.notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  channel text NOT NULL DEFAULT 'IN_APP',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT chk_notification_preferences_channel CHECK (channel IN ('IN_APP')),
  CONSTRAINT chk_notification_preferences_category CHECK (
    category IN (
      'INVENTORY',
      'INVOICES',
      'BOOKKEEPER',
      'BUSINESS_HEALTH',
      'CREDIT_PASSPORT',
      'BUSINESS_SUMMARIES',
      'AUTOMATIONS'
    )
  ),
  CONSTRAINT uq_notification_preferences_biz_user_cat_chan UNIQUE (business_id, user_id, category, channel)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_lookup 
  ON public.notification_preferences(business_id, user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.business_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Multi-tenant RLS Policies for business_notifications
-- SELECT: Recipient can view their own notifications within businesses where they hold an active membership
CREATE POLICY business_notifications_tenant_select ON public.business_notifications
  FOR SELECT
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = business_notifications.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  );

-- UPDATE: Recipient can update their personal read_at timestamp
CREATE POLICY business_notifications_tenant_update ON public.business_notifications
  FOR UPDATE
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = business_notifications.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  )
  WITH CHECK (
    recipient_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = business_notifications.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  );

-- 5. Multi-tenant RLS Policies for notification_preferences
-- SELECT: Users can view their own preferences for active businesses
CREATE POLICY notification_preferences_tenant_select ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = notification_preferences.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  );

-- INSERT: Users can insert their own preferences for active businesses
CREATE POLICY notification_preferences_tenant_insert ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND updated_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = notification_preferences.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  );

-- UPDATE: Users can update their own preferences for active businesses
CREATE POLICY notification_preferences_tenant_update ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = notification_preferences.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND updated_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = notification_preferences.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  );
