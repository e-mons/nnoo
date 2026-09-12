import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { WhatsAppSettings } from '@/components/whatsapp/WhatsAppSettings';

export default async function WhatsAppSettingsPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
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
      <WhatsAppSettings businessId={business.id} businessSlug={businessSlug} />
    </div>
  );
}

