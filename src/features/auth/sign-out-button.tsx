import { Pressable, StyleSheet, Text } from "react-native";

import { signOut } from "@/lib/auth";

export function SignOutButton() {
  return (
    <Pressable accessibilityRole="button" onPress={signOut} hitSlop={8}>
      {({ pressed }) => (
        <Text style={[styles.label, pressed && styles.pressed]}>Sign out</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 16, color: "#2f6fed" },
  pressed: { opacity: 0.5 },
});
