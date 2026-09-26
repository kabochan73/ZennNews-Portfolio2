import { StartButtons } from "@/components/top/StartButtons";

export function Hero() {
  return (
    <section className="border-b border-neutral-200">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
        <h1 className="text-4xl leading-tight font-bold sm:text-6xl">
          Zennを、
          <br />
          もっと効率よく追いかける。
        </h1>
        <p className="mt-6 leading-relaxed text-neutral-600">
          興味のある技術を登録するだけ。
          <br />
          最新記事を、自分専用のニュースフィードで。
        </p>
        <div className="mt-10">
          <StartButtons withLogin />
        </div>
      </div>
    </section>
  );
}
