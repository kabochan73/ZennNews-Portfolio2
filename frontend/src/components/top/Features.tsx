const FEATURES = [
  {
    title: "タグを選ぶ",
    description: "Laravel、Next.js、AWS など、自分が追いかけたい技術を登録",
  },
  {
    title: "新しい順でチェック",
    description: "登録した技術の Zenn 最新記事を、いつも新しい順で",
  },
  {
    title: "NEW / READ で既読管理",
    description: "読んだ記事は READ へ。まだ読んでいない記事がひと目で分かる",
  },
  {
    title: "あとで読む",
    description: "気になった記事はブックマーク。最大100件まで保存できる",
  },
] as const;

export function Features() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <p className="text-center text-xs font-bold tracking-widest text-neutral-500">
        FEATURES
      </p>
      <h2 className="mt-2 text-center text-2xl font-bold sm:text-3xl">
        このアプリでできること
      </h2>
      <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, index) => (
          <li
            key={feature.title}
            className="rounded-2xl border border-neutral-200 p-6"
          >
            <p className="text-sm font-bold text-neutral-400">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 font-bold">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {feature.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
