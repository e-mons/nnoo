import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { TeamList } from '@/components/settings/TeamList';
import { InviteMemberForm } from '@/components/settings/InviteMemberForm';

export default async function TeamSettingsPage({
  params
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const resolvedParams = await params;
  const { businessSlug } = resolvedParams;
  
  const supabase = await createClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', businessSlug)
    .single();

  if (!business) {
    notFound();
  }

  // Fetch active team members
  const { data: members } = await supabase
    .from('team_members_view')
    .select('*')
    .eq('business_id', business.id)
    .order('joined_at', { ascending: true });

  // Fetch pending invitations
  const { data: invitations } = await supabase
    .from('business_invitations')
    .select('*')
    .eq('business_id', business.id)
    .eq('status', 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Team & Members</h2>
        <p className="text-sm text-white/60">Manage who has access to {business.name}.</p>
      </div>

      <InviteMemberForm businessId={business.id} businessSlug={businessSlug} />

      <TeamList 
        members={members || []} 
        invitations={invitations || []} 
        businessSlug={businessSlug} 
      />
    </div>
  );
}
