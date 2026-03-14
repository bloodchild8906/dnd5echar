import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const getSupabaseEnv = () => ({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
};

export const getSupabaseClient = (): SupabaseClient => {
  if (client) {
    return client;
  }

  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  client = createClient(url, anonKey);
  return client;
};
