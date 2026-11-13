import { useEffect, useState } from "react";

import { supabase } from "./supabase";

// Sign-in and the current user, behind our own functions (guardrail 13),
// so the rest of the app never touches Supabase's auth types.

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signOut() {
  await supabase.auth.signOut();
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
