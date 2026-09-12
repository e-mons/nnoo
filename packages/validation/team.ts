import { z } from 'zod';

export const BUSINESS_ROLES = [
  'owner',
  'business_admin',
  'manager',
  'sales_staff',
  'inventory_staff',
  'accountant',
  'read_only'
] as const;

export type BusinessRole = typeof BUSINESS_ROLES[number];

export const ROLE_DESCRIPTIONS: Record<BusinessRole, string> = {
  owner: 'Full control of this business and its team.',
  business_admin: 'Helps manage business settings and team access.',
  manager: 'Manages day-to-day business operations.',
  sales_staff: 'For team members who handle sales and customers.',
  inventory_staff: 'For team members responsible for products and stock.',
  accountant: 'For team members responsible for financial records and reports.',
  read_only: 'Can view permitted business information without making changes.'
};

export const ROLE_LABELS: Record<BusinessRole, string> = {
  owner: 'Owner',
  business_admin: 'Business Administrator',
  manager: 'Manager',
  sales_staff: 'Sales Staff',
  inventory_staff: 'Inventory Staff',
  accountant: 'Accountant / Bookkeeper',
  read_only: 'Read Only'
};

export const invitationSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
  role: z.enum(BUSINESS_ROLES, {
    errorMap: () => ({ message: 'Please select a valid business role.' }),
  }),
});

export type InvitationFormData = z.infer<typeof invitationSchema>;

export const MEMBERSHIP_STATUSES = ['active', 'inactive', 'revoked'] as const;

export const updateMembershipSchema = z.object({
  role: z.enum(BUSINESS_ROLES).optional(),
  status: z.enum(MEMBERSHIP_STATUSES).optional(),
}).refine(data => data.role !== undefined || data.status !== undefined, {
  message: 'Either role or status must be provided to update a membership.'
});

export type UpdateMembershipData = z.infer<typeof updateMembershipSchema>;
