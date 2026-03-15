import { useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/useAppStore';
import { characterNavLinks } from './characterNav';

const getRouteMeta = (
  pathname: string,
  selectedCharacter: { name: string; level: number; className: string } | null
) => {
  if (pathname === '/') {
    return {
      eyebrow: 'Codex Arcanum',
      title: 'Command Center',
      summary:
        'Monitor roster health, sync posture, and campaign tooling from one control surface.',
    };
  }

  if (pathname.startsWith('/games')) {
    return {
      eyebrow: 'Session Ops',
      title: 'Game Administration',
      summary: 'Create tables, publish sheets, and coordinate shared campaign state.',
    };
  }

  if (pathname.startsWith('/gm')) {
    return {
      eyebrow: 'GM Operations',
      title: 'Encounter Console',
      summary: 'Run live table oversight, character reveals, and collaborative session actions.',
    };
  }

  if (pathname.startsWith('/homebrew')) {
    return {
      eyebrow: 'Forge',
      title: 'Homebrew Registry',
      summary: 'Create, override, and organize custom rules content alongside SRD references.',
    };
  }

  if (pathname.startsWith('/settings')) {
    return {
      eyebrow: 'System',
      title: 'Configuration',
      summary: 'Adjust persistence, print, cache, and sync behavior for this workspace.',
    };
  }

  if (pathname.startsWith('/import-export')) {
    return {
      eyebrow: 'Archive',
      title: 'Backup Operations',
      summary: 'Export local data, restore bundles, and manage portable snapshots safely.',
    };
  }

  if (pathname.startsWith('/auth')) {
    return {
      eyebrow: 'Identity',
      title: 'Authentication',
      summary: 'Connect Supabase-backed identity while keeping the local fallback layer available.',
    };
  }

  if (pathname.includes('/builder')) {
    return {
      eyebrow: 'Character Pipeline',
      title: 'Builder Workflow',
      summary: selectedCharacter
        ? `Configuring ${selectedCharacter.name}, level ${selectedCharacter.level} ${selectedCharacter.className}.`
        : 'Create and refine a new dossier through the structured builder flow.',
    };
  }

  if (pathname.includes('/sheet')) {
    return {
      eyebrow: 'Character Pipeline',
      title: 'Dossier Sheet',
      summary: selectedCharacter
        ? `Live editing ${selectedCharacter.name}, level ${selectedCharacter.level} ${selectedCharacter.className}.`
        : 'Review and edit the active character dossier.',
    };
  }

  if (pathname.includes('/spells')) {
    return {
      eyebrow: 'Character Pipeline',
      title: 'Spell Operations',
      summary:
        'Manage prepared spells, slot usage, and spellcasting overrides for the active dossier.',
    };
  }

  if (pathname.includes('/inventory')) {
    return {
      eyebrow: 'Character Pipeline',
      title: 'Inventory Control',
      summary: 'Track equipment loadout, containers, encumbrance, and item notes.',
    };
  }

  if (pathname.includes('/companions')) {
    return {
      eyebrow: 'Character Pipeline',
      title: 'Companion Registry',
      summary: 'Coordinate familiars, followers, mounts, and supporting stat blocks.',
    };
  }

  if (pathname.includes('/forms')) {
    return {
      eyebrow: 'Character Pipeline',
      title: 'Form Library',
      summary: 'Curate wild shape options and active transformation overlays.',
    };
  }

  if (pathname.includes('/notes')) {
    return {
      eyebrow: 'Character Pipeline',
      title: 'Notes Archive',
      summary: 'Capture lore, tactics, and freeform recordkeeping for the active character.',
    };
  }

  return {
    eyebrow: 'Codex Arcanum',
    title: 'Operations',
    summary:
      'Supabase-backed character administration with local fallback and shared table workflows.',
  };
};

export const AppShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { configured, user, signOut } = useAuth();
  const createCharacter = useAppStore((state) => state.createCharacter);
  const charactersCount = useAppStore((state) => state.characters.length);
  const companionCount = useAppStore((state) => state.companions.length);
  const noteCount = useAppStore((state) => state.notes.length);
  const homebrewCount = useAppStore((state) => state.homebrew.length);
  const settings = useAppStore((state) => state.settings);
  const selectedCharacter = useAppStore(
    (state) => state.characters.find((entry) => entry.id === state.selectedCharacterId) ?? null
  );
  const navCollapsed = useAppStore((state) => state.uiPreferences.navCollapsed);
  const updateUiPreferences = useAppStore((state) => state.updateUiPreferences);

  const characterLinks = selectedCharacter
    ? characterNavLinks.map((link) => ({
        to: `/characters/${selectedCharacter.id}/${link.to}`,
        label: link.label,
      }))
    : [];
  const routeMeta = useMemo(
    () =>
      getRouteMeta(
        location.pathname,
        selectedCharacter
          ? {
              name: selectedCharacter.name,
              level: selectedCharacter.level,
              className: selectedCharacter.className,
            }
          : null
      ),
    [location.pathname, selectedCharacter]
  );
  const workspaceLinks = [
    { to: '/', label: 'Command Center', short: 'CC', badge: String(charactersCount) },
    { to: '/games', label: 'Games', short: 'GM' },
    { to: '/gm', label: 'GM Screen', short: 'GS' },
  ];
  const libraryLinks = [
    {
      to: '/homebrew',
      label: 'Homebrew',
      short: 'HB',
      badge: homebrewCount ? String(homebrewCount) : undefined,
    },
    { to: '/settings', label: 'Settings', short: 'ST' },
    {
      to: '/import-export',
      label: 'Archive',
      short: 'AR',
      badge: noteCount ? String(noteCount) : undefined,
    },
    { to: '/auth', label: 'Auth', short: 'ID' },
  ];
  const createNewCharacter = () => {
    const id = createCharacter();
    navigate(`/characters/${id}/builder`);
  };

  return (
    <div className={`app-shell ${navCollapsed ? 'app-shell--collapsed' : ''}`}>
      <aside className="app-sidebar">
        <div className="app-sidebar__brand">
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={() => updateUiPreferences((ui) => ({ ...ui, navCollapsed: !ui.navCollapsed }))}
          >
            {navCollapsed ? '>>' : '<<'}
          </button>
          <div className="app-sidebar__brandmark">CA</div>
          {!navCollapsed ? (
            <div>
              <p className="eyebrow">Codex Arcanum</p>
              <h1>Admin Console</h1>
              <p>Supabase-primary 5e operations hub with local fallback recovery.</p>
            </div>
          ) : null}
        </div>
        {!navCollapsed ? (
          <div className="app-sidebar__status-grid">
            <div className="app-sidebar__status-card">
              <span>Characters</span>
              <strong>{charactersCount}</strong>
            </div>
            <div className="app-sidebar__status-card">
              <span>Companions</span>
              <strong>{companionCount}</strong>
            </div>
            <div className="app-sidebar__status-card">
              <span>Notes</span>
              <strong>{noteCount}</strong>
            </div>
            <div className="app-sidebar__status-card">
              <span>Mode</span>
              <strong>{configured ? 'Supabase' : 'Local fallback'}</strong>
            </div>
          </div>
        ) : null}
        <div className="app-sidebar__section">
          {!navCollapsed ? <span className="app-sidebar__label">Workspace</span> : null}
          <nav className="app-sidebar__nav">
            {workspaceLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
              >
                <span className="nav-link__meta">
                  <span className="nav-link__key">{link.short}</span>
                  {!navCollapsed ? (
                    <span className="nav-link__copy">
                      <strong>{link.label}</strong>
                    </span>
                  ) : null}
                </span>
                {!navCollapsed && link.badge ? (
                  <span className="nav-link__badge">{link.badge}</span>
                ) : null}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="app-sidebar__section">
          {!navCollapsed ? <span className="app-sidebar__label">Registry</span> : null}
          <nav className="app-sidebar__nav">
            {libraryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
              >
                <span className="nav-link__meta">
                  <span className="nav-link__key">{link.short}</span>
                  {!navCollapsed ? (
                    <span className="nav-link__copy">
                      <strong>{link.label}</strong>
                    </span>
                  ) : null}
                </span>
                {!navCollapsed && link.badge ? (
                  <span className="nav-link__badge">{link.badge}</span>
                ) : null}
              </NavLink>
            ))}
          </nav>
        </div>
        {characterLinks.length ? (
          <nav className="app-sidebar__nav app-sidebar__nav--secondary">
            {!navCollapsed ? <span className="app-sidebar__label">Character</span> : null}
            {characterLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
              >
                <span className="nav-link__meta">
                  <span className="nav-link__key">{link.label.slice(0, 2).toUpperCase()}</span>
                  {!navCollapsed ? (
                    <span className="nav-link__copy">
                      <strong>{link.label}</strong>
                    </span>
                  ) : null}
                </span>
              </NavLink>
            ))}
          </nav>
        ) : null}
        {selectedCharacter && !navCollapsed ? (
          <section className="app-sidebar__character-card">
            <p className="eyebrow">Active Dossier</p>
            <h2>{selectedCharacter.name}</h2>
            <p>
              Level {selectedCharacter.level} {selectedCharacter.className}
            </p>
            <div className="inline-badges">
              <span className="status-pill status-pill--accent">{selectedCharacter.raceName}</span>
              <span className="status-pill">
                {selectedCharacter.backgroundName || 'Unassigned background'}
              </span>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => navigate(`/characters/${selectedCharacter.id}/sheet`)}
              >
                Open Sheet
              </button>
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => navigate(`/characters/${selectedCharacter.id}/builder`)}
              >
                Builder
              </button>
            </div>
          </section>
        ) : null}
      </aside>
      <main className="app-main">
        <header className="app-topbar">
          <div className="app-topbar__title">
            <p className="eyebrow">{routeMeta.eyebrow}</p>
            <h1>{routeMeta.title}</h1>
            <p>{routeMeta.summary}</p>
          </div>
          <div className="app-topbar__controls">
            <div className="app-topbar__meta">
              <span className="status-pill status-pill--accent">
                {configured
                  ? settings.supabase.autoSync
                    ? 'Supabase primary'
                    : 'Supabase reconnecting'
                  : 'Local fallback only'}
              </span>
              <span className="status-pill">{charactersCount} dossiers</span>
              <span className="status-pill">{homebrewCount} homebrew entries</span>
              <span className="status-pill">{user?.email ?? user?.id ?? 'Local workspace'}</span>
            </div>
            <div className="button-row">
              <button type="button" className="button" onClick={createNewCharacter}>
                New Character
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => navigate('/import-export')}
              >
                Archive
              </button>
              <button type="button" className="button button--ghost" onClick={() => window.print()}>
                Print
              </button>
              {configured && user?.email ? (
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => void signOut()}
                >
                  Sign Out
                </button>
              ) : null}
            </div>
          </div>
        </header>
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
