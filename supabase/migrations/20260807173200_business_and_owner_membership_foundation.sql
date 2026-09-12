-- Create handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  legal_name text,
  industry text NOT NULL,
  country_code text NOT NULL DEFAULT 'NG',
  currency_code text NOT NULL DEFAULT 'NGN',
  timezone text NOT NULL DEFAULT 'Africa/Lagos',
  state text,
  local_government_area text,
  city text,
  address_line_1 text,
  address_line_2 text,
  phone text,
  email text,
  registration_number text,
  tax_identifier text,
  logo_path text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT businesses_pkey PRIMARY KEY (id)
);

-- Create business_memberships table
CREATE TABLE IF NOT EXISTS public.business_memberships (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  membership_status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT business_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT business_memberships_business_id_user_id_key UNIQUE (business_id, user_id)
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;

-- RLS for business_memberships
CREATE POLICY "Users can view their own memberships" ON public.business_memberships
  FOR SELECT USING (auth.uid() = user_id);

-- RLS for businesses
CREATE POLICY "Users can view businesses they belong to" ON public.businesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships
      WHERE business_memberships.business_id = businesses.id
      AND business_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update businesses" ON public.businesses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships
      WHERE business_memberships.business_id = businesses.id
      AND business_memberships.user_id = auth.uid()
      AND business_memberships.role = 'owner'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_memberships
      WHERE business_memberships.business_id = businesses.id
      AND business_memberships.user_id = auth.uid()
      AND business_memberships.role = 'owner'
    )
  );

-- Function to atomically create a business and owner membership
CREATE OR REPLACE FUNCTION public.create_business_with_owner(
  name text,
  industry text,
  country_code text DEFAULT 'NG',
  currency_code text DEFAULT 'NGN',
  timezone text DEFAULT 'Africa/Lagos',
  state text DEFAULT NULL,
  local_government_area text DEFAULT NULL,
  city text DEFAULT NULL,
  address_line_1 text DEFAULT NULL,
  address_line_2 text DEFAULT NULL,
  phone text DEFAULT NULL,
  email text DEFAULT NULL,
  registration_number text DEFAULT NULL,
  tax_identifier text DEFAULT NULL
) RETURNS public.businesses AS $$
DECLARE
  new_business public.businesses;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.businesses (
    name, industry, country_code, currency_code, timezone, state, 
    local_government_area, city, address_line_1, address_line_2, 
    phone, email, registration_number, tax_identifier
  ) VALUES (
    name, industry, country_code, currency_code, timezone, state, 
    local_government_area, city, address_line_1, address_line_2, 
    phone, email, registration_number, tax_identifier
  ) RETURNING * INTO new_business;

  INSERT INTO public.business_memberships (
    business_id, user_id, role, membership_status
  ) VALUES (
    new_business.id, auth.uid(), 'owner', 'active'
  );

  RETURN new_business;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE TRIGGER set_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_business_memberships_updated_at
  BEFORE UPDATE ON public.business_memberships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
