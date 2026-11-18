import { supabase } from "@/lib/supabase";

export type Bodyweight = { id: string; weightKg: number; measuredAt: Date };

// `id` comes from newId(), made once per entry and reused on every retry.
// A retry whose first attempt already landed (only the reply was lost) hits
// the duplicate key error 23505, so that counts as saved.
export async function saveBodyweight(entry: {
  id: string;
  weightKg: number;
}): Promise<void> {
  const { error } = await supabase
    .from("bodyweights")
    .insert({ id: entry.id, weight_kg: entry.weightKg });

  if (error && error.code !== "23505") throw error;
}

// From `from` up to, but not including, `to`, oldest first.
export async function listBodyweights(
  from: Date,
  to: Date,
): Promise<Bodyweight[]> {
  const { data, error } = await supabase
    .from("bodyweights")
    .select("id, weight_kg, measured_at")
    .gte("measured_at", from.toISOString())
    .lt("measured_at", to.toISOString())
    .order("measured_at");

  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    weightKg: row.weight_kg,
    measuredAt: new Date(row.measured_at),
  }));
}
