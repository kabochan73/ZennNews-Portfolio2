import { StartButtons } from "@/components/top/StartButtons";

export function ClosingCta() {
  return (
    <section className="bg-black px-4 py-20 text-center text-white">
      <h2 className="text-2xl leading-relaxed font-bold sm:text-3xl">
        あなたの技術ニュースを
        <br />
        今日から始めよう。
      </h2>
      <div className="mt-8 flex justify-center">
        <StartButtons tone="dark" />
      </div>
    </section>
  );
}
