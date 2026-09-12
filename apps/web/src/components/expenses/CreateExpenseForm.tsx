'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createExpenseAction, uploadExpenseReceipt } from '@/lib/actions/expenses';


export function CreateExpenseForm({ 
  businessId, 
  categories, 
  suppliers 
}: { 
  businessId: string; 
  categories: any[]; 
  suppliers: any[]; 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    categoryId: '',
    supplierId: '',
    total: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    description: '',
    paymentAmount: '',
    paymentMethod: 'cash'
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const idempotencyKey = crypto.randomUUID();
      const totalMinor = String(Math.round(parseFloat(formData.total) * 100));
      
      const payments = [];
      if (formData.paymentAmount && parseFloat(formData.paymentAmount) > 0) {
        payments.push({
          amountMinor: String(Math.round(parseFloat(formData.paymentAmount) * 100)),
          paymentMethod: formData.paymentMethod
        });
      }

      const draft: any = {
        categoryId: formData.categoryId,
        supplierId: formData.supplierId || null,
        currencyCode: 'NGN',
        totalMinor,
        effectiveDate: formData.effectiveDate,
        description: formData.description,
        idempotencyKey,
        payments
      };

      const result = await createExpenseAction(businessId, draft);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (receiptFile && (result.data as any)?.id) {
        await uploadExpenseReceipt(businessId, (result.data as any).id, receiptFile);
      }

      router.push(`/app/${businessId}/expenses`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm text-white/60">Category *</label>
          <select 
            required
            className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]"
            value={formData.categoryId}
            onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
          >
            <option value="">Select a category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/60">Supplier (Required for unpaid balances)</label>
          <select 
            className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]"
            value={formData.supplierId}
            onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
          >
            <option value="">None (Walk-up)</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/60">Total Amount (NGN) *</label>
          <input 
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]"
            value={formData.total}
            onChange={(e) => setFormData({...formData, total: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/60">Date *</label>
          <input 
            type="date"
            required
            className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]"
            value={formData.effectiveDate}
            onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-white/60">Description *</label>
          <input 
            type="text"
            required
            placeholder="What was this expense for?"
            className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>
      </div>

      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-lg font-medium text-white">Initial Payment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm text-white/60">Amount Paid Now (NGN)</label>
            <input 
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]"
              value={formData.paymentAmount}
              onChange={(e) => setFormData({...formData, paymentAmount: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/60">Payment Method</label>
            <select 
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="pos">POS</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-white/60">Receipt Attachment (Optional)</label>
        <input 
          type="file"
          accept="image/*,.pdf"
          className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#B8F25C] file:text-[#0A1C16] hover:file:bg-[#a3d951] cursor-pointer"
          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
        />
      </div>

      <div className="pt-4 flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="border border-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-[#B8F25C] text-[#0A1C16] px-4 py-2 rounded-xl font-medium hover:bg-[#a3d951] transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Record Expense'}
        </button>
      </div>
    </form>
  );
}
