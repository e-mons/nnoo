import { ReactNode } from 'react';
import { requireRole } from '@/lib/auth/rbac';

export default async function ExpensesLayout({ 
  children, 
  params 
}: { 
  children: ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  await requireRole(businessSlug, 'expenses');
  
  return <>{children}</>;
}
