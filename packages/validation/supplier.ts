import { z } from 'zod';

export const supplierTypeSchema = z.enum(['individual', 'business']);

export const createSupplierSchema = z.object({
  supplierType: supplierTypeSchema,
  name: z.string().min(1, 'Name is required').max(150, 'Name must be 150 characters or less'),
  companyName: z.string().max(150, 'Company name must be 150 characters or less').nullable().optional(),
  contactPerson: z.string().max(150, 'Contact person must be 150 characters or less').nullable().optional(),
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
    if (data.supplierType === 'business' && (!data.companyName || data.companyName.trim() === '')) {
      return false;
    }
    return true;
  },
  {
    message: 'Company name is required for business suppliers',
    path: ['companyName'],
  }
);

export const updateSupplierSchema = z.object({
  supplierType: supplierTypeSchema.optional(),
  name: z.string().min(1, 'Name is required').max(150, 'Name must be 150 characters or less').optional(),
  companyName: z.string().max(150, 'Company name must be 150 characters or less').nullable().optional(),
  contactPerson: z.string().max(150, 'Contact person must be 150 characters or less').nullable().optional(),
  phone: z.string().max(30, 'Phone number must be 30 characters or less').nullable().optional(),
  email: z.string().email('Invalid email address').max(255).nullable().optional().or(z.literal('')),
  addressLine1: z.string().max(255).nullable().optional(),
  addressLine2: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  countryCode: z.string().max(2, 'Country code must be 2 letters').nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});
