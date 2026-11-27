import { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { WeekCard } from "./bodyweights";
import { colors, common } from "./styles";

const CARD_WIDTH = 96;
const CARD_GAP = 8;

export function WeekPicker({
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
            pressed && common.dimmed,
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

const styles = StyleSheet.create({
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
});
