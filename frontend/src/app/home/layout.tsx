import { Suspense } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";

/**
 * Shared by /home, /home/{slug} and /home/tags. It never reads cookies, so the
 * pages below it can stay static (ISR); user data is fetched in the browser.
 */
export default function HomeLayout({ children }: LayoutProps<"/home">) {
  return (
    <>
      <AppHeader />
      {/* Bottom padding keeps the content clear of the fixed mobile tabs. */}
      <main className="pb-16 lg:pb-0">{children}</main>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </>
  );
}
