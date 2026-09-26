import Link from "next/link";

/** Header for the pages that don't need a login (top, login, register). */
export function PublicHeader() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold">
          Zenn News
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/login"
            className="rounded-full border border-neutral-300 px-4 py-1.5 hover:bg-neutral-100"
          >
            ログイン
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-black px-4 py-1.5 text-white hover:bg-neutral-800"
          >
            新規登録
          </Link>
        </nav>
      </div>
    </header>
  );
}
