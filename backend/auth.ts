'use server';

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

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return { error: { message: "Supabase not configured" } as any };
  const { error } = await supabase.auth.signOut();
  return { error };
}
