import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { RequireAuth } from '../components/layout/RequireAuth';

const AuthPage = lazy(() =>
  import('../features/auth/AuthPage').then((module) => ({ default: module.AuthPage }))
);
const CharacterBuilderPage = lazy(() =>
  import('../features/characters/CharacterBuilderPage').then((module) => ({
    default: module.CharacterBuilderPage,
  }))
);
const CharacterSheetPage = lazy(() =>
  import('../features/characters/CharacterSheetPage').then((module) => ({
    default: module.CharacterSheetPage,
  }))
);
const CompanionsPage = lazy(() =>
  import('../features/companions/CompanionsPage').then((module) => ({
    default: module.CompanionsPage,
  }))
);
const CompendiumPage = lazy(() =>
  import('../features/compendium/CompendiumPage').then((module) => ({
    default: module.CompendiumPage,
  }))
);
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  }))
);
const GamesPage = lazy(() =>
  import('../features/games/GamesPage').then((module) => ({ default: module.GamesPage }))
);
const GameDetailPage = lazy(() =>
  import('../features/games/GameDetailPage').then((module) => ({
    default: module.GameDetailPage,
  }))
);
const GmScreenPage = lazy(() =>
  import('../features/gm/GmScreenPage').then((module) => ({ default: module.GmScreenPage }))
);
const HomebrewPage = lazy(() =>
  import('../features/homebrew/HomebrewPage').then((module) => ({
    default: module.HomebrewPage,
  }))
);
const ImportExportPage = lazy(() =>
  import('../features/import-export/ImportExportPage').then((module) => ({
    default: module.ImportExportPage,
  }))
);
const InventoryPage = lazy(() =>
  import('../features/inventory/InventoryPage').then((module) => ({
    default: module.InventoryPage,
  }))
);
const NotesPage = lazy(() =>
  import('../features/notes/NotesPage').then((module) => ({ default: module.NotesPage }))
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  }))
);
const SpellbookPage = lazy(() =>
  import('../features/spells/SpellbookPage').then((module) => ({
    default: module.SpellbookPage,
  }))
);
const WildShapesPage = lazy(() =>
  import('../features/wild-shapes/WildShapesPage').then((module) => ({
    default: module.WildShapesPage,
  }))
);
const SettlementManagerPage = lazy(() =>
  import('../features/settlements/SettlementManagerPage').then((module) => ({
    default: module.SettlementManagerPage,
  }))
);
const SettlementDetailPage = lazy(() =>
  import('../features/settlements/SettlementDetailPage').then((module) => ({
    default: module.SettlementDetailPage,
  }))
);

const RouteLoadingState = () => (
  <div className="page-stack">
    <section className="page-header">
      <div>
        <p className="eyebrow">Loading module</p>
        <h1>Preparing workspace</h1>
        <p>Loading the selected Codex Arcanum view.</p>
      </div>
    </section>
    <div className="empty-state">Please wait while the route bundle loads.</div>
  </div>
);

const RouteBoundary = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<RouteLoadingState />}>{children}</Suspense>
);

const routeElement = (element: ReactNode) => <RouteBoundary>{element}</RouteBoundary>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: routeElement(<DashboardPage />) },
      { path: 'auth', element: routeElement(<AuthPage />) },
      { path: 'games', element: routeElement(<RequireAuth><GamesPage /></RequireAuth>) },
      { path: 'games/:gameId', element: routeElement(<RequireAuth><GameDetailPage /></RequireAuth>) },
      { path: 'gm', element: routeElement(<RequireAuth><GmScreenPage /></RequireAuth>) },
      { path: 'homebrew', element: routeElement(<HomebrewPage />) },
      { path: 'compendium', element: routeElement(<CompendiumPage />) },
      { path: 'settings', element: routeElement(<SettingsPage />) },
      { path: 'import-export', element: routeElement(<ImportExportPage />) },
      {
        path: 'characters/:characterId/builder',
        element: routeElement(<CharacterBuilderPage />),
      },
      {
        path: 'characters/:characterId/sheet',
        element: routeElement(<CharacterSheetPage />),
      },
      {
        path: 'characters/:characterId/spells',
        element: routeElement(<SpellbookPage />),
      },
      {
        path: 'characters/:characterId/inventory',
        element: routeElement(<InventoryPage />),
      },
      {
        path: 'characters/:characterId/companions',
        element: routeElement(<CompanionsPage />),
      },
      { path: 'characters/:characterId/forms', element: routeElement(<WildShapesPage />) },
      { path: 'characters/:characterId/notes', element: routeElement(<NotesPage />) },
      { path: 'settlements', element: routeElement(<SettlementManagerPage />) },
      { path: 'settlements/:settlementId', element: routeElement(<SettlementDetailPage />) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
