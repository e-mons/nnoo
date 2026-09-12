'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBillingPlan } from '@/lib/actions/admin-billing';

export default function NewBillingPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    amountMinor: '',
    currencyCode: 'NGN',
    billingInterval: 'monthly' as 'monthly' | 'annual'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await createBillingPlan({
        ...formData,
        amountMinor: parseInt(formData.amountMinor, 10)
      });
      router.push('/admin/billing/plans');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create plan');
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/admin/billing/plans" className="text-sm font-medium text-emerald-500 hover:text-emerald-400">
          &larr; Back to Plans
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-white tracking-tight">Create Internal Plan</h1>
        <p className="text-gray-400 mt-1">Create a canonical NNOO billing plan. This does not automatically sync to Paystack.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#1a1f1c] border border-[#2a302c] rounded-xl p-8 space-y-6 shadow-xl">
        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium leading-6 text-white">Plan Name</label>
          <input
            type="text"
            required
            className="mt-2 block w-full rounded-md border-0 bg-[#0f1211] py-1.5 text-white shadow-sm ring-1 ring-inset ring-[#2a302c] focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6"
            value={formData.name}
            onChange={(e) => setFormData(f => ({...f, name: e.target.value}))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-white">Internal Code</label>
          <p className="text-xs text-gray-500 mb-2">Immutable identifier (e.g. nnoo_standard_monthly)</p>
          <input
            type="text"
            required
            className="block w-full rounded-md border-0 bg-[#0f1211] py-1.5 text-white shadow-sm ring-1 ring-inset ring-[#2a302c] focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 font-mono"
            value={formData.code}
            onChange={(e) => setFormData(f => ({...f, code: e.target.value}))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-white">Amount (Minor Units)</label>
          <p className="text-xs text-gray-500 mb-2">E.g., 500000 for ₦5,000</p>
          <input
            type="number"
            required
            min="0"
            className="block w-full rounded-md border-0 bg-[#0f1211] py-1.5 text-white shadow-sm ring-1 ring-inset ring-[#2a302c] focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6"
            value={formData.amountMinor}
            onChange={(e) => setFormData(f => ({...f, amountMinor: e.target.value}))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-white">Interval</label>
          <select
            className="mt-2 block w-full rounded-md border-0 bg-[#0f1211] py-1.5 text-white shadow-sm ring-1 ring-inset ring-[#2a302c] focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6"
            value={formData.billingInterval}
            onChange={(e) => setFormData(f => ({...f, billingInterval: e.target.value as 'monthly' | 'annual'}))}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-white">Description</label>
          <textarea
            className="mt-2 block w-full rounded-md border-0 bg-[#0f1211] py-1.5 text-white shadow-sm ring-1 ring-inset ring-[#2a302c] focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(f => ({...f, description: e.target.value}))}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Plan'}
        </button>
      </form>
    </div>
  );
}
