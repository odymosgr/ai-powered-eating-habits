import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listBodyweightEntryAttempts,
  saveBodyweightEntryAttempt,
} from "@/lib/data/bodyweight";
import { newId } from "@/lib/ids";

// Every key starts with "bodyweight-entry-attempts", so a save can refresh
// all of the feature's queries at once by that prefix.
const attemptKeys = {
  all: ["bodyweight-entry-attempts"] as const,
};

/** All of the user's attempts, oldest first: a few thousand rows at most over years (spec #1). */
export function useBodyweightEntryAttempts() {
  return useQuery({
    queryKey: attemptKeys.all,
    queryFn: listBodyweightEntryAttempts,
  });
}

type NewAttempt = { day: string; weightKg: number | null; confirmed: boolean };

/**
 * `save(attempt)` sends a new attempt, except the same one right after a
 * failed save: that's a retry, so it keeps its ID.
 */
export function useSaveBodyweightEntryAttempt() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: saveBodyweightEntryAttempt,
    // Returning the refetch keeps the save pending until the new weight shows.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: attemptKeys.all }),
  });

  function save(attempt: NewAttempt, options?: { onSuccess?: () => void }) {
    const failed = mutation.isError ? mutation.variables : undefined;
    const isRetry =
      failed?.day === attempt.day &&
      failed.weightKg === attempt.weightKg &&
      failed.confirmed === attempt.confirmed;
    mutation.mutate(
      {
        ...attempt,
        id: isRetry ? failed.id : newId(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      options,
    );
  }

  return { save, isPending: mutation.isPending, isError: mutation.isError };
}
