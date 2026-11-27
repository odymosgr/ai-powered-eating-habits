import { useState } from "react";
import {
  Modal,
  Pressable,
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
import { bodyweightOn, confirmationReasons } from "./bodyweights";

export function WeightRoomScreen() {
  const today = useToday();
  const { data, isError } = useBodyweightEntryAttempts();
  const [isSheetOpen, setSheetOpen] = useState(false);

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

  const bodyweight = bodyweightOn(data, today);

  return (
    <View style={styles.screen}>
      <View style={styles.today}>
        <Text style={styles.muted}>Today</Text>
        <Text style={styles.weight}>
          {bodyweight === null ? "?" : `${bodyweight} kg`}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setSheetOpen(true)}
        style={({ pressed }) => [styles.fab, pressed && styles.dimmed]}
      >
        <Text style={styles.buttonText}>{"Log today's BW"}</Text>
      </Pressable>
      <Modal
        visible={isSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        {/* Mounted only while open, so the field starts from the day's current bodyweight. */}
        {isSheetOpen ? (
          <BodyweightSheet
            day={today}
            attempts={data}
            onClose={() => setSheetOpen(false)}
          />
        ) : null}
      </Modal>
    </View>
  );
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
        <Text style={styles.sheetTitle}>
          {startOfDay(day).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
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
  placeholder: "#8a8a8a",
  fieldBorder: "#d4d4d4",
  field: "#fafafa",
  sheet: "#ffffff",
  backdrop: "rgba(0, 0, 0, 0.3)",
  primary: "#2f6fed",
  onPrimary: "#ffffff",
  error: "#c62828",
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  today: { gap: 4 },
  weight: { fontSize: 34, fontWeight: "600", color: colors.text },
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
