import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./supabase-config.js";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

let sessionPromise;

export async function getStoreSession() {
  if (!isSupabaseConfigured()) {
    throw new Error("Add the Supabase project URL and publishable key to supabase-config.js.");
  }
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      let user = sessionData.session?.user;
      if (!user) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        user = data.user;
      }
      if (!user) throw new Error("Supabase did not return an authenticated visitor.");
      return { supabase, user };
    })().catch((error) => {
      sessionPromise = undefined;
      throw error;
    });
  }
  return sessionPromise;
}
