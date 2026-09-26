/**
 * Always Japan time, regardless of the server's or browser's time zone, so the
 * prerendered (ISR) HTML and the browser render the same text.
 */
const publishedAtFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "2026-09-23T14:05:00+09:00" -> "9/23 14:05" (JST). */
export function formatPublishedAt(isoDateTime: string): string {
  const parts = Object.fromEntries(
    publishedAtFormatter
      .formatToParts(new Date(isoDateTime))
      .map((part) => [part.type, part.value]),
  );

  return `${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}
