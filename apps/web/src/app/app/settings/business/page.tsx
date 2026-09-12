'use client';

import { useBusiness } from '@/components/providers/BusinessProvider';
import { updateBusinessAction } from '@/lib/actions/business';
import { INDUSTRY_OPTIONS } from '@nnoo/validation';
import { useState } from 'react';

export default function BusinessProfilePage() {
  const { activeBusiness } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  if (!activeBusiness) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await updateBusinessAction(activeBusiness!.id, formData);
    
    if (result?.error) {
      setMessage({ text: result.error, type: 'error' });
    } else {
      setMessage({ text: 'Business profile updated successfully!', type: 'success' });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Business Profile</h1>
      
      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-green-500/10 border-green-500/50 text-green-500'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Business Name</label>
            <input
              name="name"
              type="text"
              defaultValue={activeBusiness.name}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#B8F25C]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Industry</label>
            <select
              name="industry"
              defaultValue={activeBusiness.industry}
              required
              className="w-full bg-[#0d211a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#B8F25C] appearance-none"
            >
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Phone</label>
            <input
              name="phone"
              type="tel"
              defaultValue={activeBusiness.phone || ''}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#B8F25C]"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={activeBusiness.email || ''}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#B8F25C]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto bg-[#B8F25C] text-[#0A1C16] font-bold py-3 px-8 rounded-xl hover:bg-[#A3D94A] transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
