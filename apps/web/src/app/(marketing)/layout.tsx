import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isLoggedIn = !!data?.user;

  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader isLoggedIn={isLoggedIn} />
      <main className="flex-grow">{children}</main>
      <MarketingFooter isLoggedIn={isLoggedIn} />
    </div>
  );
}
