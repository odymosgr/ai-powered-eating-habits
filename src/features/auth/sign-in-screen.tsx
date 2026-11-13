import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

import { signIn } from "@/lib/auth";

export function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleSignIn() {
    setIsSigningIn(true);
    setError(null);
    const result = await signIn(email, password);
    setIsSigningIn(false);
    setError(result.error);
  }

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        autoComplete="password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button
        title={isSigningIn ? "Signing in…" : "Sign in"}
        disabled={isSigningIn}
        onPress={handleSignIn}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", gap: 12, padding: 24 },
  input: { borderWidth: 1, borderColor: "#999", borderRadius: 8, padding: 12 },
  error: { color: "#c00" },
});
