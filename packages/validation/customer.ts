import { z } from 'zod';

export const customerTypeSchema = z.enum(['individual', 'business']);

export const createCustomerSchema = z.object({
  customerType: customerTypeSchema,
  name: z.string().min(1, 'Name is required').max(150, 'Name must be 150 characters or less'),
  companyName: z.string().max(150, 'Company name must be 150 characters or less').nullable().optional(),
  phone: z.string().max(30, 'Phone number must be 30 characters or less').nullable().optional(),
  email: z.string().email('Invalid email address').max(255).nullable().optional().or(z.literal('')),
  addressLine1: z.string().max(255).nullable().optional(),
  addressLine2: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  countryCode: z.string().max(2, 'Country code must be 2 letters').nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
}).refine(
  (data) => {
    if (data.customerType === 'business' && (!data.companyName || data.companyName.trim() === '')) {
      return false;
    }
    return true;
  },
  {
    message: 'Company name is required for business customers',
    path: ['companyName'],
  }
);

export const updateCustomerSchema = z.object({
  customerType: customerTypeSchema.optional(),
  name: z.string().min(1, 'Name is required').max(150, 'Name must be 150 characters or less').optional(),
  companyName: z.string().max(150, 'Company name must be 150 characters or less').nullable().optional(),
  phone: z.string().max(30, 'Phone number must be 30 characters or less').nullable().optional(),
  email: z.string().email('Invalid email address').max(255).nullable().optional().or(z.literal('')),
  addressLine1: z.string().max(255).nullable().optional(),
  addressLine2: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  countryCode: z.string().max(2, 'Country code must be 2 letters').nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});
