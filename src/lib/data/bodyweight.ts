import { supabase } from "@/lib/supabase";

/** Terms: GLOSSARY.md. `day` is "YYYY-MM-DD"; `weightKg` is null when the attempt clears the day. */
export type BodyweightEntryAttempt = {
  id: string;
  day: string;
  weightKg: number | null;
  confirmed: boolean;
  savedAt: Date;
  timezone: string;
};

/**
 * `id` comes from newId(), made once per attempt and reused on every retry.
 * A retry whose first try already landed (only the reply was lost) hits
 * the duplicate key error 23505, so that counts as saved.
 */
export async function saveBodyweightEntryAttempt(
  attempt: Omit<BodyweightEntryAttempt, "savedAt">,
): Promise<void> {
  const { error } = await supabase.from("bodyweight_entry_attempts").insert({
    id: attempt.id,
    day: attempt.day,
    weight_kg: attempt.weightKg,
    confirmed: attempt.confirmed,
    timezone: attempt.timezone,
  });

  if (error && error.code !== "23505") throw error;
}

/** All of the user's attempts, oldest first. */
export async function listBodyweightEntryAttempts(): Promise<
  BodyweightEntryAttempt[]
> {
  const { data, error } = await supabase
    .from("bodyweight_entry_attempts")
    .select("id, day, weight_kg, confirmed, saved_at, timezone")
    .order("saved_at")
    .order("id");

  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    day: row.day,
    weightKg: row.weight_kg,
    confirmed: row.confirmed,
    savedAt: new Date(row.saved_at),
    timezone: row.timezone,
  }));
}
