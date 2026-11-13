import "react-native-url-polyfill/auto";
import "expo-sqlite/localStorage/install";

import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!configuredUrl || !publishableKey) {
  throw new Error(
    "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
  );
}

// On the phone, localhost is the phone itself. In development, a local URL
// points at the Mac that runs Metro instead, so it follows the Mac's changing IP.
const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
const url =
  __DEV__ && metroHost
    ? configuredUrl.replace("//localhost:", `//${metroHost}:`)
    : configuredUrl;

// The app's only Supabase client (tech-stack.md §5).
export const supabase = createClient(url, publishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
