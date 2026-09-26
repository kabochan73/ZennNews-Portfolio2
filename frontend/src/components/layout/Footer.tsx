/** Source credit and the unofficial notice, shown on every page. */
export function Footer() {
  return (
    <footer className="border-t border-neutral-200 px-4 py-6 text-center text-xs text-neutral-500">
      <p>
        記事の出典：
        <a
          href="https://zenn.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-black"
        >
          Zenn
        </a>
      </p>
      <p className="mt-1">本アプリは Zenn 公式とは関係ありません</p>
    </footer>
  );
}
