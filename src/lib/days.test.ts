import { act, renderHook } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";

import { dayRange, startOfDay, useToday } from "./days";

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("starts a day at local midnight", () => {
  expect(startOfDay("2026-11-18")).toEqual(new Date(2026, 10, 18));
});

test("ends a day at the next midnight, even across a month", () => {
  expect(dayRange("2026-11-30")).toEqual({
    from: new Date(2026, 10, 30),
    to: new Date(2026, 11, 1),
  });
});

test("follows the date when the app returns to the foreground", async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 18, 23, 59) });
  let onAppStateChange: (state: AppStateStatus) => void = () => {};
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_type, listener) => {
      onAppStateChange = listener;
      return { remove: jest.fn() };
    });

  const { result } = await renderHook(() => useToday());
  expect(result.current).toBe("2026-11-18");

  jest.setSystemTime(new Date(2026, 10, 19, 8, 0));
  await act(() => onAppStateChange("active"));

  expect(result.current).toBe("2026-11-19");
});

test("follows the date past midnight while the app stays open", async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 18, 23, 59, 30) });

  const { result } = await renderHook(() => useToday());
  expect(result.current).toBe("2026-11-18");

  await act(() => {
    jest.advanceTimersByTime(60_000);
  });

  expect(result.current).toBe("2026-11-19");
});
