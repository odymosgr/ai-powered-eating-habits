import { queryClient } from "./query-client";
import { supabase } from "./supabase";

// A factory, so Jest never loads the real module: it needs Supabase's keys.
jest.mock("./supabase", () => ({
  supabase: { auth: { onAuthStateChange: jest.fn() } },
}));

test("forgets every cached row when the user signs out", () => {
  // Fake timers, so the cache's 5-minute cleanup timer can't keep Jest
  // running when this test fails.
  jest.useFakeTimers();
  queryClient.setQueryData(["bodyweights", "day", "2026-11-20"], []);
  const [onAuthChange] = jest.mocked(supabase.auth.onAuthStateChange).mock
    .calls[0];

  onAuthChange("SIGNED_OUT", null);

  expect(queryClient.getQueryCache().getAll()).toEqual([]);
});
