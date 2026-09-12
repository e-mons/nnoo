-- =============================================================
-- Migration: Platform Admin Foundation
-- Purpose:   Create platform_admins and platform_audit_events
--            tables with strict RLS policies.
-- =============================================================

-- ─── 1. Platform Admins Table ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT platform_admins_pkey PRIMARY KEY (id),
  CONSTRAINT platform_admins_user_id_key UNIQUE (user_id)
);

COMMENT ON TABLE public.platform_admins IS 'Authoritative table for NNOO platform administrators.';

CREATE TRIGGER set_platform_admins_updated_at
  BEFORE UPDATE ON public.platform_admins
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Admins can view their own admin record to authorize themselves
CREATE POLICY "Admins can view their own platform admin record"
  ON public.platform_admins FOR SELECT
  USING (user_id = auth.uid());

-- NOTE: All other operations on platform_admins must be done via Service Role.

-- ─── 2. Platform Audit Events Table ─────────────────────────

CREATE TABLE IF NOT EXISTS public.platform_audit_events (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  actor_id uuid REFERENCES public.platform_admins(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  reason text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT platform_audit_events_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.platform_audit_events IS 'Append-only audit log for sensitive platform administrative actions.';

-- Enable RLS
ALTER TABLE public.platform_audit_events ENABLE ROW LEVEL SECURITY;

-- NOTE: Normal users cannot read or write to the audit log. Admins read it via Service Role.

-- ─── 3. Function to bootstrap the first Super Admin ─────────

CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(
  p_email text
) RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- This function is intended to be run manually by an infrastructure owner
  -- or via a trusted server endpoint with sufficient authorization.
  
  -- Find the user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(trim(p_email));
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.platform_admins (user_id, role, status)
  VALUES (v_user_id, 'super_admin', 'active')
  ON CONFLICT (user_id) DO UPDATE SET 
    role = 'super_admin',
    status = 'active',
    updated_at = now();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
