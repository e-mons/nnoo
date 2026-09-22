import { redirect } from 'next/navigation';

export default async function LegacyProductsRedirect({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  redirect(`/app/${businessSlug}/stock?tab=items`);
}
