import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/server/ai/admin/auth';
import { IntelligenceOverviewService } from '@/server/ai/admin/overview-service';
import { IntelligenceOperationsCenter } from '@/components/admin/intelligence/IntelligenceOperationsCenter';

export const metadata = {
  title: 'Intelligence Operations Center | NNOO Admin',
  description: 'Observability, diagnostics, and operational controls for NNOO AI and intelligence systems.',
};

export default async function AdminIntelligencePage() {
  const supabase = await createClient();
  await requirePlatformAdmin(supabase);

  // Pre-fetch initial 24h overview on server
  const initialOverview = await IntelligenceOverviewService.getOverview(supabase, '24h');

  return <IntelligenceOperationsCenter initialOverview={initialOverview} />;
}
