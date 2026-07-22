import { getSupabase } from "./supabase";

export async function signIn(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } as any };
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUp(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } as any };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signInAnonymously() {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } as any };
  const { data, error } = await supabase.auth.signInAnonymously();
  return { data, error };
}

// Attach email+password to the CURRENT (anonymous) session — same uid, all data kept.
export async function linkEmail(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } as any };
  const { data, error } = await supabase.auth.updateUser({ email, password });
  return { data, error };
}

export async function updateDisplayName(name: string) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } as any };
  const { data, error } = await supabase.auth.updateUser({
    data: { display_name: name },
  });
  return { data, error };
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return { error: { message: "Supabase not configured" } as any };
  const { error } = await supabase.auth.signOut();
  return { error };
}
