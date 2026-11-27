import { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { BodyweightEntryAttempt } from "@/lib/data/bodyweight";
import { startOfDay, useToday } from "@/lib/days";

import {
  useBodyweightEntryAttempts,
  useSaveBodyweightEntryAttempt,
} from "./api";
import {
  bodyweightOn,
  confirmationReasons,
  isEditable,
  recentTrend,
  type WeekCard,
  weekCards,
  weekOf,
  weekTrend,
  weightWindow,
} from "./bodyweights";

export function WeightRoomScreen() {
  const today = useToday();
  const { data, isError } = useBodyweightEntryAttempts();
  // The day the sheet is open on, or null while it's closed.
  const [sheetDay, setSheetDay] = useState<string | null>(null);
  // The Monday of the week picked, or null for the current week.
  const [pickedMonday, setPickedMonday] = useState<string | null>(null);
  const week = weekOf(pickedMonday ?? today);

  // Rows already on screen stay when a refetch fails, so the error shows
  // only when there is nothing to show instead.
  if (!data) {
    return (
      <View style={styles.screen}>
        {isError ? (
          <Text style={styles.error}>{"Couldn't load your bodyweights."}</Text>
        ) : (
          <Text style={styles.muted}>Loading…</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <WeekPicker
        cards={weekCards(data, today)}
        selected={week[0]}
        onSelect={setPickedMonday}
      />
      <Header attempts={data} week={week} today={today} />
      <WeekChart
        attempts={data}
        week={week}
        today={today}
        onDayPress={setSheetDay}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => setSheetDay(today)}
        style={({ pressed }) => [styles.fab, pressed && styles.dimmed]}
      >
        <Text style={styles.buttonText}>{"Log today's BW"}</Text>
      </Pressable>
      <Modal
        visible={sheetDay !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetDay(null)}
      >
        {/* Mounted only while open, so the field starts from the day's current bodyweight. */}
        {sheetDay !== null ? (
          <BodyweightSheet
            day={sheetDay}
            attempts={data}
            onClose={() => setSheetDay(null)}
          />
        ) : null}
      </Modal>
    </View>
  );
}

const CARD_WIDTH = 96;
const CARD_GAP = 8;

function WeekPicker({
  cards,
  selected,
  onSelect,
}: {
  cards: WeekCard[];
  selected: string;
  onSelect: (monday: string) => void;
}) {
  const scrollView = useRef<ScrollViewInstance>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  function select(index: number) {
    onSelect(cards[index].monday);
    // ScrollView clamps the offset, so the first and last cards stay at the ends.
    const x =
      index * (CARD_WIDTH + CARD_GAP) - (viewportWidth - CARD_WIDTH) / 2;
    scrollView.current?.scrollTo({ x: Math.max(0, x) });
  }

  return (
    <ScrollView
      ref={scrollView}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.picker}
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      // Opens on the current week, the last card.
      onContentSizeChange={() =>
        scrollView.current?.scrollToEnd({ animated: false })
      }
    >
      {cards.map((card, index) => (
        <Pressable
          key={card.monday}
          accessibilityRole="button"
          accessibilityLabel={`${card.label}, ${card.daysWithBodyweight} of 7 days`}
          accessibilityState={{ selected: card.monday === selected }}
          onPress={() => select(index)}
          style={({ pressed }) => [
            styles.card,
            card.monday === selected && styles.selectedCard,
            pressed && styles.dimmed,
          ]}
        >
          <View
            testID="fill"
            style={[
              styles.fill,
              { height: `${(card.daysWithBodyweight / 7) * 100}%` },
            ]}
          />
          <Text style={styles.cardLabel}>{card.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Header({
  attempts,
  week,
  today,
}: {
  attempts: BodyweightEntryAttempt[];
  week: string[];
  today: string;
}) {
  const [isHelpOpen, setHelpOpen] = useState(false);
  const trend = week.includes(today)
    ? recentTrendText(attempts, today)
    : weekTrendText(attempts, week[0]);
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
          style={({ pressed }) => [styles.help, pressed && styles.dimmed]}
        >
          <Text style={styles.helpText}>?</Text>
        </Pressable>
      </View>
      {isHelpOpen ? (
        <Text style={styles.muted}>
          {trend.explanation ?? "N/A due to missing data"}
        </Text>
      ) : null}
      <Text style={styles.muted}>
        {`${shortDate(week[0])} – ${shortDate(week[6])}`}
      </Text>
    </View>
  );
}

// The current week shows the recent trend; a past week its week trend (spec #1).
type TrendText = {
  name: string;
  percent: string | null;
  explanation: string | null;
};

function recentTrendText(
  attempts: BodyweightEntryAttempt[],
  today: string,
): TrendText {
  const trend = recentTrend(attempts, today);
  if (!trend) return { name: "Recent trend", percent: null, explanation: null };
  const percent = formatPercent(trend.percent);
  return {
    name: "Recent trend",
    percent,
    explanation: `The last 3 days average ${formatKg(trend.recent)} kg, against ${formatKg(trend.before)} kg in the 3 days before them: ${percent}.`,
  };
}

function weekTrendText(
  attempts: BodyweightEntryAttempt[],
  monday: string,
): TrendText {
  const trend = weekTrend(attempts, monday);
  if (!trend) return { name: "Week trend", percent: null, explanation: null };
  const percent = formatPercent(trend.percent);
  return {
    name: "Week trend",
    percent,
    explanation: `This week averages ${formatKg(trend.week)} kg, against ${formatKg(trend.before)} kg the week before: ${percent}.`,
  };
}

function formatPercent(percent: number): string {
  const rounded = Math.abs(percent).toFixed(1);
  if (rounded === "0.0") return "0.0%";
  return `${percent > 0 ? "+" : "-"}${rounded}%`;
}

// At most one decimal, without a trailing ".0".
function formatKg(kg: number): string {
  return String(Math.round(kg * 10) / 10);
}

function WeekChart({
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
  const days = week.map((day) => ({
    day,
    bodyweight: bodyweightOn(attempts, day),
  }));
  const range = weightWindow(
    days.flatMap((d) => (d.bodyweight === null ? [] : [d.bodyweight])),
  );

  return (
    <View style={styles.chart}>
      {range ? (
        <View style={styles.axis}>
          <Text style={styles.axisLabel}>{`${range.top} kg`}</Text>
          <Text style={styles.axisLabel}>{`${range.bottom} kg`}</Text>
        </View>
      ) : null}
      {days.map(({ day, bodyweight }) => {
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
            style={({ pressed }) => [styles.column, pressed && styles.dimmed]}
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

function longDate(day: string): string {
  return startOfDay(day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function BodyweightSheet({
  day,
  attempts,
  onClose,
}: {
  day: string;
  attempts: BodyweightEntryAttempt[];
  onClose: () => void;
}) {
  const bodyweight = bodyweightOn(attempts, day);
  const [text, setText] = useState(
    bodyweight === null ? "" : String(bodyweight),
  );
  // The save waiting on the pop-up, with the reasons it names.
  const [asking, setAsking] = useState<{
    weightKg: number | null;
    reasons: string[];
  } | null>(null);
  const { save, isPending, isError } = useSaveBodyweightEntryAttempt();
  const weightKg = parseWeight(text);
  const canSave = weightKg !== null && !isPending;

  function handleSave() {
    if (canSave) ask(weightKg);
  }

  function ask(newWeightKg: number | null) {
    const reasons = confirmationReasons(attempts, day, newWeightKg);
    if (reasons.length > 0) setAsking({ weightKg: newWeightKg, reasons });
    else
      save(
        { day, weightKg: newWeightKg, confirmed: true },
        { onSuccess: onClose },
      );
  }

  function handleAnswer(confirmed: boolean) {
    if (!asking || isPending) return;
    save(
      { day, weightKg: asking.weightKg, confirmed },
      { onSuccess: confirmed ? onClose : () => setAsking(null) },
    );
  }

  if (asking) {
    return (
      <View style={styles.backdrop}>
        <View style={styles.backdropTap} />
        <View style={styles.sheet}>
          {asking.reasons.map((reason) => (
            <Text key={reason} style={styles.reason}>
              {reason}
            </Text>
          ))}
          {isError ? (
            <Text style={styles.error}>{"Couldn't save your bodyweight."}</Text>
          ) : null}
          <View style={styles.answers}>
            <Pressable
              accessibilityRole="button"
              disabled={isPending}
              onPress={() => handleAnswer(false)}
              style={({ pressed }) => [
                styles.button,
                styles.answer,
                styles.secondary,
                (pressed || isPending) && styles.dimmed,
              ]}
            >
              <Text style={styles.secondaryText}>No</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isPending}
              onPress={() => handleAnswer(true)}
              style={({ pressed }) => [
                styles.button,
                styles.answer,
                (pressed || isPending) && styles.dimmed,
              ]}
            >
              <Text style={styles.buttonText}>Yes</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.backdrop}>
      <Pressable style={styles.backdropTap} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{longDate(day)}</Text>
        <TextInput
          style={styles.input}
          placeholder="Weight in kg"
          placeholderTextColor={colors.placeholder}
          keyboardType="decimal-pad"
          returnKeyType="done"
          autoFocus
          onSubmitEditing={handleSave}
          value={text}
          onChangeText={setText}
        />
        {isError ? (
          <Text style={styles.error}>{"Couldn't save your bodyweight."}</Text>
        ) : null}
        {bodyweight !== null ? (
          <Pressable
            accessibilityRole="button"
            disabled={isPending}
            onPress={() => ask(null)}
            style={({ pressed }) => [
              styles.button,
              styles.secondary,
              (pressed || isPending) && styles.dimmed,
            ]}
          >
            <Text style={styles.secondaryText}>Clear</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.button,
            (pressed || !canSave) && styles.dimmed,
          ]}
        >
          <Text style={styles.buttonText}>
            {isPending ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// The decimal keypad types a comma in some languages. The range is left to the
// database's check constraint.
function parseWeight(text: string): number | null {
  const weightKg = Number(text.replace(",", "."));
  return text.trim() !== "" && Number.isFinite(weightKg) ? weightKg : null;
}

const colors = {
  text: "#111111",
  muted: "#666666",
  readOnly: "#9e9e9e",
  placeholder: "#8a8a8a",
  fieldBorder: "#d4d4d4",
  field: "#fafafa",
  sheet: "#ffffff",
  backdrop: "rgba(0, 0, 0, 0.3)",
  primary: "#2f6fed",
  fill: "#dce7fd",
  onPrimary: "#ffffff",
  error: "#c62828",
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  picker: { gap: CARD_GAP },
  card: {
    width: CARD_WIDTH,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    justifyContent: "center",
    overflow: "hidden",
  },
  selectedCard: { borderWidth: 2, borderColor: colors.primary },
  fill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.fill,
  },
  cardLabel: { fontSize: 12, textAlign: "center", color: colors.text },
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
  fab: {
    position: "absolute",
    right: 24,
    bottom: 40,
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  backdrop: { flex: 1, backgroundColor: colors.backdrop },
  backdropTap: { flex: 1 },
  sheet: {
    padding: 24,
    paddingBottom: 40,
    gap: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: colors.sheet,
  },
  sheetTitle: { fontSize: 20, fontWeight: "600", color: colors.text },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    color: colors.text,
    backgroundColor: colors.field,
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  dimmed: { opacity: 0.5 },
  answers: { flexDirection: "row", gap: 12 },
  answer: { flex: 1 },
  secondary: {
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    backgroundColor: colors.sheet,
  },
  secondaryText: { fontSize: 17, fontWeight: "600", color: colors.text },
  reason: { fontSize: 17, color: colors.text },
  buttonText: { fontSize: 17, fontWeight: "600", color: colors.onPrimary },
  muted: { fontSize: 15, color: colors.muted },
  error: { fontSize: 15, color: colors.error },
});
