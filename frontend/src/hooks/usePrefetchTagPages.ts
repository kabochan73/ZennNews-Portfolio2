import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { Tag } from "@/types/api";

type PrefetchOptions = Parameters<ReturnType<typeof useRouter>["prefetch"]>[1];

/**
 * "full" prefetches the whole page. The default ("auto") skips the tag pages: they
 * are built on demand (generateStaticParams is empty), so the router treats them
 * as dynamic and prefetches nothing. The option is typed with an internal enum,
 * so the plain value is cast.
 */
const FULL_PREFETCH = { kind: "full" } as PrefetchOptions;

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
        router.prefetch(`/home/${slug}`, FULL_PREFETCH);
      }
    }
  }, [slugs, activeSlug, router]);
}
