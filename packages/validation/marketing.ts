import { z } from 'zod';

export const enquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long').trim(),
  email: z.string().email('Please enter a valid email address').max(255).trim().toLowerCase(),
  phone: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
  business_name: z.string().max(100, 'Business name is too long').optional().or(z.literal('')),
  category: z.enum(['general', 'product', 'business_support', 'partnership', 'other'], {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long').trim(),
  honeypot: z.string().max(0, 'Invalid request').optional()
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const updateEnquiryStatusSchema = z.object({
  status: z.enum(['new', 'in_progress', 'resolved', 'closed']),
});
