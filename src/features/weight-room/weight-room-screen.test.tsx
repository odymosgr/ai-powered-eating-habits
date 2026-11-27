import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  screen,
  userEvent,
  waitFor,
  within,
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
// Each editable day is a button named by its date and bodyweight.
const dayButton = (name: string) => screen.findByRole("button", { name });
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

  expect(await dayButton("Friday, November 27, 80.5 kg")).toBeOnTheScreen();
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

    expect(await dayButton("Friday, November 27, 80.5 kg")).toBeOnTheScreen();
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

describe("confirmation pop-ups", () => {
  const yesButton = () => screen.getByRole("button", { name: "Yes" });
  const noButton = () => screen.getByRole("button", { name: "No" });
  const sheetClosed = () =>
    waitFor(() =>
      expect(screen.queryByPlaceholderText("Weight in kg")).toBeNull(),
    );

  beforeEach(() =>
    jest.mocked(saveBodyweightEntryAttempt).mockResolvedValue(undefined),
  );

  test("replacing a different weight asks first; Yes saves a confirmed attempt", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([attempt("2026-11-27", 80.5)]);
    await renderScreen();

    await logWeight("81");

    expect(screen.getByText("Replace 80.5 kg with 81 kg?")).toBeOnTheScreen();
    expect(savedAttempts()).toEqual([]);
    await userEvent.press(yesButton());
    await sheetClosed();
    expect(savedAttempts()).toEqual([
      expect.objectContaining({
        day: "2026-11-27",
        weightKg: 81,
        confirmed: true,
      }),
    ]);
  });

  test("No saves a declined attempt, keeps the day's bodyweight and returns to the sheet", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValueOnce([attempt("2026-11-27", 80.5)])
      .mockResolvedValue([
        attempt("2026-11-27", 80.5),
        attempt("2026-11-27", 81, false),
      ]);
    await renderScreen();

    await logWeight("81");
    await userEvent.press(noButton());

    expect(await screen.findByDisplayValue("81")).toBeOnTheScreen();
    expect(screen.queryByText("Replace 80.5 kg with 81 kg?")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Friday, November 27, 80.5 kg" }),
    ).toBeOnTheScreen();
    expect(savedAttempts()).toEqual([
      expect.objectContaining({
        day: "2026-11-27",
        weightKg: 81,
        confirmed: false,
      }),
    ]);
  });

  test("saving the weight the day already has asks nothing and saves a confirmed attempt", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([
        attempt("2026-11-20", 70),
        attempt("2026-11-27", 80.5),
      ]);
    await renderScreen();

    await userEvent.press(await logButton());
    await userEvent.press(saveButton());

    await sheetClosed();
    expect(savedAttempts()).toEqual([
      expect.objectContaining({ weightKg: 80.5, confirmed: true }),
    ]);
  });

  test("Clear shows only when the day has a bodyweight", async () => {
    jest.mocked(listBodyweightEntryAttempts).mockResolvedValue([]);
    await renderScreen();

    await userEvent.press(await logButton());

    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
  });

  test.each([
    [true, "no bodyweight"],
    [false, "80.5 kg"],
  ])(
    "Clear asks first; answering confirmed = %s saves an empty attempt, and the day shows %s",
    async (confirmed, shown) => {
      const before = [attempt("2026-11-27", 80.5)];
      jest
        .mocked(listBodyweightEntryAttempts)
        .mockResolvedValueOnce(before)
        .mockResolvedValue([...before, attempt("2026-11-27", null, confirmed)]);
      await renderScreen();

      await userEvent.press(await logButton());
      await userEvent.press(screen.getByRole("button", { name: "Clear" }));
      expect(screen.getByText("Clear 80.5 kg?")).toBeOnTheScreen();
      await userEvent.press(confirmed ? yesButton() : noButton());

      expect(
        await dayButton(`Friday, November 27, ${shown}`),
      ).toBeOnTheScreen();
      expect(savedAttempts()).toEqual([
        expect.objectContaining({
          day: "2026-11-27",
          weightKg: null,
          confirmed,
        }),
      ]);
    },
  );

  test("a weight more than 5% from the latest bodyweight of the 7 days before asks 'Are you sure?'", async () => {
    jest.mocked(listBodyweightEntryAttempts).mockResolvedValue([
      attempt("2026-11-19", 100),
      // The latest of the 7 days before today, though saved first.
      attempt("2026-11-25", 80),
      attempt("2026-11-24", 72),
    ]);
    await renderScreen();

    await logWeight("84.5");

    expect(
      screen.getByText("Are you sure? 84.5 kg is more than 5% from 80 kg."),
    ).toBeOnTheScreen();
    await userEvent.press(yesButton());
    await sheetClosed();
    expect(savedAttempts()).toEqual([
      expect.objectContaining({ weightKg: 84.5, confirmed: true }),
    ]);
  });

  test.each(["84", "76"])(
    "%s kg, within 5% of the latest bodyweight, asks nothing",
    async (text) => {
      jest
        .mocked(listBodyweightEntryAttempts)
        .mockResolvedValue([attempt("2026-11-25", 80)]);
      await renderScreen();

      await logWeight(text);

      await sheetClosed();
      expect(savedAttempts()).toEqual([
        expect.objectContaining({ confirmed: true }),
      ]);
    },
  );

  test("bodyweights more than 7 days before, or declined, don't count for 'Are you sure?'", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([
        attempt("2026-11-19", 80),
        attempt("2026-11-26", 80, false),
      ]);
    await renderScreen();

    await logWeight("90");

    await sheetClosed();
    expect(savedAttempts()).toHaveLength(1);
  });

  test("when several reasons apply, one pop-up names them all", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([
        attempt("2026-11-26", 80),
        attempt("2026-11-27", 80.5),
      ]);
    await renderScreen();

    await logWeight("8.05");

    expect(screen.getByText("Replace 80.5 kg with 8.05 kg?")).toBeOnTheScreen();
    expect(
      screen.getByText("Are you sure? 8.05 kg is more than 5% from 80 kg."),
    ).toBeOnTheScreen();
    expect(screen.getAllByRole("button", { name: "Yes" })).toHaveLength(1);
  });
});

describe("week chart", () => {
  test("shows a bar per day of the current week, '?' for a missing day, and only the letter for days ahead", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([
        attempt("2026-11-22", 70),
        attempt("2026-11-23", 80),
        attempt("2026-11-25", 81.5),
        attempt("2026-11-26", 80),
        attempt("2026-11-26", null),
        attempt("2026-11-27", 82),
      ]);
    await renderScreen();

    const monday = await dayButton("Monday, November 23, 80 kg");
    expect(within(monday).getByText("80")).toBeOnTheScreen();
    expect(within(monday).getByText("M")).toBeOnTheScreen();
    const tuesday = await dayButton("Tuesday, November 24, no bodyweight");
    expect(within(tuesday).getByText("?")).toBeOnTheScreen();
    expect(
      await dayButton("Wednesday, November 25, 81.5 kg"),
    ).toBeOnTheScreen();
    expect(
      await dayButton("Thursday, November 26, no bodyweight"),
    ).toBeOnTheScreen();
    expect(await dayButton("Friday, November 27, 82 kg")).toBeOnTheScreen();
    expect(screen.queryByText("70")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Saturday|Sunday/ }),
    ).toBeNull();
    expect(screen.getAllByText("S")).toHaveLength(2);
  });

  test("editable days have a thick black letter; days ahead a thinner gray one", async () => {
    jest.mocked(listBodyweightEntryAttempts).mockResolvedValue([]);
    await renderScreen();

    const friday = await dayButton("Friday, November 27, no bodyweight");
    expect(within(friday).getByText("F")).toHaveStyle({
      fontWeight: "700",
      color: "#111111",
    });
    for (const letter of screen.getAllByText("S")) {
      expect(letter).toHaveStyle({ fontWeight: "400", color: "#9e9e9e" });
    }
  });

  test("tapping a past day opens the sheet on that day, and the attempt names it", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([attempt("2026-11-24", 80)]);
    jest.mocked(saveBodyweightEntryAttempt).mockResolvedValue(undefined);
    await renderScreen();

    await userEvent.press(await dayButton("Tuesday, November 24, 80 kg"));
    expect(screen.getByText("Tuesday, November 24")).toBeOnTheScreen();
    expect(field()).toHaveDisplayValue("80");
    await userEvent.clear(field());
    await userEvent.type(field(), "80");
    await userEvent.press(saveButton());

    await waitFor(() =>
      expect(savedAttempts()).toEqual([
        expect.objectContaining({ day: "2026-11-24", weightKg: 80 }),
      ]),
    );
  });

  test("tapping a missing day opens the sheet on that day, empty", async () => {
    jest.mocked(listBodyweightEntryAttempts).mockResolvedValue([]);
    await renderScreen();

    await userEvent.press(
      await dayButton("Monday, November 23, no bodyweight"),
    );

    expect(screen.getByText("Monday, November 23")).toBeOnTheScreen();
    expect(field()).toHaveDisplayValue("");
  });

  test("tapping a day ahead does nothing", async () => {
    jest.mocked(listBodyweightEntryAttempts).mockResolvedValue([]);
    await renderScreen();

    await userEvent.press((await screen.findAllByText("S"))[0]);

    expect(screen.queryByPlaceholderText("Weight in kg")).toBeNull();
  });

  test("the weight window is 5 kg with whole-kg ends, centred on the week's average; bars start at its bottom", async () => {
    // Average 81.17 kg: 78.67 to 83.67, rounded to 79 to 84.
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([
        attempt("2026-11-23", 80),
        attempt("2026-11-25", 81.5),
        attempt("2026-11-27", 82),
      ]);
    await renderScreen();

    expect(await screen.findByText("84 kg")).toBeOnTheScreen();
    expect(screen.getByText("79 kg")).toBeOnTheScreen();
    const monday = await dayButton("Monday, November 23, 80 kg");
    expect(within(monday).getByTestId("bar")).toHaveStyle({ height: "20%" });
  });

  test("the window widens when the week's bodyweights span more than 5 kg", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([
        attempt("2026-11-23", 76.2),
        attempt("2026-11-27", 84.5),
      ]);
    await renderScreen();

    expect(await screen.findByText("85 kg")).toBeOnTheScreen();
    expect(screen.getByText("76 kg")).toBeOnTheScreen();
  });

  test("the window moves to hold a bodyweight its centred position would cut off", async () => {
    // Average 81.2 kg would give 79 to 84, cutting off 84.9.
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([
        attempt("2026-11-23", 80),
        attempt("2026-11-24", 80),
        attempt("2026-11-25", 80),
        attempt("2026-11-27", 84.9),
      ]);
    await renderScreen();

    expect(await screen.findByText("85 kg")).toBeOnTheScreen();
    expect(screen.getByText("80 kg")).toBeOnTheScreen();
  });
});

describe("header", () => {
  const trendHelp = () =>
    screen.getByRole("button", { name: "About the recent trend" });

  test("shows the week's dates", async () => {
    jest.mocked(listBodyweightEntryAttempts).mockResolvedValue([]);
    await renderScreen();

    expect(await screen.findByText("Nov 23 – Nov 29")).toBeOnTheScreen();
  });

  test("the recent trend compares the last 3 days with the 3 before them, reaching into last week", async () => {
    // Nov 25–27 average 78.8 kg; Nov 22–24 (Sunday last week) average 80 kg.
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([
        attempt("2026-11-21", 90),
        attempt("2026-11-22", 79),
        attempt("2026-11-23", 81),
        attempt("2026-11-25", 79),
        attempt("2026-11-26", 78.6),
      ]);
    await renderScreen();

    expect(await screen.findByText("Recent trend: -1.5%")).toBeOnTheScreen();
    await userEvent.press(trendHelp());
    expect(
      screen.getByText(
        "The last 3 days average 78.8 kg, against 80 kg in the 3 days before them: -1.5%.",
      ),
    ).toBeOnTheScreen();
  });

  test("a rise shows with a plus sign", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([
        attempt("2026-11-22", 80),
        attempt("2026-11-24", 80),
        attempt("2026-11-26", 82),
        attempt("2026-11-27", 82),
      ]);
    await renderScreen();

    expect(await screen.findByText("Recent trend: +2.5%")).toBeOnTheScreen();
  });

  test.each([
    [
      "the last 3 days",
      [
        attempt("2026-11-22", 80),
        attempt("2026-11-23", 80),
        attempt("2026-11-27", 80),
      ],
    ],
    [
      "the 3 days before them",
      [
        attempt("2026-11-23", 80),
        attempt("2026-11-26", 80),
        attempt("2026-11-27", 80),
      ],
    ],
  ])(
    "the recent trend is N/A when %s hold fewer than 2 bodyweights",
    async (_group, attempts) => {
      jest.mocked(listBodyweightEntryAttempts).mockResolvedValue(attempts);
      await renderScreen();

      expect(await screen.findByText("Recent trend: N/A")).toBeOnTheScreen();
      await userEvent.press(trendHelp());
      expect(screen.getByText("N/A due to missing data")).toBeOnTheScreen();
    },
  );
});
