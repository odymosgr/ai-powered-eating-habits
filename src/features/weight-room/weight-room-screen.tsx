import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { startOfDay, useToday } from "@/lib/days";

import {
  useBodyweightEntryAttempts,
  useSaveBodyweightEntryAttempt,
} from "./api";
import { bodyweightOn } from "./bodyweights";

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
            bodyweight={bodyweight}
            onClose={() => setSheetOpen(false)}
          />
        ) : null}
      </Modal>
    </View>
  );
}

function BodyweightSheet({
  day,
  bodyweight,
  onClose,
}: {
  day: string;
  bodyweight: number | null;
  onClose: () => void;
}) {
  const [text, setText] = useState(
    bodyweight === null ? "" : String(bodyweight),
  );
  const { save, isPending, isError } = useSaveBodyweightEntryAttempt();
  const weightKg = parseWeight(text);
  const canSave = weightKg !== null && !isPending;

  function handleSave() {
    if (!canSave) return;
    save({ day, weightKg, confirmed: true }, { onSuccess: onClose });
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
  buttonText: { fontSize: 17, fontWeight: "600", color: colors.onPrimary },
  muted: { fontSize: 15, color: colors.muted },
  error: { fontSize: 15, color: colors.error },
});
