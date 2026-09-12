-- T2-P11: NNOO Admin - Plans, Subscriptions & Payments
-- Adding Billing Access Overrides

CREATE TYPE public.billing_override_type AS ENUM ('complimentary', 'temporary_extension', 'migration', 'internal_test');

CREATE TABLE public.business_billing_access_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  override_type public.billing_override_type NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  reason TEXT NOT NULL,
  internal_note TEXT,
  created_by_platform_admin_id UUID NOT NULL REFERENCES public.platform_admins(id),
  revoked_at TIMESTAMPTZ,
  revoked_by_platform_admin_id UUID REFERENCES public.platform_admins(id),
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_billing_access_overrides ENABLE ROW LEVEL SECURITY;

-- Business users can view their own overrides if we want to show "Complimentary" badge
CREATE POLICY "Users can view active overrides for their business" ON public.business_billing_access_overrides 
FOR SELECT TO authenticated 
USING (
  revoked_at IS NULL AND
  EXISTS (SELECT 1 FROM public.business_memberships WHERE business_id = public.business_billing_access_overrides.business_id AND user_id = auth.uid())
);

-- Platform Admins must manage this via Server/Service Role
-- Trigger for updated_at
CREATE TRIGGER set_business_billing_access_overrides_updated_at 
  BEFORE UPDATE ON public.business_billing_access_overrides 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add simple audit tracking for these actions
CREATE OR REPLACE FUNCTION public.audit_billing_override_grant() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.platform_audit_events (actor_id, action, target_type, target_id, reason, metadata)
  VALUES (
    NEW.created_by_platform_admin_id,
    'grant_billing_override',
    'business_billing_access_overrides',
    NEW.id,
    NEW.reason,
    jsonb_build_object(
      'business_id', NEW.business_id,
      'override_type', NEW.override_type,
      'ends_at', NEW.ends_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_billing_override_grant
  AFTER INSERT ON public.business_billing_access_overrides
  FOR EACH ROW EXECUTE FUNCTION public.audit_billing_override_grant();

CREATE OR REPLACE FUNCTION public.audit_billing_override_revoke() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.revoked_at IS NOT NULL AND OLD.revoked_at IS NULL THEN
    INSERT INTO public.platform_audit_events (actor_id, action, target_type, target_id, reason, metadata)
    VALUES (
      NEW.revoked_by_platform_admin_id,
      'revoke_billing_override',
      'business_billing_access_overrides',
      NEW.id,
      NEW.revoke_reason,
      jsonb_build_object('business_id', NEW.business_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_billing_override_revoke
  AFTER UPDATE OF revoked_at ON public.business_billing_access_overrides
  FOR EACH ROW EXECUTE FUNCTION public.audit_billing_override_revoke();
