'use client';

import { useFormStatus } from 'react-dom';
import { createBusinessAction } from '@/lib/actions/business';
import { INDUSTRY_OPTIONS } from '@nnoo/validation';
import { useState } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[#B8F25C] text-[#0A1C16] font-bold py-3 px-4 rounded-xl hover:bg-[#A3D94A] transition-colors focus:ring-4 focus:ring-[#B8F25C]/30 disabled:opacity-50 mt-6"
    >
      {pending ? 'Setting up...' : 'Create Business'}
    </button>
  );
}

export function BusinessOnboardingForm() {
  const [error, setError] = useState<string | null>(null);

  async function action(formData: FormData) {
    setError(null);
    const result = await createBusinessAction(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <form action={action} className="w-full max-w-md space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-white/80">Business Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Lagos Wholesale & Stores"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#B8F25C] focus:border-transparent transition-all"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="industry" className="text-sm font-medium text-white/80">Industry</label>
        <select
          id="industry"
          name="industry"
          required
          defaultValue=""
          className="w-full bg-[#0d211a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#B8F25C] focus:border-transparent transition-all appearance-none"
        >
          <option value="" disabled>Select an industry...</option>
          {INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium text-white/80">Business Phone (Optional)</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+234..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#B8F25C] focus:border-transparent transition-all"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
