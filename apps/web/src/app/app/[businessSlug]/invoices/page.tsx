import { redirect } from 'next/navigation';

export default async function LegacyInvoicesRedirect({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  redirect(`/app/${businessSlug}/money?tab=invoices`);
}
