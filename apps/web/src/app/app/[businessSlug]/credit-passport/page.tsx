import { redirect } from 'next/navigation';

export default async function LegacyCreditPassportRedirect({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  redirect(`/app/${businessSlug}/advisor?tab=passport`);
}
