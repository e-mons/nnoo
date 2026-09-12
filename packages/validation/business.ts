import { z } from 'zod';

export const INDUSTRY_OPTIONS = [
  'Market Trader',
  'Pharmacy',
  'Restaurant',
  'School',
  'Church',
  'Farm',
  'Hotel',
  'Transport',
  'Manufacturing',
  'Other'
] as const;

export const businessOnboardingSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal('')),
  industry: z.enum(INDUSTRY_OPTIONS, {
    errorMap: () => ({ message: 'Please select a valid industry' })
  }),
  country_code: z.string().default('NG'),
  state: z.string().optional(),
  local_government_area: z.string().optional(),
  city: z.string().optional(),
  address_line_1: z.string().optional(),
  registration_number: z.string().optional(),
  tax_identifier: z.string().optional()
});

export const businessProfileUpdateSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").optional(),
  legal_name: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal('')),
  industry: z.enum(INDUSTRY_OPTIONS).optional(),
  state: z.string().optional(),
  local_government_area: z.string().optional(),
  city: z.string().optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  registration_number: z.string().optional(),
  tax_identifier: z.string().optional()
});

export type BusinessOnboardingFormValues = z.infer<typeof businessOnboardingSchema>;
export type BusinessProfileUpdateValues = z.infer<typeof businessProfileUpdateSchema>;
