import { StatusBar } from "expo-status-bar";
import { type ComponentRef, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { signIn } from "@/lib/auth";

export function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Lets the email field's "Next" key move the cursor to the password field.
  const passwordInput = useRef<ComponentRef<typeof TextInput>>(null);

  async function handleSignIn() {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setError(null);
    const result = await signIn(email, password);
    setIsSigningIn(false);
    setError(result.error);
  }

  return (
    // Tapping outside the fields closes the keyboard.
    <Pressable
      style={styles.screen}
      onPress={Keyboard.dismiss}
      accessible={false}
    >
      <StatusBar style="dark" />
      {/* Adds padding at the bottom while the keyboard is open, so it never covers the form. */}
      <KeyboardAvoidingView style={styles.form} behavior="padding">
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in with your email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordInput.current?.focus()}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          ref={passwordInput}
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          autoComplete="current-password"
          textContentType="password"
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={handleSignIn}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          accessibilityRole="button"
          disabled={isSigningIn}
          onPress={handleSignIn}
          style={({ pressed }) => [
            styles.button,
            (pressed || isSigningIn) && styles.buttonDimmed,
          ]}
        >
          <Text style={styles.buttonText}>
            {isSigningIn ? "Signing in…" : "Sign in"}
          </Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </KeyboardAvoidingView>
    </Pressable>
  );
}

// Fixed colors, so the phone's dark mode can't turn the text light on this white screen.
const colors = {
  background: "#ffffff",
  text: "#111111",
  muted: "#666666",
  placeholder: "#8a8a8a",
  border: "#d4d4d4",
  field: "#fafafa",
  primary: "#2f6fed",
  onPrimary: "#ffffff",
  error: "#c62828",
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  form: { flex: 1, justifyContent: "center", gap: 12, padding: 24 },
  title: { fontSize: 28, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 12 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    color: colors.text,
    backgroundColor: colors.field,
  },
  button: {
    height: 52,
    marginTop: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  buttonDimmed: { opacity: 0.7 },
  buttonText: { fontSize: 17, fontWeight: "600", color: colors.onPrimary },
  error: { fontSize: 15, color: colors.error },
});
