import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useToday } from "@/lib/days";

import { useBodyweightEntryAttempts } from "./api";
import { BodyweightSheet } from "./bodyweight-sheet";
import { weekCards, weekOf } from "./bodyweights";
import { colors, common } from "./styles";
import { TrendHeader } from "./trend-header";
import { WeekChart } from "./week-chart";
import { WeekPicker } from "./week-picker";

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
          <Text style={common.error}>{"Couldn't load your bodyweights."}</Text>
        ) : (
          <Text style={common.muted}>Loading…</Text>
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
      <TrendHeader attempts={data} week={week} today={today} />
      <WeekChart
        attempts={data}
        week={week}
        today={today}
        onDayPress={setSheetDay}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => setSheetDay(today)}
        style={({ pressed }) => [styles.fab, pressed && common.dimmed]}
      >
        <Text style={common.buttonText}>{"Log today's BW"}</Text>
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

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
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
});
