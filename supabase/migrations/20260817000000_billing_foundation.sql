-- T2-P10: Paystack Subscription Billing Foundation
-- Explicitly isolated from operational financial accounting (Prompt 5/8)

-- Billing enums
CREATE TYPE public.billing_interval AS ENUM ('monthly', 'annual');
CREATE TYPE public.billing_subscription_status AS ENUM ('pending', 'active', 'past_due', 'non_renewing', 'cancelled', 'inactive', 'complimentary');
CREATE TYPE public.billing_transaction_status AS ENUM ('pending', 'success', 'failed');
CREATE TYPE public.billing_transaction_type AS ENUM ('initial_subscription', 'renewal', 'manual_recovery', 'plan_change');
CREATE TYPE public.billing_webhook_status AS ENUM ('pending', 'processed', 'failed');

-- 1. Internal Billing Plans
CREATE TABLE public.billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  currency_code TEXT NOT NULL DEFAULT 'NGN',
  amount_minor BIGINT NOT NULL,
  billing_interval public.billing_interval NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT amount_minor_positive CHECK (amount_minor >= 0)
);

ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Billing plans are viewable by all users" ON public.billing_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Platform admins can manage billing plans" ON public.billing_plans FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND status = 'active')
);

-- 2. Provider Mappings (Test vs Live separation)
CREATE TABLE public.billing_plan_provider_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_plan_id UUID NOT NULL REFERENCES public.billing_plans(id),
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_environment TEXT NOT NULL CHECK (provider_environment IN ('test', 'live')),
  provider_plan_code TEXT NOT NULL,
  provider_plan_id TEXT,
  synced_amount_minor BIGINT,
  synced_currency_code TEXT,
  synced_interval TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(billing_plan_id, provider, provider_environment),
  UNIQUE(provider, provider_environment, provider_plan_code)
);

ALTER TABLE public.billing_plan_provider_mappings ENABLE ROW LEVEL SECURITY;
-- No public RLS. Only Server/Service Role uses this table securely.

-- 3. Business Billing Customers (Paystack Customer Mapping)
CREATE TABLE public.business_billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_environment TEXT NOT NULL CHECK (provider_environment IN ('test', 'live')),
  provider_customer_code TEXT NOT NULL,
  provider_customer_id TEXT,
  billing_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, provider, provider_environment)
);

ALTER TABLE public.business_billing_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their business billing customers" ON public.business_billing_customers FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.business_memberships WHERE business_id = public.business_billing_customers.business_id AND user_id = auth.uid())
);

-- 4. Business Subscriptions
CREATE TABLE public.business_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  billing_plan_id UUID NOT NULL REFERENCES public.billing_plans(id),
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_environment TEXT NOT NULL CHECK (provider_environment IN ('test', 'live')),
  provider_subscription_code TEXT,
  provider_customer_code TEXT,
  normalized_status public.billing_subscription_status NOT NULL DEFAULT 'pending',
  provider_status TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_payment_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  latest_successful_payment_at TIMESTAMPTZ,
  latest_failed_payment_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, provider_environment) -- One active subscription per env
);

ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their business subscriptions" ON public.business_subscriptions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.business_memberships WHERE business_id = public.business_subscriptions.business_id AND user_id = auth.uid())
);

-- 5. Billing Transactions (Immutable record of payments)
CREATE TABLE public.billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  business_subscription_id UUID REFERENCES public.business_subscriptions(id),
  billing_plan_id UUID NOT NULL REFERENCES public.billing_plans(id),
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_environment TEXT NOT NULL CHECK (provider_environment IN ('test', 'live')),
  provider_reference TEXT NOT NULL,
  provider_transaction_id TEXT,
  transaction_type public.billing_transaction_type NOT NULL,
  amount_minor BIGINT NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'NGN',
  normalized_status public.billing_transaction_status NOT NULL DEFAULT 'pending',
  provider_status TEXT,
  channel TEXT,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  provider_customer_code TEXT,
  provider_subscription_code TEXT,
  raw_event_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_environment, provider_reference)
);

ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their business billing transactions" ON public.billing_transactions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.business_memberships WHERE business_id = public.billing_transactions.business_id AND user_id = auth.uid())
);

-- 6. Billing Webhook Events
CREATE TABLE public.billing_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_environment TEXT NOT NULL CHECK (provider_environment IN ('test', 'live')),
  event_type TEXT NOT NULL,
  event_dedupe_key TEXT NOT NULL,
  provider_reference TEXT,
  provider_subscription_code TEXT,
  payload_hash TEXT NOT NULL,
  processing_status public.billing_webhook_status NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  failure_code TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_environment, event_dedupe_key)
);

ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;
-- No public RLS. Server only.

-- Triggers for updated_at
CREATE TRIGGER set_billing_plans_updated_at BEFORE UPDATE ON public.billing_plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_billing_plan_provider_mappings_updated_at BEFORE UPDATE ON public.billing_plan_provider_mappings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_business_billing_customers_updated_at BEFORE UPDATE ON public.business_billing_customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_business_subscriptions_updated_at BEFORE UPDATE ON public.business_subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_billing_transactions_updated_at BEFORE UPDATE ON public.billing_transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed Test Plan (Test Fixture ONLY. Not real commercial pricing)
INSERT INTO public.billing_plans (code, name, description, amount_minor, billing_interval, is_active, sort_order)
VALUES 
  ('nnoo_standard_test_monthly', 'Standard (Test)', 'Test Only Monthly Billing', 500000, 'monthly', true, 1),
  ('nnoo_standard_test_annual', 'Standard Annual (Test)', 'Test Only Annual Billing', 5000000, 'annual', true, 2);

-- We assume some dummy provider_plan_code for tests
INSERT INTO public.billing_plan_provider_mappings (billing_plan_id, provider_environment, provider_plan_code)
SELECT id, 'test', 'PLN_test_' || code FROM public.billing_plans WHERE code LIKE 'nnoo_standard_test_%';
