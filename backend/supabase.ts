import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseClient) {
    // You can safely hardcode your Supabase URL and Anon Key here.
    // These keys are designed to be public. Never hardcode the Service Role Key!
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://niayswkqlgajkzujrafe.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYXlzd2txbGdhamt6dWpyYWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzE0NDcsImV4cCI6MjA5NDQwNzQ0N30.bS_1-8fsoSc3eLVpPYD5n7y39whtdZPlwznZU1L3NBk";

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Missing Supabase environment variables or hardcoded values.");
      return null;
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};
