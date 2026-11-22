import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listBodyweights, saveBodyweight } from "@/lib/data/bodyweight";
import { dayRange } from "@/lib/days";

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

export function useSaveBodyweight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBodyweight,
    // Returning the refetch keeps the save pending until the new weight shows.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: bodyweightKeys.all }),
  });
}
