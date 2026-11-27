import type { BodyweightEntryAttempt } from "@/lib/data/bodyweight";
import { addDays, startOfDay } from "@/lib/days";

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
  for (let count = 1; count <= 7; count++) {
    const bodyweight = bodyweightOn(attempts, addDays(day, -count));
    if (bodyweight !== null) return bodyweight;
  }
  return null;
}

/** Monday to Sunday of the week holding `day`. */
export function weekOf(day: string): string[] {
  // getDay() counts from Sunday = 0.
  const monday = addDays(day, -((startOfDay(day).getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, count) => addDays(monday, count));
}

/** Today and the 6 days before it: the days a user can set or clear (spec #1). */
export function isEditable(day: string, today: string): boolean {
  return day <= today && day >= addDays(today, -6);
}

/**
 * The chart's weight window: 5 kg with whole-kg ends, centred on the average
 * of `bodyweights`, moved or widened just enough to hold them all (spec #1).
 * Null when there are none.
 */
export function weightWindow(
  bodyweights: number[],
): { bottom: number; top: number } | null {
  if (bodyweights.length === 0) return null;
  const lowest = Math.floor(Math.min(...bodyweights));
  const highest = Math.ceil(Math.max(...bodyweights));
  const size = Math.max(5, highest - lowest);
  const centred = Math.round(average(bodyweights) - 2.5);
  const bottom = Math.min(Math.max(centred, highest - size), lowest);
  return { bottom, top: bottom + size };
}

/**
 * The average bodyweight of the last 3 days ending today against the 3 days
 * before them, and the change in %. Null when either group has fewer than 2
 * bodyweights (spec #1).
 */
export function recentTrend(
  attempts: BodyweightEntryAttempt[],
  today: string,
): { recent: number; before: number; percent: number } | null {
  const bodyweights = (from: number) =>
    [from, from + 1, from + 2].flatMap((count) => {
      const bodyweight = bodyweightOn(attempts, addDays(today, -count));
      return bodyweight === null ? [] : [bodyweight];
    });
  const recent = bodyweights(0);
  const before = bodyweights(3);
  if (recent.length < 2 || before.length < 2) return null;
  const [recentAverage, beforeAverage] = [average(recent), average(before)];
  return {
    recent: recentAverage,
    before: beforeAverage,
    percent: ((recentAverage - beforeAverage) / beforeAverage) * 100,
  };
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
