import { useEffect, useState } from "react";
import { AppState } from "react-native";

// A day is "YYYY-MM-DD" in the phone's time zone. Strings, unlike Dates,
// compare equal by value, so the same day never looks like a change.
function toDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// `new Date(day)` would read the string as midnight UTC, not local midnight.
export function startOfDay(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
}

// Today lives in state: the React Compiler caches what a render computes, so
// a `new Date()` in render would freeze until the app restarts. It's re-read
// when the app returns to the foreground, and every minute while it stays
// open, so midnight shows within a minute.
export function useToday(): string {
  const [today, setToday] = useState(() => toDay(new Date()));

  useEffect(() => {
    const update = () => setToday(toDay(new Date()));
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") update();
    });
    const timer = setInterval(update, 60_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);

  return today;
}
