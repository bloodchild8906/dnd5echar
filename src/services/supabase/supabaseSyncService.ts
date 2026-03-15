import { PersistedAppData } from '../../domain/models';
import { migratePersistedAppData } from '../storage/migrations';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

interface SnapshotRow {
  payload: PersistedAppData;
  updated_at: string;
  user_id: string;
}

export const stripSyncMetadata = (data: PersistedAppData): PersistedAppData => ({
  ...data,
  settings: {
    ...data.settings,
    supabase: {
      ...data.settings.supabase,
      userId: null,
      lastSyncedAt: null,
      lastPulledAt: null,
    },
  },
});

export const supabaseSyncService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  async ensureSession() {
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      return sessionData.session;
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.session) {
      throw error ?? new Error('Unable to create a Supabase session.');
    }

    return data.session;
  },

  async getSessionInfo() {
    if (!this.isConfigured()) {
      return null;
    }

    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      return null;
    }

    return {
      userId: data.session.user.id,
    };
  },

  async pushState(payload: PersistedAppData) {
    const session = await this.ensureSession();
    const supabase = getSupabaseClient();
    const cleanedPayload = stripSyncMetadata(payload);
    const { data, error } = await supabase
      .from('app_snapshots')
      .upsert({
        user_id: session.user.id,
        payload: cleanedPayload,
      })
      .select('updated_at,user_id')
      .single();

    if (error) {
      throw error;
    }

    return {
      userId: data.user_id as string,
      updatedAt: data.updated_at as string,
    };
  },

  async pullState() {
    const session = await this.ensureSession();
    const supabase = getSupabaseClient();
    const { data, error, status } = await supabase
      .from('app_snapshots')
      .select('payload,updated_at,user_id')
      .eq('user_id', session.user.id)
      .maybeSingle<SnapshotRow>();

    if (error && status !== 406) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      userId: data.user_id,
      updatedAt: data.updated_at,
      payload: migratePersistedAppData(data.payload),
    };
  },

  async signOut() {
    if (!this.isConfigured()) {
      return;
    }

    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  },
};
