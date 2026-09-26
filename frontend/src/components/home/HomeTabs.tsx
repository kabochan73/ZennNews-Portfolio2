"use client";

export type HomeTab = "new" | "read" | "bookmark";

const TABS: { id: HomeTab; label: string }[] = [
  { id: "new", label: "NEW" },
  { id: "read", label: "READ" },
  { id: "bookmark", label: "BOOKMARK" },
];

type Props = {
  activeTab: HomeTab;
  /** Article counts per tab; undefined until the user's data has loaded. */
  counts: Record<HomeTab, number> | undefined;
  onChange: (tab: HomeTab) => void;
};

/** NEW / READ / BOOKMARK tabs with counts. */
export function HomeTabs({ activeTab, counts, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="記事の表示"
      className="grid grid-cols-3 border-b border-neutral-200"
    >
      {TABS.map((tab) => {
        const selected = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`flex items-center justify-center gap-1.5 border-b-2 py-3 text-sm ${
              selected
                ? "border-black font-bold text-black"
                : "border-transparent text-neutral-400"
            }`}
          >
            {tab.label}
            {counts ? (
              <span>{counts[tab.id]}</span>
            ) : (
              <span
                aria-hidden
                className="h-3 w-5 animate-pulse rounded bg-neutral-200"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
