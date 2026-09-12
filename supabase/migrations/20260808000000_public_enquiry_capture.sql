-- =============================================================
-- Migration: Public Enquiry Capture
-- Purpose:   Create contact_enquiries table for lead capture
--            from the public marketing website.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.contact_enquiries (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  business_name text,
  category text NOT NULL CHECK (category IN ('general', 'product', 'business_support', 'partnership', 'other')),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  source text NOT NULL DEFAULT 'homepage',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contact_enquiries_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.contact_enquiries IS 'Stores public enquiries and leads submitted from the marketing website.';

CREATE TRIGGER set_contact_enquiries_updated_at
  BEFORE UPDATE ON public.contact_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;

-- Note: We intentionally do NOT create a public insert policy.
-- Public submissions are handled via a Next.js Server Action 
-- that uses the Supabase Service Role client to bypass RLS.
-- This ensures only our validated backend can insert records.
-- Platform admins will view these via Service Role as well.

-- Create an index on status and created_at for faster admin queries
CREATE INDEX IF NOT EXISTS idx_contact_enquiries_status_created_at 
  ON public.contact_enquiries(status, created_at DESC);
