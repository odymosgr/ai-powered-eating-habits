import type { BodyweightEntryAttempt } from "@/lib/data/bodyweight";
import { startOfDay } from "@/lib/days";

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

/**
 * Why saving `weightKg` (null clears) on `day` needs a confirmation pop-up,
 * one line per reason; empty when it needs none. Rules: spec #1.
 */
export function confirmationReasons(
  attempts: BodyweightEntryAttempt[],
  day: string,
  weightKg: number | null,
): string[] {
  const bodyweight = bodyweightOn(attempts, day);
  if (weightKg === bodyweight) return [];

  if (weightKg === null) return [`Clear ${bodyweight} kg?`];

  const reasons: string[] = [];
  if (bodyweight !== null) {
    reasons.push(`Replace ${bodyweight} kg with ${weightKg} kg?`);
  }
  const recent = latestBodyweightBefore(attempts, day);
  if (recent !== null && Math.abs(weightKg - recent) / recent > 0.05) {
    reasons.push(
      `Are you sure? ${weightKg} kg is more than 5% from ${recent} kg.`,
    );
  }
  return reasons;
}

/** The bodyweight of the latest day, among the 7 before `day`, that has one. */
function latestBodyweightBefore(
  attempts: BodyweightEntryAttempt[],
  day: string,
): number | null {
  const end = startOfDay(day).getTime();
  // Rounded, since a day across a daylight saving change isn't 24 hours.
  const daysBefore = (other: string) =>
    Math.round((end - startOfDay(other).getTime()) / 86_400_000);
  const days = new Set(
    attempts
      .map((a) => a.day)
      .filter((d) => daysBefore(d) >= 1 && daysBefore(d) <= 7),
  );
  for (const d of [...days].sort().reverse()) {
    const bodyweight = bodyweightOn(attempts, d);
    if (bodyweight !== null) return bodyweight;
  }
  return null;
}
