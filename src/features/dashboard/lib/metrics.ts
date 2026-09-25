import { format } from "date-fns";

const DAY = 86_400_000;

function startOfDayMs(ms: number) {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

type DateLike = string | null | undefined;

/** Counts per calendar day over the last `days` days (inclusive of today). */
export function bucketByDay<T>(items: T[], getDate: (item: T) => DateLike, days: number, now: number) {
  const end = startOfDayMs(now) + DAY;
  const start = end - days * DAY;
  const counts = new Array<number>(days).fill(0);
  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const t = new Date(raw).getTime();
    if (t >= start && t < end) counts[Math.floor((t - start) / DAY)] += 1;
  }
  return counts.map((value, index) => ({ date: format(start + index * DAY, "MMM d"), value }));
}

/** Per-day counts split into named series, e.g. alerts by severity. */
export function bucketSeriesByDay<T, K extends string>(
  items: T[],
  getDate: (item: T) => DateLike,
  getKey: (item: T) => K | null,
  keys: readonly K[],
  days: number,
  now: number,
) {
  const end = startOfDayMs(now) + DAY;
  const start = end - days * DAY;
  const rows = Array.from({ length: days }, (_, index) => {
    const row: Record<string, string | number> = { date: format(start + index * DAY, "MMM d") };
    keys.forEach((key) => (row[key] = 0));
    return row;
  });
  for (const item of items) {
    const raw = getDate(item);
    const key = getKey(item);
    if (!raw || !key) continue;
    const t = new Date(raw).getTime();
    if (t >= start && t < end) (rows[Math.floor((t - start) / DAY)][key] as number) += 1;
  }
  return rows;
}

/** Items in the last `days` vs the `days` before that. `pct` is null when there is no baseline. */
export function windowDelta<T>(items: T[], getDate: (item: T) => DateLike, days: number, now: number) {
  let current = 0;
  let previous = 0;
  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const age = now - new Date(raw).getTime();
    if (age < 0) continue;
    if (age <= days * DAY) current += 1;
    else if (age <= 2 * days * DAY) previous += 1;
  }
  const pct = previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / previous) * 100;
  return { current, previous, pct };
}

/** Future-facing variant: items scheduled in the next `days` vs the following `days`. */
export function forwardWindow<T>(items: T[], getDate: (item: T) => DateLike, days: number, now: number) {
  let next = 0;
  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const ahead = new Date(raw).getTime() - now;
    if (ahead >= 0 && ahead <= days * DAY) next += 1;
  }
  return next;
}

export const percent = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 100));
