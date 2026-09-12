import { BusinessRole } from '@nnoo/validation/team';

export type FeatureModule = 
  | 'dashboard'
  | 'bookkeeper'
  | 'sales'
  | 'invoices'
  | 'receipts'
  | 'inventory'
  | 'products'
  | 'expenses'
  | 'customers'
  | 'suppliers'
  | 'reports'
  | 'insights'
  | 'assistant'
  | 'health_score'
  | 'credit_passport'
  | 'automations'
  | 'notifications'
  | 'settings';

export const ROLE_PERMISSIONS: Record<FeatureModule, BusinessRole[]> = {
  dashboard: ['owner', 'business_admin', 'manager', 'sales_staff', 'inventory_staff', 'accountant', 'read_only'],
  bookkeeper: ['owner', 'business_admin', 'manager', 'accountant'],
  sales: ['owner', 'business_admin', 'manager', 'sales_staff', 'read_only'],
  invoices: ['owner', 'business_admin', 'manager', 'sales_staff', 'accountant', 'read_only'],
  receipts: ['owner', 'business_admin', 'manager', 'sales_staff', 'accountant', 'read_only'],
  inventory: ['owner', 'business_admin', 'manager', 'inventory_staff', 'read_only'],
  products: ['owner', 'business_admin', 'manager', 'inventory_staff', 'read_only'],
  expenses: ['owner', 'business_admin', 'manager', 'accountant', 'read_only'],
  customers: ['owner', 'business_admin', 'manager', 'sales_staff', 'read_only'],
  suppliers: ['owner', 'business_admin', 'manager', 'inventory_staff', 'read_only'],
  reports: ['owner', 'business_admin', 'manager', 'accountant'],
  insights: ['owner', 'business_admin', 'manager', 'accountant'],
  assistant: ['owner', 'business_admin', 'manager', 'sales_staff', 'inventory_staff', 'accountant', 'read_only'],
  health_score: ['owner', 'business_admin', 'manager', 'accountant'],
  credit_passport: ['owner', 'business_admin', 'manager', 'accountant'],
  automations: ['owner', 'business_admin', 'manager', 'accountant'],
  notifications: ['owner', 'business_admin', 'manager', 'sales_staff', 'inventory_staff', 'accountant', 'read_only'],
  settings: ['owner', 'business_admin']
};

export function hasPermission(role: string | null | undefined, feature: FeatureModule): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[feature].includes(role as BusinessRole);
}
