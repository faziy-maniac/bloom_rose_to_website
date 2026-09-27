export const supabaseUrl = "https://cwobeedwtqlcdcfvwxhe.supabase.co";
export const supabasePublishableKey = "sb_publishable_pSIDIEELXvxFsAAmUnPUHg_DnAQdFpe";

export function isSupabaseConfigured() {
	return Boolean(supabaseUrl && supabasePublishableKey);
}
