import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Route guard for Supabase-backed pages (/games/*, /gm).
 * - When Supabase is not configured: shows a configuration notice (not an error).
 * - When configured but not signed in: redirects to /auth.
 * - When signed in: renders children.
 */
export const RequireAuth = ({ children }: RequireAuthProps) => {
  const { configured, loading, user } = useAuth();

  if (!configured) {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="eyebrow">Configuration required</p>
            <h1>Supabase not configured</h1>
            <p>
              This section requires Supabase. Set{' '}
              <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> in your environment to enable
              multiplayer features. Local character management remains fully available.
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-stack">
        <div className="empty-state">Checking session…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
