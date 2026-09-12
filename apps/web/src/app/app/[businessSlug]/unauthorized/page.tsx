import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default async function UnauthorizedPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
        <ShieldAlert className="w-8 h-8 text-red-500" />
      </div>
      
      <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
      <p className="text-white/60 mb-8">
        You do not have the required role or permission to view this page. If you believe this is a mistake, please contact your Business Administrator.
      </p>

      <Link 
        href={`/app/${businessSlug}`}
        className="px-6 py-3 bg-[#B8F25C] text-[#0A1C16] font-semibold rounded-xl hover:bg-[#A3D94A] transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
