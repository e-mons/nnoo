import { createClient } from '@/lib/supabase/server';
import { ShieldCheck, LogIn } from 'lucide-react';
import Link from 'next/link';
import AcceptInviteForm from './AcceptInviteForm';

export default async function InvitationPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1C16] p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#B8F25C]/20 rounded-full blur-[120px] opacity-20 pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#143628]/40 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10 text-center">
        <div className="w-16 h-16 bg-[#B8F25C] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(184,242,92,0.3)]">
          <ShieldCheck className="w-8 h-8 text-[#0A1C16]" />
        </div>
        
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Business Invitation</h1>
        <p className="text-white/60 text-sm mb-8">
          You have been invited to join a team on NNOO.
        </p>

        {user ? (
          <div className="space-y-6">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-sm text-white/80">
                You are currently signed in as:
              </p>
              <p className="font-semibold text-white mt-1">{user.email}</p>
            </div>
            
            <AcceptInviteForm token={token} />
            
            <p className="text-xs text-white/40 mt-4">
              Make sure this matches the email address the invitation was sent to.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-sm text-yellow-500/90">
                You must be signed in to accept an invitation.
              </p>
            </div>
            <Link 
              href={`/sign-in?next=/invitations/${token}`}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-[#0A1C16] rounded-xl text-sm font-semibold transition-all"
            >
              <LogIn className="w-4 h-4" />
              Sign in or create account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
