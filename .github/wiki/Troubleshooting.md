# Troubleshooting

Common issues and solutions for the D&D 5e Character Sheet Manager.

## Installation & Setup

### `pnpm install` fails

**Error**: `ERR_PNPM_UNSUPPORTED_ENGINE` or Node version mismatch

**Solution**:

```bash
# Check Node version
node --version  # Should be >= 20.19.0

# Install correct version (using nvm or similar)
nvm install 20
nvm use 20

# Re-enable corepack
corepack enable
pnpm install
```

### Port 5173 already in use

**Error**: `Error: listen EADDRINUSE: address already in use :::5173`

**Solution**:

```bash
# Use different port
pnpm dev -- --port 3000

# Or find and kill process
lsof -ti:5173 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5173   # Windows
```

## Data & Storage

### Characters disappeared / Data lost

**Cause**: Browser storage cleared or using different browser/profile

**Solution**:

1. Check you're using the same browser
2. If cloud sync enabled: Settings → Sync → Download from cloud
3. Check browser didn't clear site data automatically
4. Restore from JSON backup if you exported characters

### "Storage quota exceeded"

**Cause**: Browser localStorage limit reached (~5-10MB)

**Solution**:

1. Export and archive old characters
2. Clear browser data for site:
   - Chrome: DevTools → Application → Clear site data
   - Firefox: DevTools → Storage → Clear site data
3. Enable cloud sync to reduce local storage needs

### Changes not saving

**Check**:

1. Browser console (F12) for errors
2. localStorage isn't disabled in browser settings
3. Private/incognito mode (data clears on close — this is expected)

## Cloud Sync Issues

### "Sync failed" error

**Causes & Solutions**:

| Cause                   | Solution                                                 |
| ----------------------- | -------------------------------------------------------- |
| No internet             | Check connection; app works offline                      |
| Wrong Supabase URL/key  | Verify `.env.local` values match Supabase Dashboard      |
| Anonymous auth disabled | Enable in Supabase Auth settings                         |
| Migration not applied   | Run SQL from `supabase/migrations/`                      |
| Supabase down           | Check [status.supabase.com](https://status.supabase.com) |

### Data not syncing between devices

**Check**:

1. Same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on both devices
2. Both devices have internet connection
3. Sync completed on first device (check sync indicator)
4. Try manual sync: Settings → Sync → Sync Now

### Duplicate characters after sync

**Cause**: Conflicting local and remote data

**Solution**:

1. Settings → Sync → Download from cloud (overwrites local)
2. Or manually delete duplicates in character list

## Build & Deploy

### Build fails at "type-check" or "lint"

**Solution**:

```bash
# Fix auto-fixable issues
pnpm lint:fix
pnpm format

# Check specific errors
pnpm type-check
pnpm lint
```

### Vercel deployment fails

**Check**:

1. Environment variables set in Vercel dashboard
2. `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` in GitHub secrets
3. Build logs for specific errors

### Tests fail in CI but pass locally

**Common causes**:

- Different Node versions
- Missing environment variables
- Timezone differences

**Solution**: Check CI environment matches local (`node --version`)

## Runtime Issues

### Blank page / App won't load

**Check browser console for**:

| Error                               | Solution                          |
| ----------------------------------- | --------------------------------- |
| `localStorage is not defined`       | Enable cookies/storage in browser |
| `Cannot read property of undefined` | Clear site data and reload        |
| Chunk load error                    | Hard refresh (Ctrl+Shift+R)       |

### Character sheet not updating

**Try**:

1. Refresh page (data saves automatically)
2. Check for JavaScript errors in console
3. Verify character ID in URL matches intended character

### Open5e reference not loading

**Check**:

1. Internet connection (first load needs network)
2. [open5e.com](https://open5e.com) status
3. Try again later — content caches after first successful load

## Browser-Specific

### Safari / iOS issues

- **localStorage in private mode**: Doesn't persist (Safari limitation)
- **Solution**: Use regular browsing mode or enable cloud sync

### Firefox

- **Storage clearing**: Firefox may clear storage more aggressively
- **Solution**: Export backups regularly, enable cloud sync

### Chrome/Edge

- Generally best supported
- Check for extension conflicts if issues occur

## Getting Help

If your issue isn't listed:

1. Check browser console (F12 → Console) for error messages
2. Check [GitHub Issues](https://github.com/Bloodchild8906/dnd5echar/issues) for similar reports
3. [Open a new issue](https://github.com/Bloodchild8906/dnd5echar/issues/new) with:
   - Browser and version
   - Steps to reproduce
   - Error messages from console
   - Screenshots if relevant

## Reset Everything

Nuclear option if nothing works:

```
1. Export any important data first
2. Clear browser storage:
   - DevTools → Application → Clear site data
   - Or: chrome://settings/clearBrowserData
3. Remove and re-clone repository
4. Fresh install: pnpm install
5. Reconfigure environment variables
```

---

_See also: [[Getting Started]] | [[Cloud Sync]] | [[Development Setup]]_
