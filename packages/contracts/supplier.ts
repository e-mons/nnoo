export type SupplierType = 'individual' | 'business';
export type SupplierStatus = 'active' | 'archived';

/**
 * The canonical NNOO Supplier model.
 * Supplier Management stores identity and contact information.
 * Conceptually: Business -> Supplier.
 */
export interface Supplier {
  id: string;
  businessId: string;
  supplierType: SupplierType;
  name: string;
  companyName: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  countryCode: string | null;
  notes: string | null;
  status: SupplierStatus;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

/**
 * Payload used to create a new supplier.
 */
export interface CreateSupplierDraft {
  supplierType: SupplierType;
  name: string;
  companyName?: string | null;
  contactPerson?: string | null;
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
 * Payload used to update an existing supplier.
 */
export interface UpdateSupplierDraft {
  supplierType?: SupplierType;
  name?: string;
  companyName?: string | null;
  contactPerson?: string | null;
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
export interface SupplierDuplicateCandidate {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}
