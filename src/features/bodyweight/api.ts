import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listBodyweights, saveBodyweight } from "@/lib/data/bodyweight";
import { dayRange } from "@/lib/days";
import { newId } from "@/lib/ids";

// Every key starts with "bodyweights", so a save can refresh all bodyweight
// queries at once by that prefix.
const bodyweightKeys = {
  all: ["bodyweights"] as const,
  day: (day: string) => [...bodyweightKeys.all, "day", day] as const,
};

export function useBodyweightsOn(day: string) {
  return useQuery({
    queryKey: bodyweightKeys.day(day),
    queryFn: () => {
      const { from, to } = dayRange(day);
      return listBodyweights(from, to);
    },
  });
}

/**
 * `save(weightKg)` sends a new entry, except the same weight right after a
 * failed save: that's a retry of the entry, so it keeps its ID.
 */
export function useSaveBodyweight() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: saveBodyweight,
    // Returning the refetch keeps the save pending until the new weight shows.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: bodyweightKeys.all }),
  });

  function save(weightKg: number, options?: { onSuccess?: () => void }) {
    const id =
      mutation.isError && mutation.variables.weightKg === weightKg
        ? mutation.variables.id
        : newId();
    mutation.mutate({ id, weightKg }, options);
  }

  return { save, isPending: mutation.isPending, isError: mutation.isError };
}
