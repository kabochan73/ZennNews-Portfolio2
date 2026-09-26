import { ClosingCta } from "@/components/top/ClosingCta";
import { Features } from "@/components/top/Features";
import { Hero } from "@/components/top/Hero";
import { TopHeader } from "@/components/top/TopHeader";
import { ZennComparison } from "@/components/top/ZennComparison";

/**
 * Top page (/). Fully static (SSG): identical HTML for everyone. The header and
 * buttons switch to the logged-in version in the browser.
 */
export default function TopPage() {
  return (
    <>
      <TopHeader />
      <main>
        <Hero />
        <Features />
        <ZennComparison />
        <ClosingCta />
      </main>
    </>
  );
}
