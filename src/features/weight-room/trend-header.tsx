import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BodyweightEntryAttempt } from "@/lib/data/bodyweight";
import { startOfDay } from "@/lib/days";

import { recentTrend, weekTrend } from "./bodyweights";
import { colors, common } from "./styles";

export function TrendHeader({
  attempts,
  week,
  today,
}: {
  attempts: BodyweightEntryAttempt[];
  week: string[];
  today: string;
}) {
  const [isHelpOpen, setHelpOpen] = useState(false);
  const trend = trendText(attempts, week, today);
  const shortDate = (day: string) =>
    startOfDay(day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <View style={styles.header}>
      <View style={styles.trendRow}>
        <Text style={styles.trend}>
          {`${trend.name}: ${trend.percent ?? "N/A"}`}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`About the ${trend.name.toLowerCase()}`}
          onPress={() => setHelpOpen((open) => !open)}
          style={({ pressed }) => [styles.help, pressed && common.dimmed]}
        >
          <Text style={styles.helpText}>?</Text>
        </Pressable>
      </View>
      {isHelpOpen ? (
        <Text style={common.muted}>
          {trend.explanation ?? "N/A due to missing data"}
        </Text>
      ) : null}
      <Text style={common.muted}>
        {`${shortDate(week[0])} – ${shortDate(week[6])}`}
      </Text>
    </View>
  );
}

/** The trend the header shows; `percent` and `explanation` are null without one. */
type TrendText = {
  name: string;
  percent: string | null;
  explanation: string | null;
};

// The current week shows the recent trend; a past week its week trend (spec #1).
function trendText(
  attempts: BodyweightEntryAttempt[],
  week: string[],
  today: string,
): TrendText {
  const isCurrentWeek = week.includes(today);
  const name = isCurrentWeek ? "Recent trend" : "Week trend";
  const trend = isCurrentWeek
    ? recentTrend(attempts, today)
    : weekTrend(attempts, week[0]);
  if (!trend) return { name, percent: null, explanation: null };
  const percent = formatPercent(trend.percent);
  const [average, before] = [formatKg(trend.average), formatKg(trend.before)];
  return {
    name,
    percent,
    explanation: isCurrentWeek
      ? `The last 3 days average ${average} kg, against ${before} kg in the 3 days before them: ${percent}.`
      : `This week averages ${average} kg, against ${before} kg the week before: ${percent}.`,
  };
}

function formatPercent(percent: number): string {
  const rounded = Math.abs(percent).toFixed(1);
  if (rounded === "0.0") return "0.0%";
  return `${percent > 0 ? "+" : "-"}${rounded}%`;
}

/** At most one decimal, without a trailing ".0". */
function formatKg(kg: number): string {
  return String(Math.round(kg * 10) / 10);
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  trend: { fontSize: 20, fontWeight: "600", color: colors.text },
  help: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  helpText: { fontSize: 15, fontWeight: "600", color: colors.muted },
});
