import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState } from "react-native";

import { supabase } from "./supabase";

export const queryClient = new QueryClient({
  defaultOptions: {
    // supabase-js already retries the reads a second try can fix (network
    // errors, 503, 520) and never retries writes, so one retry layer is enough.
    queries: { retry: false },
  },
});

// TanStack refetches when the "window" regains focus. In an app, that's
// coming back to the foreground.
focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener("change", (state) =>
    setFocused(state === "active"),
  );
  return () => subscription.remove();
});

// The next person to sign in on this phone must never see the last one's rows.
supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") queryClient.clear();
});
