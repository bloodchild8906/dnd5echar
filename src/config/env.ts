export const appEnv = {
  appName: import.meta.env.VITE_APP_NAME || 'Codex Arcanum',
  appEnvironment: import.meta.env.VITE_APP_ENV || 'local',
  defaultOpen5eDocument: import.meta.env.VITE_DEFAULT_OPEN5E_DOCUMENT || '5esrd',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

export const hasSupabaseConfig = (): boolean =>
  Boolean(appEnv.supabaseUrl && appEnv.supabaseAnonKey);
