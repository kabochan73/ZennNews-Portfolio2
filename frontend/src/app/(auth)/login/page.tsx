import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginExpiredNotice, LoginForm } from "@/components/auth/LoginForm";
import { PublicHeader } from "@/components/layout/PublicHeader";

export const metadata: Metadata = {
  title: "ログイン | Zenn News",
};

/** Login page (/login). Static; logged-in visitors can still open it. */
export default function LoginPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold">ログイン</h1>
        <div className="mt-8 space-y-6">
          <Suspense fallback={null}>
            <LoginExpiredNotice />
          </Suspense>
          <LoginForm />
        </div>
        <p className="mt-8 text-center text-sm text-neutral-600">
          アカウントがない方は{" "}
          <Link href="/register" className="font-bold text-black underline">
            新規登録
          </Link>
        </p>
      </main>
    </>
  );
}
