import { Text, View } from "react-native";

import { startOfDay, useToday } from "@/lib/days";

export function DayScreen() {
  const today = useToday();

  return (
    <View>
      <Text>Today is:</Text>
      <Text>{startOfDay(today).toLocaleDateString()}</Text>
      <Text>You will never be younger, you have never been older</Text>
    </View>
  );
}
