import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BodyweightEntryAttempt } from "@/lib/data/bodyweight";
import { longDate, startOfDay } from "@/lib/days";

import {
  bodyweightOn,
  bodyweightsOf,
  isEditable,
  weightWindow,
} from "./bodyweights";
import { colors, common } from "./styles";

export function WeekChart({
  attempts,
  week,
  today,
  onDayPress,
}: {
  attempts: BodyweightEntryAttempt[];
  week: string[];
  today: string;
  onDayPress: (day: string) => void;
}) {
  const range = weightWindow(bodyweightsOf(attempts, week));

  return (
    <View style={styles.chart}>
      {range ? (
        <View style={styles.axis}>
          <Text style={styles.axisLabel}>{`${range.top} kg`}</Text>
          <Text style={styles.axisLabel}>{`${range.bottom} kg`}</Text>
        </View>
      ) : null}
      {week.map((day) => {
        const bodyweight = bodyweightOn(attempts, day);
        const editable = isEditable(day, today);
        const letter = (
          <Text style={editable ? styles.letter : styles.readOnlyLetter}>
            {startOfDay(day).toLocaleDateString("en-US", { weekday: "narrow" })}
          </Text>
        );
        if (day > today) {
          return (
            <View key={day} style={styles.column}>
              <View style={styles.plot} />
              {letter}
            </View>
          );
        }
        const plot = (
          <View style={styles.plot}>
            {bodyweight === null || !range ? (
              <Text style={styles.missing}>?</Text>
            ) : (
              <View
                testID="bar"
                style={[
                  styles.bar,
                  {
                    height: `${((bodyweight - range.bottom) / (range.top - range.bottom)) * 100}%`,
                  },
                ]}
              >
                {/* Above the bar, in the plot's top padding when the bar is full height. */}
                <Text style={styles.barLabel}>{String(bodyweight)}</Text>
              </View>
            )}
          </View>
        );
        const label = `${longDate(day)}, ${bodyweight === null ? "no bodyweight" : `${bodyweight} kg`}`;
        return editable ? (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => onDayPress(day)}
            style={({ pressed }) => [styles.column, pressed && common.dimmed]}
          >
            {plot}
            {letter}
          </Pressable>
        ) : (
          <View key={day} accessibilityLabel={label} style={styles.column}>
            {plot}
            {letter}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: "row", height: 240, gap: 4 },
  axis: { justifyContent: "space-between", paddingTop: 20, paddingBottom: 28 },
  axisLabel: { fontSize: 12, color: colors.muted },
  column: { flex: 1, alignItems: "center", gap: 6 },
  plot: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 20,
  },
  bar: {
    alignSelf: "stretch",
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  barLabel: {
    position: "absolute",
    top: -18,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 12,
    color: colors.text,
  },
  missing: { fontSize: 17, fontWeight: "600", color: colors.muted },
  letter: { fontSize: 15, fontWeight: "700", color: colors.text },
  readOnlyLetter: { fontSize: 15, fontWeight: "400", color: colors.readOnly },
});
