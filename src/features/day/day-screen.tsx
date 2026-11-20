import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { startOfDay, useToday } from "@/lib/days";

export function DayScreen() {
  const today = useToday();

  return (
    <View>
      <Text>Today is:</Text>
      <Text>{startOfDay(today).toLocaleDateString()}</Text>
      <Text>You will never be younger, you have never been older</Text>
      <Link href="/bodyweight" style={styles.link}>
        Your weight
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  link: { fontSize: 16, color: "#2f6fed" },
});
