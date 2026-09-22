import { redirect } from 'next/navigation';

export default async function LegacyReportsRedirect({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  redirect(`/app/${businessSlug}/money?tab=activity`);
}
