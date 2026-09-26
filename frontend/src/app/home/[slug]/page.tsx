import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomeFeed } from "@/components/home/HomeFeed";
import { getTagArticles } from "@/lib/laravel";

/**
 * Home of one tag (/home/{slug}), cached as ISR.
 *
 * The empty list means no page is built at build time (Laravel isn't reachable
 * then); each tag is rendered on its first visit and cached for everyone.
 * Without this function the route would be rendered on every request instead.
 * The cache is rebuilt on Laravel's revalidation notice or every 8 hours
 * (see getTagArticles).
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps<"/home/[slug]">): Promise<Metadata> {
  const data = await getTagArticles((await params).slug);

  return { title: data ? `${data.tag.name} | Zenn News` : "Zenn News" };
}

export default async function TagHomePage({
  params,
}: PageProps<"/home/[slug]">) {
  const data = await getTagArticles((await params).slug);
  if (!data) {
    notFound();
  }

  return <HomeFeed tag={data.tag} articles={data.articles} />;
}
