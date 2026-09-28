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
      <main>{children}</main>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </>
  );
}
