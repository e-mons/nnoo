'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCustomerSchema } from '@nnoo/validation';
import { CreateCustomerDraft, CustomerDuplicateCandidate } from '@nnoo/contracts';
import { createCustomer, updateCustomer } from '@/lib/actions/customer';
import { Save, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CustomerFormProps {
  businessId: string;
  businessSlug: string;
  initialData?: Partial<CreateCustomerDraft>;
  customerId?: string;
  isEdit?: boolean;
}

export function CustomerForm({ businessId, businessSlug, initialData, customerId, isEdit }: CustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<CustomerDuplicateCandidate[] | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateCustomerDraft>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: initialData || {
      customerType: 'individual',
      name: '',
      companyName: '',
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

  const customerType = useWatch({ control, name: 'customerType' });

  const onSubmit = async (data: CreateCustomerDraft) => {
    setIsSubmitting(true);
    setError(null);
    setDuplicates(null);

    try {
      if (isEdit && customerId) {
        const result = await updateCustomer(businessId, customerId, data);
        if (!result.success) {
          setError(result.error || 'Failed to update customer');
          setIsSubmitting(false);
          return;
        }
        router.push(`/app/${businessSlug}/customers/${customerId}`);
        router.refresh();
      } else {
        const result = await createCustomer(businessId, data);
        if (!result.success) {
          setError(result.error || 'Failed to create customer');
          setIsSubmitting(false);
          return;
        }
        
        // If duplicates are returned but no error, we created it, but might want to warn
        // Actually, in the current implementation, if we get duplicateCandidates without an error, it succeeded.
        // We could change the UX to ask for confirmation first, but let's just proceed for now or show warning then redirect.
        if (result.duplicateCandidates && result.duplicateCandidates.length > 0) {
          setDuplicates(result.duplicateCandidates);
          // Don't redirect immediately if there's a warning, give them a chance to see it, or just redirect.
          // For simplicity in UX, we'll redirect after 3 seconds or they can click "Go to customer".
        }
        
        // Wait briefly if duplicates, else go
        setTimeout(() => {
           router.push(`/app/${businessSlug}/customers`);
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
            <p className="font-semibold mb-1">Customer created, but potential duplicates found:</p>
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
            <label className="text-sm font-medium text-white/70">Customer Type</label>
            <select
              {...register('customerType')}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors appearance-none"
            >
              <option value="individual">Individual</option>
              <option value="business">Business / Organisation</option>
            </select>
            {errors.customerType && (
              <p className="text-red-400 text-xs mt-1">{errors.customerType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">
              {customerType === 'business' ? 'Contact Name' : 'Full Name'} <span className="text-[#B8F25C]">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder={customerType === 'business' ? 'e.g. Jane Doe' : 'e.g. John Smith'}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {customerType === 'business' && (
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-white/70">Company Name <span className="text-[#B8F25C]">*</span></label>
              <input
                type="text"
                {...register('companyName')}
                placeholder="e.g. Acme Corp"
                className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
              />
              {errors.companyName && (
                <p className="text-red-400 text-xs mt-1">{errors.companyName.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Email Address</label>
            <input
              type="email"
              {...register('email')}
              placeholder="e.g. contact@example.com"
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
              placeholder="Private notes about this customer..."
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Link
          href={`/app/${businessSlug}/customers${isEdit ? `/${customerId}` : ''}`}
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
          {isEdit ? 'Save Changes' : 'Create Customer'}
        </button>
      </div>
    </form>
  );
}
