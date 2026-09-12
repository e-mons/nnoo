import { Database } from '@nnoo/supabase';

export type BillingInterval = Database['public']['Enums']['billing_interval'];
export type BillingSubscriptionStatus = Database['public']['Enums']['billing_subscription_status'];
export type BillingTransactionStatus = Database['public']['Enums']['billing_transaction_status'];
export type BillingTransactionType = Database['public']['Enums']['billing_transaction_type'];
export type BillingWebhookStatus = Database['public']['Enums']['billing_webhook_status'];
export type BillingOverrideType = Database['public']['Enums']['billing_override_type'];

export type BillingPlan = Database['public']['Tables']['billing_plans']['Row'];
export type BusinessSubscription = Database['public']['Tables']['business_subscriptions']['Row'];
export type BillingTransaction = Database['public']['Tables']['billing_transactions']['Row'];
export type BusinessBillingCustomer = Database['public']['Tables']['business_billing_customers']['Row'];
export type BillingWebhookEvent = Database['public']['Tables']['billing_webhook_events']['Row'];
export type BusinessBillingAccessOverride = Database['public']['Tables']['business_billing_access_overrides']['Row'];

export interface InitializeCheckoutParams {
  businessId: string;
  planCode: string; // The internal code, e.g. nnoo_standard_test_monthly
}

export interface CheckoutResponse {
  authorizationUrl: string;
  reference: string;
}

export interface VerifyCallbackParams {
  businessId: string;
  reference: string;
}

export interface PaystackWebhookEvent {
  event: string;
  data: any;
}
