import { AppRouter } from './router';
import { AuthProvider } from '../context/AuthContext';
import { useSupabaseAutoSync } from '../hooks/useSupabaseAutoSync';

export const App = () => {
  useSupabaseAutoSync();
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};
