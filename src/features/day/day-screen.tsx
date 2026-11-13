import { Text, View } from "react-native";

export function DayScreen() {
  const currentDate = new Date().toLocaleDateString();

  return (
    <View>
      <Text>Today is:</Text>
      <Text>{currentDate}</Text>
      <Text>You will never be younger, you have never been older</Text>
    </View>
  );
}
