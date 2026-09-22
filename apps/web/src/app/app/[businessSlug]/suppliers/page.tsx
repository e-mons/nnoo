import { redirect } from 'next/navigation';

export default async function LegacySuppliersRedirect({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  redirect(`/app/${businessSlug}/contacts?tab=suppliers`);
}
