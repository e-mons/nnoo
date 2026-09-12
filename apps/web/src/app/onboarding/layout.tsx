import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOutAction } from '@/lib/actions/auth';

export const metadata: Metadata = {
  title: 'Onboarding | NNOO',
  description: 'Create your NNOO Business',
};

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Verify if platform admin (Admins shouldn't access onboarding)
  const { data: adminRecord } = await supabase
    .from('platform_admins')
    .select('status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (adminRecord) {
    redirect('/admin');
  }

  // Fetch business memberships
  const { data: memberships } = await supabase
    .from('business_memberships')
    .select('*')
    .eq('user_id', user.id)
    .eq('membership_status', 'active');

  // If user already has a business, redirect to app
  if (memberships && memberships.length > 0) {
    redirect('/app');
  }

  return (
    <div className="min-h-screen bg-[#0A1C16] flex flex-col text-white selection:bg-[#B8F25C] selection:text-[#0A1C16]">
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#B8F25C] rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-[#0A1C16] rounded-sm" />
          </div>
          <span className="font-bold tracking-widest text-lg">NNOO</span>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-sm font-semibold text-white hover:bg-[rgba(255,255,255,0.1)] hover:text-[#B8F25C] transition-all border border-white/10 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sign Out
          </button>
        </form>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
