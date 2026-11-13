import { useEffect, useState } from "react";

import { supabase } from "./supabase";

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signOut() {
  // "local" signs out this phone only
  await supabase.auth.signOut({ scope: "local" });
}

export function useAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // The first event carries the session restored from the phone's storage.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(session !== null);
      setIsLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { isSignedIn, isLoading };
}
