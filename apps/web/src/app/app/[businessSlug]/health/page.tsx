import { redirect } from 'next/navigation';

export default async function LegacyHealthRedirect({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  redirect(`/app/${businessSlug}/advisor?tab=health`);
}
