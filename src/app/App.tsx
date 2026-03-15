import { AppRouter } from './router';
import { AuthProvider } from '../context/AuthContext';
import { useSupabaseAutoSync } from '../hooks/useSupabaseAutoSync';

export const App = () => {
  const persistenceReady = useSupabaseAutoSync();

  if (!persistenceReady) {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="eyebrow">Supabase Bootstrap</p>
            <h1>Preparing primary persistence</h1>
            <p>Attempting to restore the workspace from Supabase before falling back locally.</p>
          </div>
        </section>
        <div className="empty-state">
          Establishing the remote session and loading the latest stored snapshot.
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};
