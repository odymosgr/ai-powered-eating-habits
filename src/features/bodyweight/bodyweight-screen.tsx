import { StyleSheet, Text, View } from "react-native";

import { useToday } from "@/lib/days";

import { useBodyweightsOn } from "./api";

export function BodyweightScreen() {
  return (
    <View style={styles.screen}>
      <TodaysBodyweights />
    </View>
  );
}

function TodaysBodyweights() {
  const today = useToday();
  const { data, isError } = useBodyweightsOn(today);

  // Rows already on screen stay when a refetch fails, so the error shows
  // only when there is nothing to show instead.
  if (!data) {
    return isError ? (
      <Text style={styles.error}>{"Couldn't load today's weights."}</Text>
    ) : (
      <Text style={styles.muted}>Loading…</Text>
    );
  }
  if (data.length === 0) {
    return <Text style={styles.muted}>No weights yet today.</Text>;
  }
  return (
    <View>
      {data.map((entry) => (
        <View key={entry.id} style={styles.row}>
          <Text style={styles.muted}>
            {entry.measuredAt.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <Text style={styles.weight}>{entry.weightKg} kg</Text>
        </View>
      ))}
    </View>
  );
}

const colors = {
  text: "#111111",
  muted: "#666666",
  border: "#e5e5e5",
  error: "#c62828",
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  weight: { fontSize: 17, color: colors.text },
  muted: { fontSize: 15, color: colors.muted },
  error: { fontSize: 15, color: colors.error },
});
