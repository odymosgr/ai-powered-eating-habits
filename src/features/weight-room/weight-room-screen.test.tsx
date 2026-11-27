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

describe("week picker", () => {
  const weekCards = () =>
    screen.findAllByRole("button", { name: /'\d\d week \d/ });

  test("shows a card per week from the first bodyweight's week to the current week, numbered within the month of its Monday", async () => {
    jest.mocked(listBodyweightEntryAttempts).mockResolvedValue([
      // Declined and cleared attempts are no bodyweight, so they start no week.
      attempt("2026-08-20", 80, false),
      attempt("2026-08-24", null),
      // Tuesday of the week of Monday August 31, August's 5th Monday.
      attempt("2026-09-01", 80),
    ]);
    await renderScreen();

    const labels = (await weekCards()).map(
      (card) => within(card).getByText(/week/).props.children,
    );
    expect(labels).toEqual([
      "Aug '26 week 5",
      "Sep '26 week 1",
      "Sep '26 week 2",
      "Sep '26 week 3",
      "Sep '26 week 4",
      "Oct '26 week 1",
      "Oct '26 week 2",
      "Oct '26 week 3",
      "Oct '26 week 4",
      "Nov '26 week 1",
      "Nov '26 week 2",
      "Nov '26 week 3",
      "Nov '26 week 4",
    ]);
  });

  test("with no bodyweight yet, shows only the current week", async () => {
    jest.mocked(listBodyweightEntryAttempts).mockResolvedValue([]);
    await renderScreen();

    expect(await weekCards()).toHaveLength(1);
    expect(screen.getByText("Nov '26 week 4")).toBeOnTheScreen();
  });

  test("a card's fill height shows its days with a bodyweight out of 7", async () => {
    const fullWeek = [9, 10, 11, 12, 13, 14, 15].map((date) =>
      attempt(`2026-11-${String(date).padStart(2, "0")}`, 80),
    );
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([
        ...fullWeek,
        attempt("2026-11-16", 80),
        attempt("2026-11-17", 80),
        attempt("2026-11-18", 80, false),
        attempt("2026-11-19", 80),
        attempt("2026-11-19", null),
      ]);
    await renderScreen();

    const full = await screen.findByRole("button", {
      name: "Nov '26 week 2, 7 of 7 days",
    });
    expect(within(full).getByTestId("fill")).toHaveStyle({ height: "100%" });
    expect(
      screen.getByRole("button", { name: "Nov '26 week 3, 2 of 7 days" }),
    ).toBeOnTheScreen();
    const empty = screen.getByRole("button", {
      name: "Nov '26 week 4, 0 of 7 days",
    });
    expect(within(empty).getByTestId("fill")).toHaveStyle({ height: "0%" });
  });

  test("opens on the current week", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([attempt("2026-11-10", 80)]);
    await renderScreen();

    expect(
      await screen.findByRole("button", { name: /Nov '26 week 4/ }),
    ).toBeSelected();
    expect(
      screen.getByRole("button", { name: /Nov '26 week 3/ }),
    ).not.toBeSelected();
    expect(screen.getByText("Nov 23 – Nov 29")).toBeOnTheScreen();
  });

  test("selecting a past week shows its chart, weight window and dates; days older than the editable window are read-only", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([
        attempt("2026-11-16", 78),
        attempt("2026-11-20", 79),
        attempt("2026-11-21", 80),
        attempt("2026-11-27", 90),
      ]);
    await renderScreen();

    const week3 = await screen.findByRole("button", {
      name: /Nov '26 week 3/,
    });
    await userEvent.press(week3);

    expect(week3).toBeSelected();
    expect(screen.getByText("Nov 16 – Nov 22")).toBeOnTheScreen();
    // Average 79 kg: 76.5 to 81.5, rounded to 77 to 82.
    expect(screen.getByText("82 kg")).toBeOnTheScreen();
    expect(screen.getByText("77 kg")).toBeOnTheScreen();
    expect(screen.queryByText("90")).toBeNull();
    const monday = screen.getByLabelText("Monday, November 16, 78 kg");
    expect(within(monday).getByText("78")).toBeOnTheScreen();
    expect(within(monday).getByText("M")).toHaveStyle({
      fontWeight: "400",
      color: "#9e9e9e",
    });
    expect(
      screen.queryByRole("button", { name: /Monday, November 16/ }),
    ).toBeNull();
    const tuesday = screen.getByLabelText(
      "Tuesday, November 17, no bodyweight",
    );
    expect(within(tuesday).getByText("?")).toBeOnTheScreen();
    // Saturday and Sunday are within today and the 6 days before it.
    expect(
      screen.getByRole("button", { name: "Saturday, November 21, 80 kg" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", {
        name: "Sunday, November 22, no bodyweight",
      }),
    ).toBeOnTheScreen();
  });

  test("tapping a read-only day does nothing", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([attempt("2026-11-16", 78)]);
    await renderScreen();

    await userEvent.press(
      await screen.findByRole("button", { name: /Nov '26 week 3/ }),
    );
    await userEvent.press(screen.getByLabelText("Monday, November 16, 78 kg"));

    expect(screen.queryByPlaceholderText("Weight in kg")).toBeNull();
  });

  test("an editable day in a past week can still be set", async () => {
    jest
      .mocked(listBodyweightEntryAttempts)
      .mockResolvedValue([attempt("2026-11-16", 78)]);
    jest.mocked(saveBodyweightEntryAttempt).mockResolvedValue(undefined);
    await renderScreen();

    await userEvent.press(
      await screen.findByRole("button", { name: /Nov '26 week 3/ }),
    );
    await userEvent.press(
      screen.getByRole("button", {
        name: "Sunday, November 22, no bodyweight",
      }),
    );
    expect(screen.getByText("Sunday, November 22")).toBeOnTheScreen();
    await userEvent.type(field(), "79");
    await userEvent.press(saveButton());

    await waitFor(() =>
      expect(savedAttempts()).toEqual([
        expect.objectContaining({
          day: "2026-11-22",
          weightKg: 79,
          confirmed: true,
        }),
      ]),
    );
  });

  describe("a past week's header", () => {
    const previousWeek = [
      "2026-11-09",
      "2026-11-10",
      "2026-11-12",
      "2026-11-15",
    ];
    const pastWeek = ["2026-11-16", "2026-11-17", "2026-11-19", "2026-11-22"];
    const pickWeek3 = async () =>
      userEvent.press(
        await screen.findByRole("button", { name: /Nov '26 week 3/ }),
      );

    test("shows its week trend: its average against the previous week's", async () => {
      jest
        .mocked(listBodyweightEntryAttempts)
        .mockResolvedValue([
          ...previousWeek.map((day) => attempt(day, 80)),
          ...pastWeek.map((day, index) => attempt(day, index < 2 ? 79 : 78)),
          attempt("2026-11-18", 50, false),
        ]);
      await renderScreen();

      await pickWeek3();

      // 78.5 kg against 80 kg.
      expect(screen.getByText("Week trend: -1.9%")).toBeOnTheScreen();
      expect(screen.queryByText(/Recent trend/)).toBeNull();
      await userEvent.press(
        screen.getByRole("button", { name: "About the week trend" }),
      );
      expect(
        screen.getByText(
          "This week averages 78.5 kg, against 80 kg the week before: -1.9%.",
        ),
      ).toBeOnTheScreen();
    });

    test.each([
      ["the week", previousWeek, pastWeek.slice(1)],
      ["the previous week", previousWeek.slice(1), pastWeek],
    ])(
      "the week trend is N/A when %s has fewer than 4 days with a bodyweight",
      async (_week, previousDays, pastDays) => {
        jest
          .mocked(listBodyweightEntryAttempts)
          .mockResolvedValue(
            [...previousDays, ...pastDays].map((day) => attempt(day, 80)),
          );
        await renderScreen();

        await pickWeek3();

        expect(screen.getByText("Week trend: N/A")).toBeOnTheScreen();
        await userEvent.press(
          screen.getByRole("button", { name: "About the week trend" }),
        );
        expect(screen.getByText("N/A due to missing data")).toBeOnTheScreen();
      },
    );

    test("returning to the current week shows the recent trend again", async () => {
      jest
        .mocked(listBodyweightEntryAttempts)
        .mockResolvedValue(pastWeek.map((day) => attempt(day, 80)));
      await renderScreen();

      await pickWeek3();
      await userEvent.press(
        screen.getByRole("button", { name: /Nov '26 week 4/ }),
      );

      expect(screen.getByText("Recent trend: N/A")).toBeOnTheScreen();
    });
  });
});
