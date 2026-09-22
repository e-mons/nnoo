import { redirect } from 'next/navigation';

export default async function LegacyAutomationsRedirect({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  redirect(`/app/${businessSlug}/settings/automations`);
}
