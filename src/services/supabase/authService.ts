import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const upsertProfile = async (userId: string, email: string, displayName: string) => {
  const supabase = getSupabaseClient();
  await supabase.from('profiles').upsert({
    user_id: userId,
    email,
    display_name: displayName || email,
  });
};

export const authService = {
  isConfigured: isSupabaseConfigured,

  async signUp(email: string, password: string, displayName: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      await upsertProfile(data.user.id, email, displayName);
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    if (data.user) {
      await upsertProfile(data.user.id, email, data.user.user_metadata.display_name ?? email);
    }

    return data;
  },

  async signOut() {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },

  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const supabase = getSupabaseClient();
    return supabase.auth.onAuthStateChange(callback);
  },
};
