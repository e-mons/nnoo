import { redirect } from 'next/navigation';

export default async function LegacyInsightsRedirect({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  redirect(`/app/${businessSlug}/advisor?tab=insights`);
}
