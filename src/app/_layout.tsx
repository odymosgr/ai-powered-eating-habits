import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { SignOutButton } from "@/features/auth/sign-out-button";
import { useAuth } from "@/lib/auth";

// Keep the splash screen up until we know whether you're signed in.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isSignedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  return (
    <Stack>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen
          name="index"
          options={{ title: "Today", headerRight: () => <SignOutButton /> }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
