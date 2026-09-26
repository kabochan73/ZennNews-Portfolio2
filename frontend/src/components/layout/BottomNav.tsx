"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  activeNavHref,
  isWelcomePage,
  NAV_ITEMS,
  type NavHref,
} from "@/components/layout/nav";

/** Tabs fixed to the bottom of the screen, on mobile only (under 1024px). */
export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (isWelcomePage(pathname, searchParams.get("welcome"))) {
    return null;
  }

  const activeHref = activeNavHref(pathname);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white lg:hidden">
      <ul className="grid h-16 grid-cols-2">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.href === activeHref ? "page" : undefined}
              className={`flex h-full flex-col items-center justify-center gap-1 text-xs ${
                item.href === activeHref
                  ? "font-bold text-black"
                  : "text-neutral-400"
              }`}
            >
              <NavIcon href={item.href} />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NavIcon({ href }: { href: NavHref }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {href === "/home" ? (
        // House
        <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
      ) : (
        // Tag
        <>
          <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
          <circle cx="7.5" cy="7.5" r="1.5" />
        </>
      )}
    </svg>
  );
}
