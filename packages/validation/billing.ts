import { z } from 'zod';

export const initializeCheckoutParamsSchema = z.object({
  businessId: z.string().uuid(),
  planCode: z.string().min(1)
});

export const verifyCallbackParamsSchema = z.object({
  businessId: z.string().uuid(),
  reference: z.string().min(1)
});

// We keep the payload relatively untyped in Zod because we must parse it
// according to Paystack's official docs during the webhook handler itself
export const paystackWebhookEventSchema = z.object({
  event: z.string(),
  data: z.record(z.any())
});

export const createBillingPlanSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  amountMinor: z.number().min(0),
  currencyCode: z.string().default('NGN'),
  billingInterval: z.enum(['monthly', 'annual'])
});

export const grantOverrideSchema = z.object({
  businessId: z.string().uuid(),
  overrideType: z.enum(['complimentary', 'temporary_extension', 'migration', 'internal_test']),
  endsAt: z.string().datetime().optional().nullable(),
  reason: z.string().min(5)
});

