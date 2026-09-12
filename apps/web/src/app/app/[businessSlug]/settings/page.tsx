import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { GeneralSettingsForm } from '@/components/settings/GeneralSettingsForm';

export default async function SettingsPage({
  params
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const resolvedParams = await params;
  const { businessSlug } = resolvedParams;
  
  const supabase = await createClient();
  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessSlug)
    .single();

  if (error || !business) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">General Settings</h2>
        <p className="text-sm text-white/60">Update your business details and contact information.</p>
      </div>

      <GeneralSettingsForm business={business} businessSlug={businessSlug} />
    </div>
  );
}
