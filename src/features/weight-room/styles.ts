import { StyleSheet } from "react-native";

export const colors = {
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

export const common = StyleSheet.create({
  dimmed: { opacity: 0.5 },
  buttonText: { fontSize: 17, fontWeight: "600", color: colors.onPrimary },
  muted: { fontSize: 15, color: colors.muted },
  error: { fontSize: 15, color: colors.error },
});
