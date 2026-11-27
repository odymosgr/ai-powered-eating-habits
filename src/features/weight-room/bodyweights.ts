import type { BodyweightEntryAttempt } from "@/lib/data/bodyweight";

/**
 * The day's bodyweight: the weight of its latest confirmed attempt. Null when
 * the day has none, or that attempt cleared it. `attempts` come oldest first.
 */
export function bodyweightOn(
  attempts: BodyweightEntryAttempt[],
  day: string,
): number | null {
  const latest = attempts.findLast((a) => a.day === day && a.confirmed);
  return latest?.weightKg ?? null;
}
