import { ReactNode } from 'react';
import { requireRole } from '@/lib/auth/rbac';

export default async function ReportsLayout({ 
  children, 
  params 
}: { 
  children: ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;

  await requireRole(businessSlug, 'reports');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}
