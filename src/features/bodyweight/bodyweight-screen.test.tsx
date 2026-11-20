import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react-native";

import { listBodyweights } from "@/lib/data/bodyweight";

import { BodyweightScreen } from "./bodyweight-screen";

// A factory, so Jest never loads the real module: it needs Supabase's keys.
jest.mock("@/lib/data/bodyweight", () => ({ listBodyweights: jest.fn() }));

async function renderScreen() {
  // With gcTime Infinity, TanStack schedules no cleanup timer to outlive the test.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <BodyweightScreen />
    </QueryClientProvider>,
  );
}

test("lists today's weights", async () => {
  jest
    .mocked(listBodyweights)
    .mockResolvedValue([
      { id: "1", weightKg: 80.5, measuredAt: new Date(2026, 10, 18, 8, 15) },
    ]);
  await renderScreen();

  expect(await screen.findByText("80.5 kg")).toBeOnTheScreen();
});

test("says so when nothing is logged yet today", async () => {
  jest.mocked(listBodyweights).mockResolvedValue([]);
  await renderScreen();

  expect(await screen.findByText("No weights yet today.")).toBeOnTheScreen();
});

test("says so when the list can't load", async () => {
  jest
    .mocked(listBodyweights)
    .mockRejectedValue(new Error("Network request failed"));
  await renderScreen();

  expect(
    await screen.findByText("Couldn't load today's weights."),
  ).toBeOnTheScreen();
});
