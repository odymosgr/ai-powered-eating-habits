import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";

import { listBodyweights, saveBodyweight } from "@/lib/data/bodyweight";

import { BodyweightScreen } from "./bodyweight-screen";

// A factory, so Jest never loads the real module: it needs Supabase's keys.
jest.mock("@/lib/data/bodyweight", () => ({
  listBodyweights: jest.fn(),
  saveBodyweight: jest.fn(),
}));

afterEach(() => jest.clearAllMocks());

async function renderScreen() {
  // With gcTime Infinity, TanStack schedules no cleanup timer to outlive the test.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <BodyweightScreen />
    </QueryClientProvider>,
  );
}

const field = () => screen.getByPlaceholderText("Weight in kg");
const saveButton = () => screen.getByRole("button", { name: "Save" });
const savedEntries = () =>
  jest.mocked(saveBodyweight).mock.calls.map(([entry]) => entry);

async function saveWeight(text: string) {
  await userEvent.type(field(), text);
  await userEvent.press(saveButton());
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

test("saves a weight, then clears the field and lists it", async () => {
  jest
    .mocked(listBodyweights)
    .mockResolvedValueOnce([])
    .mockResolvedValue([
      { id: "1", weightKg: 80.5, measuredAt: new Date(2026, 10, 20, 8, 15) },
    ]);
  jest.mocked(saveBodyweight).mockResolvedValue(undefined);
  await renderScreen();
  await screen.findByText("No weights yet today.");

  await saveWeight("80,5");

  expect(await screen.findByText("80.5 kg")).toBeOnTheScreen();
  await waitFor(() => expect(field()).toHaveDisplayValue(""));
  expect(savedEntries()).toEqual([{ id: expect.any(String), weightKg: 80.5 }]);
});

test("says so when the save fails", async () => {
  jest.mocked(listBodyweights).mockResolvedValue([]);
  jest
    .mocked(saveBodyweight)
    .mockRejectedValue(new Error("violates check constraint"));
  await renderScreen();

  await saveWeight("5000");

  expect(
    await screen.findByText("Couldn't save your weight."),
  ).toBeOnTheScreen();
});

test("retries a failed save with the same ID, and gives the next weight a new one", async () => {
  jest.mocked(listBodyweights).mockResolvedValue([]);
  jest
    .mocked(saveBodyweight)
    .mockRejectedValueOnce(new Error("Network request failed"))
    .mockResolvedValue(undefined);
  await renderScreen();

  await saveWeight("80.5");
  await screen.findByText("Couldn't save your weight.");
  await userEvent.press(saveButton());
  await waitFor(() => expect(field()).toHaveDisplayValue(""));
  await saveWeight("80.5");
  await waitFor(() => expect(field()).toHaveDisplayValue(""));

  const [first, retry, next] = savedEntries();
  expect(retry.id).toBe(first.id);
  expect(next.id).not.toBe(first.id);
});
