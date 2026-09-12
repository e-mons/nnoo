import { ReactNode } from 'react';
import { requireRole } from '@/lib/auth/rbac';

export default async function ProductsLayout({ 
  children, 
  params 
}: { 
  children: ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  await requireRole(businessSlug, 'products');
  
  return <>{children}</>;
}
