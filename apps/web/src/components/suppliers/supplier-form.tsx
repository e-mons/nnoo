'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSupplierSchema } from '@nnoo/validation';
import { CreateSupplierDraft, SupplierDuplicateCandidate } from '@nnoo/contracts';
import { createSupplier, updateSupplier } from '@/lib/actions/supplier';
import { Save, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SupplierFormProps {
  businessId: string;
  businessSlug: string;
  initialData?: Partial<CreateSupplierDraft>;
  supplierId?: string;
  isEdit?: boolean;
}

export function SupplierForm({ businessId, businessSlug, initialData, supplierId, isEdit }: SupplierFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<SupplierDuplicateCandidate[] | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateSupplierDraft>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: initialData || {
      supplierType: 'business', // Default suppliers to business mostly
      name: '',
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      countryCode: '',
      notes: '',
    },
  });

  const supplierType = useWatch({ control, name: 'supplierType' });

  const onSubmit = async (data: CreateSupplierDraft) => {
    setIsSubmitting(true);
    setError(null);
    setDuplicates(null);

    try {
      if (isEdit && supplierId) {
        const result = await updateSupplier(businessId, supplierId, data);
        if (!result.success) {
          setError(result.error || 'Failed to update supplier');
          setIsSubmitting(false);
          return;
        }
        router.push(`/app/${businessSlug}/suppliers/${supplierId}`);
        router.refresh();
      } else {
        const result = await createSupplier(businessId, data);
        if (!result.success) {
          setError(result.error || 'Failed to create supplier');
          setIsSubmitting(false);
          return;
        }
        
        if (result.duplicateCandidates && result.duplicateCandidates.length > 0) {
          setDuplicates(result.duplicateCandidates);
        }
        
        setTimeout(() => {
           router.push(`/app/${businessSlug}/suppliers`);
           router.refresh();
        }, result.duplicateCandidates ? 3000 : 0);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {duplicates && duplicates.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Supplier created, but potential duplicates found:</p>
            <ul className="list-disc pl-4 space-y-1">
              {duplicates.map(d => (
                <li key={d.id}>{d.name} ({d.email || 'No email'}, {d.phone || 'No phone'})</li>
              ))}
            </ul>
            <p className="mt-2 text-amber-500/70">Redirecting to list...</p>
          </div>
        </div>
      )}

      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-medium text-white mb-6">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Supplier Type</label>
            <select
              {...register('supplierType')}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors appearance-none"
            >
              <option value="business">Business / Organisation</option>
              <option value="individual">Individual</option>
            </select>
            {errors.supplierType && (
              <p className="text-red-400 text-xs mt-1">{errors.supplierType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">
              Supplier Name <span className="text-[#B8F25C]">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder={supplierType === 'business' ? 'e.g. Alaba Wholesale Supplies' : 'e.g. Musa Haruna'}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {supplierType === 'business' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Company Name <span className="text-[#B8F25C]">*</span></label>
              <input
                type="text"
                {...register('companyName')}
                placeholder="e.g. Prime Agro Logistics Ltd"
                className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
              />
              {errors.companyName && (
                <p className="text-red-400 text-xs mt-1">{errors.companyName.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Contact Person</label>
            <input
              type="text"
              {...register('contactPerson')}
              placeholder="e.g. Jane Doe"
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
            {errors.contactPerson && (
              <p className="text-red-400 text-xs mt-1">{errors.contactPerson.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Email Address</label>
            <input
              type="email"
              {...register('email')}
              placeholder="e.g. supplier@example.com"
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Phone Number</label>
            <input
              type="text"
              {...register('phone')}
              placeholder="e.g. +1 555 0123"
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
            {errors.phone && (
              <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-medium text-white mb-6">Address & Notes</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-white/70">Address Line 1</label>
            <input
              type="text"
              {...register('addressLine1')}
              placeholder="e.g. 123 Main St"
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-white/70">Address Line 2</label>
            <input
              type="text"
              {...register('addressLine2')}
              placeholder="e.g. Suite 400"
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">City</label>
            <input
              type="text"
              {...register('city')}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">State / Province</label>
            <input
              type="text"
              {...register('state')}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Country Code (2 letters)</label>
            <input
              type="text"
              {...register('countryCode')}
              placeholder="e.g. US, NG, GB"
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors uppercase"
            />
            {errors.countryCode && (
              <p className="text-red-400 text-xs mt-1">{errors.countryCode.message}</p>
            )}
          </div>
          
          <div className="space-y-2 md:col-span-2 mt-4">
            <label className="text-sm font-medium text-white/70">Internal Notes</label>
            <textarea
              {...register('notes')}
              rows={4}
              placeholder="Private notes about this supplier..."
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Link
          href={`/app/${businessSlug}/suppliers${isEdit ? `/${supplierId}` : ''}`}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(184,242,92,0.2)]"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-[#0A1C16]/30 border-t-[#0A1C16] rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEdit ? 'Save Changes' : 'Create Supplier'}
        </button>
      </div>
    </form>
  );
}
