import { createClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "../supabase-config.js";

const client = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: signIn, error: signInError } = await client.auth.signInAnonymously();
if (signInError) {
  throw new Error(`Supabase anonymous sign-in failed: ${signInError.message}. Enable Anonymous sign-ins in Supabase Auth settings.`);
}

const { data: verified, error: verifyError } = await client.auth.getUser(signIn.session.access_token);
if (verifyError || verified.user?.id !== signIn.user.id) {
  throw new Error(`Supabase Auth read-back failed: ${verifyError?.message || "user id did not match"}`);
}

const probeId = `connection-test-${Date.now()}`;
const { error: writeError } = await client.from("visitor_journal").upsert({
  user_id: signIn.user.id,
  latest_match: { probeId },
  match_answers: { probe: true },
  matched_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});
if (writeError) {
  throw new Error(`Supabase database write failed: ${writeError.message}. Apply the Supabase migration first.`);
}

const { data: row, error: readError } = await client
  .from("visitor_journal")
  .select("user_id,latest_match")
  .eq("user_id", signIn.user.id)
  .single();
if (readError || row.latest_match?.probeId !== probeId) {
  throw new Error(`Supabase database read-back failed: ${readError?.message || "probe row did not match"}`);
}

const { error: cleanupError } = await client.from("visitor_journal").delete().eq("user_id", signIn.user.id);
if (cleanupError) throw new Error(`Supabase probe cleanup failed: ${cleanupError.message}`);
console.log("Supabase connection passed: wrote, read back, and removed a temporary visitor_journal row.");
