import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

const globalLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/homebrew', label: 'Homebrew' },
  { to: '/settings', label: 'Settings' },
  { to: '/import-export', label: 'Import / Export' },
];

export const AppShell = () => {
  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const selectedCharacter = useAppStore((state) => state.characters.find((entry) => entry.id === state.selectedCharacterId) ?? null);
  const navCollapsed = useAppStore((state) => state.uiPreferences.navCollapsed);
  const updateUiPreferences = useAppStore((state) => state.updateUiPreferences);

  const characterLinks = selectedCharacterId
    ? [
        { to: `/characters/${selectedCharacterId}/sheet`, label: 'Current Sheet' },
        { to: `/characters/${selectedCharacterId}/builder`, label: 'Current Builder' },
      ]
    : [];

  return (
    <div className={`app-shell ${navCollapsed ? 'app-shell--collapsed' : ''}`}>
      <aside className="app-sidebar">
        <div className="app-sidebar__brand">
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={() => updateUiPreferences((ui) => ({ ...ui, navCollapsed: !ui.navCollapsed }))}
          >
            {navCollapsed ? '>' : '<'}
          </button>
          {!navCollapsed ? (
            <div>
              <h1>5e Sheet Manager</h1>
              <p>Open5e-powered local play tracker</p>
            </div>
          ) : null}
        </div>
        <nav className="app-sidebar__nav">
          {globalLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        {characterLinks.length ? (
          <nav className="app-sidebar__nav app-sidebar__nav--secondary">
            {!navCollapsed ? <span className="app-sidebar__label">Character</span> : null}
            {characterLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        ) : null}
      </aside>
      <main className="app-main">
        <header className="app-topbar">
          <div>
            <p className="eyebrow">Table-ready character management</p>
            <strong>{selectedCharacter ? `${selectedCharacter.name} • Level ${selectedCharacter.level} ${selectedCharacter.className}` : 'Choose or create a character'}</strong>
          </div>
          <button type="button" className="button button--ghost" onClick={() => window.print()}>
            Print
          </button>
        </header>
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
