import { render, screen } from "@testing-library/react-native";

import { DayScreen } from "./day-screen";

test("shows the 'Today is:' label", async () => {
  await render(<DayScreen />);

  expect(screen.getByText("Today is:")).toBeOnTheScreen();
});
