import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { BodyweightEntryAttempt } from "@/lib/data/bodyweight";
import { longDate } from "@/lib/days";

import { useSaveBodyweightEntryAttempt } from "./api";
import { bodyweightOn, confirmationReasons } from "./bodyweights";
import { colors, common } from "./styles";

export function BodyweightSheet({
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
  const [pendingConfirmation, setPendingConfirmation] = useState<{
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
    if (reasons.length > 0)
      setPendingConfirmation({ weightKg: newWeightKg, reasons });
    else
      save(
        { day, weightKg: newWeightKg, confirmed: true },
        { onSuccess: onClose },
      );
  }

  function handleAnswer(confirmed: boolean) {
    if (!pendingConfirmation || isPending) return;
    save(
      { day, weightKg: pendingConfirmation.weightKg, confirmed },
      { onSuccess: confirmed ? onClose : () => setPendingConfirmation(null) },
    );
  }

  if (pendingConfirmation) {
    return (
      <View style={styles.backdrop}>
        <View style={styles.backdropTap} />
        <View style={styles.sheet}>
          {pendingConfirmation.reasons.map((reason) => (
            <Text key={reason} style={styles.reason}>
              {reason}
            </Text>
          ))}
          {isError ? (
            <Text style={common.error}>{"Couldn't save your bodyweight."}</Text>
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
                (pressed || isPending) && common.dimmed,
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
                (pressed || isPending) && common.dimmed,
              ]}
            >
              <Text style={common.buttonText}>Yes</Text>
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
          <Text style={common.error}>{"Couldn't save your bodyweight."}</Text>
        ) : null}
        {bodyweight !== null ? (
          <Pressable
            accessibilityRole="button"
            disabled={isPending}
            onPress={() => ask(null)}
            style={({ pressed }) => [
              styles.button,
              styles.secondary,
              (pressed || isPending) && common.dimmed,
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
            (pressed || !canSave) && common.dimmed,
          ]}
        >
          <Text style={common.buttonText}>
            {isPending ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * The weight typed in `text`, or null when it isn't a number. The range is
 * left to the database's check constraint.
 */
function parseWeight(text: string): number | null {
  // The decimal keypad types a comma in some languages.
  const weightKg = Number(text.replace(",", "."));
  return text.trim() !== "" && Number.isFinite(weightKg) ? weightKg : null;
}

const styles = StyleSheet.create({
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
  answers: { flexDirection: "row", gap: 12 },
  answer: { flex: 1 },
  secondary: {
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    backgroundColor: colors.sheet,
  },
  secondaryText: { fontSize: 17, fontWeight: "600", color: colors.text },
  reason: { fontSize: 17, color: colors.text },
});
