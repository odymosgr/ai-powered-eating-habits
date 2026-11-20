import { useQuery } from "@tanstack/react-query";

import { listBodyweights } from "@/lib/data/bodyweight";
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
