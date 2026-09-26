const NOT_INCLUDED = [
  "投稿機能なし",
  "コメント機能なし",
  "SNS機能なし",
  "記事本文の転載なし",
] as const;

/** Zenn is written as text only; its logo is never used (unofficial app). */
export function ZennComparison() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-20">
      <div className="grid gap-10 rounded-2xl bg-neutral-100 p-8 md:grid-cols-2 md:p-12">
        <div>
          <h2 className="text-2xl font-bold">Zennとの違い</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Zenn の記事を読むための、もう一つの入口。
          </p>
          <ul className="mt-6 space-y-3">
            {NOT_INCLUDED.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <span aria-hidden className="text-neutral-400">
                  ×
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-center">
          <p className="flex gap-3 leading-relaxed font-bold">
            <span aria-hidden>✓</span>
            <span>
              そのかわり、
              <br />
              自分が追いたい技術だけを、
              <br />
              効率よく追える。
            </span>
          </p>
          <div className="mt-8 flex items-center gap-4 text-sm font-bold">
            <span className="rounded-lg border border-neutral-300 bg-white px-4 py-3">
              Zenn
            </span>
            <span aria-hidden>→</span>
            <span className="rounded-lg bg-black px-4 py-3 text-white">
              Zenn News
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
