/** HOME / TAGS, shared by the header links (PC) and the bottom tabs (mobile). */
export const NAV_ITEMS = [
  { href: "/home", label: "HOME" },
  { href: "/home/tags", label: "TAGS" },
] as const;

export type NavHref = (typeof NAV_ITEMS)[number]["href"];

/** TAGS on the tag settings page; HOME on /home and every /home/{slug}. */
export function activeNavHref(pathname: string): NavHref {
  return pathname === "/home/tags" ? "/home/tags" : "/home";
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
