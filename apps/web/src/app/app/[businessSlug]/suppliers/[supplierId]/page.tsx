import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getSupplier } from '@/lib/actions/supplier';
import { Truck, Mail, Phone, MapPin, Building, ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { SupplierActions } from '@/components/suppliers/supplier-actions';

export const metadata: Metadata = {
  title: 'Supplier Details | NNOO',
  description: 'View supplier details.',
};

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ businessSlug: string; supplierId: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', resolvedParams.businessSlug)
    .single();

  if (!business) {
    return <div className="text-white p-8">Business not found.</div>;
  }

  const { data: supplier, error } = await getSupplier(business.id, resolvedParams.supplierId);

  if (error || !supplier) {
    return <div className="text-white p-8">Supplier not found or access denied.</div>;
  }

  // Check roles for permissions (Archive requires owner/business_admin/manager)
  const { data: canArchive } = await supabase.rpc('has_business_role', {
    business_id: business.id,
    allowed_roles: ['owner', 'business_admin', 'manager']
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link
            href={`/app/${resolvedParams.businessSlug}/suppliers`}
            className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Suppliers
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Truck className="w-7 h-7 text-[#B8F25C]" />
            {supplier.name}
            {supplier.status === 'archived' && (
              <span className="text-xs font-medium bg-white/10 text-white/50 px-2 py-1 rounded-md uppercase tracking-wider">
                Archived
              </span>
            )}
          </h1>
          {supplier.supplierType === 'business' && supplier.companyName && (
            <p className="text-white/60 text-lg flex items-center gap-2 mt-2">
              <Building className="w-5 h-5" />
              {supplier.companyName}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <SupplierActions
            businessId={business.id}
            businessSlug={resolvedParams.businessSlug}
            supplierId={supplier.id}
            currentStatus={supplier.status}
            canArchive={!!canArchive}
          />
          <Link
            href={`/app/${resolvedParams.businessSlug}/suppliers/${supplier.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info Card */}
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-medium text-white mb-6">Contact Information</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-white/40 mt-0.5" />
              <div>
                <p className="text-sm text-white/50 mb-1">Email Address</p>
                <p className="text-white font-medium">{supplier.email || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone className="w-5 h-5 text-white/40 mt-0.5" />
              <div>
                <p className="text-sm text-white/50 mb-1">Phone Number</p>
                <p className="text-white font-medium">{supplier.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-medium text-white mb-6">Address</h3>
          
          <div className="flex items-start gap-4">
            <MapPin className="w-5 h-5 text-white/40 mt-0.5" />
            <div>
              <p className="text-sm text-white/50 mb-1">Physical Address</p>
              <div className="text-white font-medium space-y-1">
                {supplier.addressLine1 ? (
                  <>
                    <p>{supplier.addressLine1}</p>
                    {supplier.addressLine2 && <p>{supplier.addressLine2}</p>}
                    <p>
                      {[supplier.city, supplier.state, supplier.countryCode].filter(Boolean).join(', ')}
                    </p>
                  </>
                ) : (
                  <p className="text-white/40 italic">No address provided</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Metadata */}
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl md:col-span-2">
          <h3 className="text-lg font-medium text-white mb-4">Internal Notes</h3>
          {supplier.notes ? (
            <p className="text-white/80 whitespace-pre-wrap">{supplier.notes}</p>
          ) : (
            <p className="text-white/40 italic">No internal notes for this supplier.</p>
          )}
          
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-x-8 gap-y-4 text-xs text-white/40">
            <p>Created: {new Date(supplier.createdAt).toLocaleDateString('en-US')}</p>
            <p>Last updated: {new Date(supplier.updatedAt).toLocaleDateString('en-US')}</p>
            <p>ID: {supplier.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
