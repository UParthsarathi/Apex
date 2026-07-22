import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseClient) {
    // You can safely hardcode your Supabase URL and Anon Key here.
    // These keys are designed to be public. Never hardcode the Service Role Key!
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dnpxoehrmyftpecxguia.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRucHhvZWhybXlmdHBlY3hndWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2OTU5NzUsImV4cCI6MjEwMDI3MTk3NX0.FUnMnVDKHlXKb35LoENfK2PywtKCbXkoYyyPpq-v5TE";

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Missing Supabase environment variables or hardcoded values.");
      return null;
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};
