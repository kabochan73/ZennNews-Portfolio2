/** HOME / TAGS, shared by the header links (PC) and the bottom tabs (mobile). */
export const NAV_ITEMS = [
  { href: "/home", label: "HOME" },
  { href: "/home/tags", label: "TAGS" },
] as const;

export type NavHref = (typeof NAV_ITEMS)[number]["href"];

/**
 * TAGS on the tag settings page; HOME on /home and every /home/{slug};
 * nothing outside /home (e.g. the top page for a logged-in user).
 */
export function activeNavHref(pathname: string): NavHref | null {
  if (pathname === "/home/tags") {
    return "/home/tags";
  }

  return pathname === "/home" || pathname.startsWith("/home/") ? "/home" : null;
}

/**
 * The first-run tag settings page (/home/tags?welcome=1) hides the navigation,
 * so a new user can't leave before choosing at least one tag.
 */
export function isWelcomePage(
  pathname: string,
  welcome: string | null,
): boolean {
  return pathname === "/home/tags" && welcome === "1";
}
