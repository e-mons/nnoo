export type CustomerType = 'individual' | 'business';
export type CustomerStatus = 'active' | 'archived';

/**
 * The canonical NNOO Customer model.
 * Note: Database uses snake_case, but this contract is strictly camelCase.
 * Financial journal logic and tracking are explicitly kept separate.
 */
export interface Customer {
  id: string;
  businessId: string;
  customerType: CustomerType;
  name: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  countryCode: string | null;
  notes: string | null;
  status: CustomerStatus;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

/**
 * Payload used to create a new customer.
 */
export interface CreateCustomerDraft {
  customerType: CustomerType;
  name: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  countryCode?: string | null;
  notes?: string | null;
}

/**
 * Payload used to update an existing customer.
 */
export interface UpdateCustomerDraft {
  customerType?: CustomerType;
  name?: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  countryCode?: string | null;
  notes?: string | null;
}

/**
 * Interface returned by the server if a potential duplicate is detected.
 */
export interface CustomerDuplicateCandidate {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}
