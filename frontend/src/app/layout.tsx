import type { Metadata } from "next";

import { Providers } from "@/app/providers";
import { Footer } from "@/components/layout/Footer";

import "./globals.css";

export const metadata: Metadata = {
  title: "Zenn News",
  description:
    "Zenn の記事を、お気に入りのタグごとに最新順で読めるニュースアプリ（非公式）",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Providers>
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
