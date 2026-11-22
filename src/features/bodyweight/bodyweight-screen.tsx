import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useToday } from "@/lib/days";
import { newId } from "@/lib/ids";

import { useBodyweightsOn, useSaveBodyweight } from "./api";

export function BodyweightScreen() {
  return (
    <View style={styles.screen}>
      <LogBodyweight />
      <TodaysBodyweights />
    </View>
  );
}

function LogBodyweight() {
  const [text, setText] = useState("");
  const save = useSaveBodyweight();
  const weightKg = parseWeight(text);
  const canSave = weightKg !== null && !save.isPending;

  function handleSave() {
    if (!canSave) return;
    // The same weight right after a failed save is a retry of that entry, so
    // it keeps its ID.
    const id =
      save.isError && save.variables.weightKg === weightKg
        ? save.variables.id
        : newId();
    save.mutate({ id, weightKg }, { onSuccess: () => setText("") });
  }

  return (
    <View style={styles.log}>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Weight in kg"
          placeholderTextColor={colors.placeholder}
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={handleSave}
          value={text}
          onChangeText={setText}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.button,
            (pressed || !canSave) && styles.buttonDimmed,
          ]}
        >
          <Text style={styles.buttonText}>
            {save.isPending ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </View>
      {save.isError ? (
        <Text style={styles.error}>{"Couldn't save your weight."}</Text>
      ) : null}
    </View>
  );
}

// The decimal keypad types a comma in some languages. The range is left to the
// database's check constraint.
function parseWeight(text: string): number | null {
  const weightKg = Number(text.replace(",", "."));
  return text.trim() !== "" && Number.isFinite(weightKg) ? weightKg : null;
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
  placeholder: "#8a8a8a",
  border: "#e5e5e5",
  fieldBorder: "#d4d4d4",
  field: "#fafafa",
  primary: "#2f6fed",
  onPrimary: "#ffffff",
  error: "#c62828",
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  log: { gap: 8 },
  form: { flexDirection: "row", gap: 12 },
  input: {
    flex: 1,
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
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  buttonDimmed: { opacity: 0.5 },
  buttonText: { fontSize: 17, fontWeight: "600", color: colors.onPrimary },
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
