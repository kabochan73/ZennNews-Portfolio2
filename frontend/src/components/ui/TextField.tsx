import { type ComponentProps, useId } from "react";

type Props = ComponentProps<"input"> & {
  label: string;
  /** Gray help text under the field, e.g. the allowed characters. */
  hint?: string;
  /** Red error text under the field; also marks the input as invalid. */
  error?: string;
};

/**
 * Label + input + hint + error. The hint and error are linked to the input with
 * aria-describedby, so screen readers announce them. Accepts React Hook Form's
 * register() props, including ref.
 */
export function TextField({ label, hint, error, ...inputProps }: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-2 block w-full rounded-lg border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black ${
          error ? "border-red-600" : "border-neutral-300"
        }`}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-neutral-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
