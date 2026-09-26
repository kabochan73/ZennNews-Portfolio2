import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { PublicHeader } from "@/components/layout/PublicHeader";

export const metadata: Metadata = {
  title: "アカウントを作成 | Zenn News",
};

/** Sign-up page (/register). Static; logged-in visitors can still open it. */
export default function RegisterPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold">アカウントを作成</h1>
        <div className="mt-8">
          <RegisterForm />
        </div>
        <p className="mt-8 text-center text-sm text-neutral-600">
          アカウントをお持ちの方は{" "}
          <Link href="/login" className="font-bold text-black underline">
            ログイン
          </Link>
        </p>
      </main>
    </>
  );
}
