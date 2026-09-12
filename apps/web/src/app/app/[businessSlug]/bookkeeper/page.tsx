import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { QuickCaptureForm } from '@/components/bookkeeper/QuickCaptureForm';
import { BookkeeperInbox } from '@/components/bookkeeper/BookkeeperInbox';

interface BookkeeperPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function BookkeeperPage({ params }: BookkeeperPageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', resolvedParams.businessSlug)
    .maybeSingle();

  if (error || !business) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">AI Bookkeeper</h1>
        <p className="text-white/60 mt-1">
          NNOO suggests how to record your daily transactions. Review and confirm the details before saving to your books.
        </p>
      </div>

      {/* Quick Capture */}
      <QuickCaptureForm businessId={business.id} businessSlug={resolvedParams.businessSlug} />

      {/* Review Inbox */}
      <BookkeeperInbox businessId={business.id} businessSlug={resolvedParams.businessSlug} />
    </div>
  );
}
