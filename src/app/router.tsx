import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { CharacterBuilderPage } from '../features/characters/CharacterBuilderPage';
import { CharacterSheetPage } from '../features/characters/CharacterSheetPage';
import { CompanionsPage } from '../features/companions/CompanionsPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { HomebrewPage } from '../features/homebrew/HomebrewPage';
import { ImportExportPage } from '../features/import-export/ImportExportPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { NotesPage } from '../features/notes/NotesPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { SpellbookPage } from '../features/spells/SpellbookPage';
import { WildShapesPage } from '../features/wild-shapes/WildShapesPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'homebrew', element: <HomebrewPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'import-export', element: <ImportExportPage /> },
      { path: 'characters/:characterId/builder', element: <CharacterBuilderPage /> },
      { path: 'characters/:characterId/sheet', element: <CharacterSheetPage /> },
      { path: 'characters/:characterId/spells', element: <SpellbookPage /> },
      { path: 'characters/:characterId/inventory', element: <InventoryPage /> },
      { path: 'characters/:characterId/companions', element: <CompanionsPage /> },
      { path: 'characters/:characterId/forms', element: <WildShapesPage /> },
      { path: 'characters/:characterId/notes', element: <NotesPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
