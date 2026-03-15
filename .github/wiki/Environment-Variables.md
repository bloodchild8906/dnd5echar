# Environment Variables

Configuration options for Codex Arcanum.

## Overview

The app can run in two persistence modes:

- Supabase primary with local fallback
- local fallback only

If Supabase variables are not set, the app runs entirely from the local fallback layer.

## Current Variables

| Variable                       | Description                    | Example                      |
| ------------------------------ | ------------------------------ | ---------------------------- |
| `VITE_APP_NAME`                | App display name               | `Codex Arcanum`              |
| `VITE_APP_ENV`                 | Runtime environment label      | `development`                |
| `VITE_DEFAULT_OPEN5E_DOCUMENT` | Default Open5e document filter | `5esrd`                      |
| `VITE_SUPABASE_URL`            | Supabase project URL           | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY`       | Supabase anon key              | `eyJhbGciOiJIUzI1NiIs...`    |

## `.env.local`

Create your local file with:

```bash
cp .env.example .env.local
```

Example:

```bash
VITE_APP_NAME="Codex Arcanum"
VITE_APP_ENV="development"
VITE_DEFAULT_OPEN5E_DOCUMENT="5esrd"
VITE_SUPABASE_URL=""
VITE_SUPABASE_ANON_KEY=""
```

## Supabase Behavior

When both Supabase variables are present:

- the app attempts to bootstrap from Supabase first
- localStorage remains the fallback cache
- the settings page exposes Supabase restore and push actions

When either value is missing:

- the app skips Supabase bootstrap
- the workspace runs entirely from the local fallback layer

## Security Notes

- Never commit `.env.local`
- The anon key is safe for client-side use
- Never use a Supabase service role key in the browser
- Prefer named accounts over anonymous auth for durable multi-device access

## Related Pages

- [[Cloud Sync]]
- [[Development Setup]]
- [[Troubleshooting]]
