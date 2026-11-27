import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";

import {
  type BodyweightEntryAttempt,
  listBodyweightEntryAttempts,
  saveBodyweightEntryAttempt,
} from "@/lib/data/bodyweight";

import { WeightRoomScreen } from "./weight-room-screen";

// A factory, so Jest never loads the real module: it needs Supabase's keys.
jest.mock("@/lib/data/bodyweight", () => ({
  listBodyweightEntryAttempts: jest.fn(),
  saveBodyweightEntryAttempt: jest.fn(),
}));

// Today is Friday 27 November 2026. advanceTimers lets TanStack's timers run.
beforeEach(() =>
  jest.useFakeTimers({
    now: new Date(2026, 10, 27, 8, 0),
    advanceTimers: true,
  }),
);
afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

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
      <WeightRoomScreen />
    </QueryClientProvider>,
  );
}

const logButton = () => screen.findByRole("button", { name: "Log today's BW" });
const field = () => screen.getByPlaceholderText("Weight in kg");
const saveButton = () => screen.getByRole("button", { name: "Save" });
const savedAttempts = () =>
  jest.mocked(saveBodyweightEntryAttempt).mock.calls.map(([a]) => a);

async function logWeight(text: string) {
  await userEvent.press(await logButton());
  await userEvent.clear(field());
  await userEvent.type(field(), text);
  await userEvent.press(saveButton());
}

let savedAt = new Date(2026, 10, 1).getTime();
function attempt(
  day: string,
  weightKg: number | null,
  confirmed = true,
): BodyweightEntryAttempt {
  savedAt += 60_000;
  return {
    id: String(savedAt),
    day,
    weightKg,
    confirmed,
    savedAt: new Date(savedAt),
    timezone: "Europe/Athens",
  };
}

test("shows today's bodyweight: its latest confirmed attempt", async () => {
  jest
    .mocked(listBodyweightEntryAttempts)
    .mockResolvedValue([
      attempt("2026-11-27", 79),
      attempt("2026-11-27", 80.5),
      attempt("2026-11-27", 95, false),
      attempt("2026-11-26", 81),
    ]);
  await renderScreen();

  expect(await screen.findByText("80.5 kg")).toBeOnTheScreen();
});

test("says so when the bodyweights can't load", async () => {
  jest
    .mocked(listBodyweightEntryAttempts)
    .mockRejectedValue(new Error("Network request failed"));
  await renderScreen();

  expect(
    await screen.findByText("Couldn't load your bodyweights."),
  ).toBeOnTheScreen();
});

test("'Log today's BW' opens the sheet on today, holding today's bodyweight", async () => {
  jest
    .mocked(listBodyweightEntryAttempts)
    .mockResolvedValue([attempt("2026-11-27", 80.5)]);
  await renderScreen();

  await userEvent.press(await logButton());

  expect(screen.getByText("Friday, November 27")).toBeOnTheScreen();
  expect(field()).toHaveDisplayValue("80.5");
});

test.each(["80,5", "80.5"])(
  "saving %s adds a confirmed attempt for today, then shows it",
  async (text) => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValueOnce([])
      .mockResolvedValue([attempt("2026-11-27", 80.5)]);
    jest.mocked(saveBodyweightEntryAttempt).mockResolvedValue(undefined);
    await renderScreen();

    await logWeight(text);

    expect(await screen.findByText("80.5 kg")).toBeOnTheScreen();
    expect(screen.queryByPlaceholderText("Weight in kg")).toBeNull();
    expect(savedAttempts()).toEqual([
      {
        id: expect.any(String),
        day: "2026-11-27",
        weightKg: 80.5,
        confirmed: true,
        timezone: expect.any(String),
      },
    ]);
  },
);

test("says so when the save fails", async () => {
  jest.mocked(listBodyweightEntryAttempts).mockResolvedValue([]);
  jest
    .mocked(saveBodyweightEntryAttempt)
    .mockRejectedValue(new Error("violates check constraint"));
  await renderScreen();

  await logWeight("5000");

  expect(
    await screen.findByText("Couldn't save your bodyweight."),
  ).toBeOnTheScreen();
});

test("retries a failed save with the same ID, and gives the next save a new one", async () => {
  jest.mocked(listBodyweightEntryAttempts).mockResolvedValue([]);
  jest
    .mocked(saveBodyweightEntryAttempt)
    .mockRejectedValueOnce(new Error("Network request failed"))
    .mockResolvedValue(undefined);
  await renderScreen();

  await logWeight("80.5");
  await screen.findByText("Couldn't save your bodyweight.");
  await userEvent.press(saveButton());
  await waitFor(() =>
    expect(screen.queryByPlaceholderText("Weight in kg")).toBeNull(),
  );
  await logWeight("80.5");
  await waitFor(() =>
    expect(screen.queryByPlaceholderText("Weight in kg")).toBeNull(),
  );

  const [first, retry, next] = savedAttempts();
  expect(retry.id).toBe(first.id);
  expect(next.id).not.toBe(first.id);
});
