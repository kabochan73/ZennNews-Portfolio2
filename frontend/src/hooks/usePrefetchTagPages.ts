import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { Tag } from "@/types/api";

/**
 * Prefetch every favorite tag's page (except the current one) once the favorites
 * are known, so switching tags is instant even for tags scrolled out of the
 * mobile tag bar. The pages are shared ISR pages, so this never reaches Laravel.
 * Prefetching only runs in production.
 */
export function usePrefetchTagPages(tags: Tag[], activeSlug: string): void {
  const router = useRouter();
  // A string key, so a new array with the same tags doesn't prefetch again.
  const slugs = tags.map((tag) => tag.slug).join(",");

  useEffect(() => {
    for (const slug of slugs.split(",")) {
      if (slug && slug !== activeSlug) {
        router.prefetch(`/home/${slug}`);
      }
    }
  }, [slugs, activeSlug, router]);
}
