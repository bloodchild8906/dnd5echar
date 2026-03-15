import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { appEnv, hasSupabaseConfig } from '../../config/env';

let client: SupabaseClient | null = null;

export const getSupabaseEnv = () => ({
  url: appEnv.supabaseUrl,
  anonKey: appEnv.supabaseAnonKey,
});

export const isSupabaseConfigured = (): boolean => {
  return hasSupabaseConfig();
};

export const getSupabaseClient = (): SupabaseClient => {
  if (client) {
    return client;
  }

  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
  }

  client = createClient(url, anonKey);
  return client;
};
