interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_DEFAULT_OPEN5E_DOCUMENT?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
