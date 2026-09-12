-- Create business_invitations table
CREATE TABLE IF NOT EXISTS public.business_invitations (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  token_hash text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamp with time zone NOT NULL,
  last_sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT business_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT business_invitations_business_id_email_key UNIQUE (business_id, email)
);

-- Enable RLS
ALTER TABLE public.business_invitations ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER set_business_invitations_updated_at
  BEFORE UPDATE ON public.business_invitations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS Helper Function: has_business_role
CREATE OR REPLACE FUNCTION public.has_business_role(
  business_id uuid,
  allowed_roles text[]
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.business_memberships bm
    WHERE bm.business_id = has_business_role.business_id
    AND bm.user_id = auth.uid()
    AND bm.membership_status = 'active'
    AND bm.role = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for business_invitations
-- Members with owner or business_admin can view invitations for their business
CREATE POLICY "Authorized members can view invitations" ON public.business_invitations
  FOR SELECT USING (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin'])
  );

-- Function: create_business_invitation
CREATE OR REPLACE FUNCTION public.create_business_invitation(
  p_business_id uuid,
  p_email text,
  p_role text,
  p_token_hash text,
  p_expires_in_days integer DEFAULT 7
) RETURNS public.business_invitations AS $$
DECLARE
  v_invitation public.business_invitations;
  v_current_role text;
  v_normalized_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_normalized_email := lower(trim(p_email));

  -- Verify permissions
  -- Owner can invite anyone. Admin can invite non-owners.
  SELECT role INTO v_current_role FROM public.business_memberships
  WHERE business_id = p_business_id AND user_id = auth.uid() AND membership_status = 'active';

  IF v_current_role IS NULL THEN
    RAISE EXCEPTION 'Not a member of this business';
  END IF;

  IF v_current_role != 'owner' AND v_current_role != 'business_admin' THEN
    RAISE EXCEPTION 'Not authorized to create invitations';
  END IF;

  IF v_current_role = 'business_admin' AND p_role = 'owner' THEN
    RAISE EXCEPTION 'Business administrators cannot invite owners';
  END IF;

  -- Check if already an active member
  IF EXISTS (
    SELECT 1 FROM public.business_memberships bm
    JOIN auth.users u ON u.id = bm.user_id
    WHERE bm.business_id = p_business_id AND lower(u.email) = v_normalized_email AND bm.membership_status = 'active'
  ) THEN
    RAISE EXCEPTION 'User is already an active member of this business';
  END IF;

  -- Upsert invitation
  INSERT INTO public.business_invitations (
    business_id, email, role, token_hash, invited_by, expires_at, last_sent_at, status
  ) VALUES (
    p_business_id, v_normalized_email, p_role, p_token_hash, auth.uid(), now() + (p_expires_in_days || ' days')::interval, now(), 'pending'
  )
  ON CONFLICT (business_id, email) DO UPDATE SET
    role = EXCLUDED.role,
    token_hash = EXCLUDED.token_hash,
    invited_by = EXCLUDED.invited_by,
    expires_at = EXCLUDED.expires_at,
    last_sent_at = EXCLUDED.last_sent_at,
    status = 'pending',
    updated_at = now()
  RETURNING * INTO v_invitation;

  RETURN v_invitation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: accept_business_invitation
CREATE OR REPLACE FUNCTION public.accept_business_invitation(
  p_token_hash text
) RETURNS public.business_memberships AS $$
DECLARE
  v_invitation public.business_invitations;
  v_membership public.business_memberships;
  v_user_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  -- Find invitation
  SELECT * INTO v_invitation FROM public.business_invitations
  WHERE token_hash = p_token_hash AND status = 'pending';

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invalid or already processed invitation';
  END IF;

  IF v_invitation.expires_at < now() THEN
    UPDATE public.business_invitations SET status = 'expired', updated_at = now() WHERE id = v_invitation.id;
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  IF lower(v_user_email) != lower(v_invitation.email) THEN
    RAISE EXCEPTION 'This invitation is for a different email address';
  END IF;

  -- Create or update membership
  INSERT INTO public.business_memberships (
    business_id, user_id, role, membership_status
  ) VALUES (
    v_invitation.business_id, auth.uid(), v_invitation.role, 'active'
  )
  ON CONFLICT (business_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    membership_status = 'active',
    updated_at = now()
  RETURNING * INTO v_membership;

  -- Mark accepted
  UPDATE public.business_invitations SET status = 'accepted', updated_at = now() WHERE id = v_invitation.id;

  RETURN v_membership;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: revoke_business_invitation
CREATE OR REPLACE FUNCTION public.revoke_business_invitation(
  p_invitation_id uuid
) RETURNS void AS $$
DECLARE
  v_invitation public.business_invitations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invitation FROM public.business_invitations WHERE id = p_invitation_id;
  
  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF NOT public.has_business_role(v_invitation.business_id, ARRAY['owner', 'business_admin']) THEN
    RAISE EXCEPTION 'Not authorized to revoke invitations';
  END IF;

  UPDATE public.business_invitations SET status = 'revoked', updated_at = now() WHERE id = p_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: update_business_membership
CREATE OR REPLACE FUNCTION public.update_business_membership(
  p_membership_id uuid,
  p_role text,
  p_status text
) RETURNS public.business_memberships AS $$
DECLARE
  v_target_membership public.business_memberships;
  v_current_role text;
  v_active_owners_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_target_membership FROM public.business_memberships WHERE id = p_membership_id;

  IF v_target_membership IS NULL THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  -- Get current user's role in that business
  SELECT role INTO v_current_role FROM public.business_memberships
  WHERE business_id = v_target_membership.business_id AND user_id = auth.uid() AND membership_status = 'active';

  IF v_current_role IS NULL THEN
    RAISE EXCEPTION 'Not a member of this business';
  END IF;

  IF v_current_role != 'owner' AND v_current_role != 'business_admin' THEN
    RAISE EXCEPTION 'Not authorized to update memberships';
  END IF;

  -- Business admin limitations
  IF v_current_role = 'business_admin' THEN
    IF v_target_membership.role = 'owner' OR p_role = 'owner' THEN
      RAISE EXCEPTION 'Business administrators cannot manage owners';
    END IF;
  END IF;

  -- Last owner protection
  IF v_target_membership.role = 'owner' AND (p_role != 'owner' OR p_status != 'active') THEN
    SELECT count(*) INTO v_active_owners_count 
    FROM public.business_memberships 
    WHERE business_id = v_target_membership.business_id 
    AND role = 'owner' 
    AND membership_status = 'active';

    IF v_active_owners_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote or deactivate the last active owner';
    END IF;
  END IF;

  UPDATE public.business_memberships SET 
    role = COALESCE(p_role, role), 
    membership_status = COALESCE(p_status, membership_status), 
    updated_at = now() 
  WHERE id = p_membership_id
  RETURNING * INTO v_target_membership;

  RETURN v_target_membership;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View: team_members_view
-- Safe projection combining memberships and profiles for authorized users
CREATE OR REPLACE VIEW public.team_members_view AS
SELECT 
  bm.id as membership_id,
  bm.business_id,
  bm.user_id,
  bm.role,
  bm.membership_status,
  bm.created_at as joined_at,
  p.first_name,
  p.last_name,
  p.avatar_url,
  u.email
FROM public.business_memberships bm
JOIN public.profiles p ON p.id = bm.user_id
JOIN auth.users u ON u.id = bm.user_id
WHERE public.has_business_role(bm.business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'inventory_staff', 'accountant', 'read_only']);
