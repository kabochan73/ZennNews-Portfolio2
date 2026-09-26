import type { ComponentProps } from "react";

type Props = ComponentProps<"button"> & {
  /** While true, the button is disabled and shows "送信中…". */
  loading?: boolean;
};

/** Black, full-width primary button. */
export function Button({
  loading = false,
  disabled,
  children,
  className = "",
  ...buttonProps
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`w-full rounded-full bg-black px-6 py-3 text-sm font-bold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400 ${className}`}
      {...buttonProps}
    >
      {loading ? "送信中…" : children}
    </button>
  );
}
