import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { SignOutButton } from "@/features/auth/sign-out-button";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";

// Keep the splash screen up until we know whether you're signed in.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isSignedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen
            name="index"
            options={{ title: "Today", headerRight: () => <SignOutButton /> }}
          />
          <Stack.Screen name="weight-room" options={{ title: "Weight Room" }} />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
