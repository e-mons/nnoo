'use client';

import { useState } from 'react';
import { updateBusinessProfile } from '@/lib/actions/settings';
import { Save, Building, MapPin, Building2, Contact } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GeneralSettingsForm({
  business,
  businessSlug,
}: {
  business: any;
  businessSlug: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await updateBusinessProfile(business.id, businessSlug, formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-[#B8F25C]/10 border border-[#B8F25C]/50 text-[#B8F25C] p-4 rounded-xl text-sm">
          Settings saved successfully!
        </div>
      )}

      {/* Core Profile */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Building className="w-5 h-5 text-[#B8F25C]" />
          Business Profile
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Business Name *</label>
            <input
              type="text"
              name="name"
              defaultValue={business.name}
              required
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Legal Name</label>
            <input
              type="text"
              name="legal_name"
              defaultValue={business.legal_name || ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Industry *</label>
            <input
              type="text"
              name="industry"
              defaultValue={business.industry}
              required
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Currency Code *</label>
            <input
              type="text"
              name="currency_code"
              defaultValue={business.currency_code}
              required
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Country Code *</label>
            <input
              type="text"
              name="country_code"
              defaultValue={business.country_code}
              required
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Timezone</label>
            <input
              type="text"
              name="timezone"
              defaultValue={business.timezone}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Contact className="w-5 h-5 text-[#B8F25C]" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              defaultValue={business.email || ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Phone Number</label>
            <input
              type="text"
              name="phone"
              defaultValue={business.phone || ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#B8F25C]" />
          Location
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/70 mb-2">Address Line 1</label>
            <input
              type="text"
              name="address_line_1"
              defaultValue={business.address_line_1 || ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/70 mb-2">Address Line 2</label>
            <input
              type="text"
              name="address_line_2"
              defaultValue={business.address_line_2 || ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">City</label>
            <input
              type="text"
              name="city"
              defaultValue={business.city || ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">State / Province</label>
            <input
              type="text"
              name="state"
              defaultValue={business.state || ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Registration */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#B8F25C]" />
          Registration & Tax
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Company Registration Number</label>
            <input
              type="text"
              name="registration_number"
              defaultValue={business.registration_number || ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Tax Identifier / TIN</label>
            <input
              type="text"
              name="tax_identifier"
              defaultValue={business.tax_identifier || ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-white/10 pt-6 mt-6">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(184,242,92,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
