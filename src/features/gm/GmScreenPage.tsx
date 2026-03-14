import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { SectionCard } from '../../components/common/SectionCard';
import { TagInput } from '../../components/common/TagInput';
import { useAuth } from '../../context/AuthContext';
import { CharacterBundleRecord, GameMembership, GamePermissionSet, GameRecord, GameRole } from '../../domain/collaboration';
import { collaborationService } from '../../services/supabase/collaborationService';
import { useAppStore } from '../../store/useAppStore';
import { parseNumber } from '../../utils/numbers';

const roleOptions: GameRole[] = ['gm', 'assistant_gm', 'player', 'viewer'];

export const GmScreenPage = () => {
  const { configured, user } = useAuth();
  const characters = useAppStore((state) => state.characters);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [memberships, setMemberships] = useState<GameMembership[]>([]);
  const [bundles, setBundles] = useState<CharacterBundleRecord[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }

    collaborationService.listGamesForUser(user.id).then((loaded) => {
      setGames(loaded.filter((entry) => entry.gmUserId === user.id));
      setSelectedGameId((current) => current || loaded.find((entry) => entry.gmUserId === user.id)?.id || '');
    }).catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : 'Unable to load games.');
    });
  }, [user]);

  useEffect(() => {
    if (!selectedGameId) {
      return;
    }

    collaborationService.listMemberships(selectedGameId).then(setMemberships);
    collaborationService.listCharacterBundles(selectedGameId).then(setBundles);
  }, [selectedGameId]);

  const selectedGame = useMemo(() => games.find((entry) => entry.id === selectedGameId) ?? null, [games, selectedGameId]);

  if (!configured) {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="eyebrow">GM Screen</p>
            <h1>Remote GM controls unavailable</h1>
            <p>Supabase is not configured, so game membership, RBAC, and shared sheet editing are disabled. Local sheets still remain editable on this device.</p>
          </div>
        </section>

        <SectionCard title="Local Roster" subtitle="These characters are available in local-only mode until Supabase collaboration is configured.">
          {characters.length ? (
            <div className="stack-list">
              {characters.map((character) => (
                <article key={character.id} className="spell-card spell-card--compact">
                  <div>
                    <h3>{character.name}</h3>
                    <p>Level {character.level} {character.className}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No local characters" description="Create or import characters before using the GM roster locally." />
          )}
        </SectionCard>
      </div>
    );
  }

  if (!user) {
    return <EmptyState title="Sign in required" description="GM controls are only available to authenticated users." />;
  }

  if (!games.length) {
    return <EmptyState title="No GM games yet" description="Create a game from the Games page first, then manage roles and shared characters here." />;
  }

  const updatePermissions = async (membership: GameMembership, nextRole: GameRole, nextPermissions: GamePermissionSet) => {
    await collaborationService.updateMembership(membership.id, nextRole, nextPermissions);
    setMemberships((current) => current.map((entry) => (entry.id === membership.id ? { ...entry, role: nextRole, permissions: nextPermissions } : entry)));
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">GM Screen</p>
          <h1>Campaign Control</h1>
          <p>Manage player roles, shared character permissions, and remote character bundles for the selected game.</p>
        </div>
      </section>

      {message ? <p className="callout">{message}</p> : null}

      <div className="split-layout split-layout--sidebar">
        <SectionCard title="Games">
          <div className="stack-list">
            {games.map((game) => (
              <button key={game.id} type="button" className={selectedGameId === game.id ? 'list-button list-button--active' : 'list-button'} onClick={() => setSelectedGameId(game.id)}>
                <strong>{game.name}</strong>
                <span>{game.joinCode}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={selectedGame?.name ?? 'Game'} subtitle="Role-based access controls determine who can view or edit shared sheets.">
          <div className="section-inline-header">
            <h3>Memberships</h3>
          </div>
          {memberships.map((membership) => (
            <div key={membership.id} className="stacked-editor">
              <div className="form-grid form-grid--three compact-grid">
                <label>
                  User ID
                  <input className="input" readOnly value={membership.userId} />
                </label>
                <label>
                  Role
                  <select className="input" value={membership.role} onChange={(event) => updatePermissions(membership, event.target.value as GameRole, membership.permissions)}>
                    {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </label>
                <label className="checkbox-field">
                  <span>Manage Players</span>
                  <input type="checkbox" checked={membership.permissions.canManagePlayers} onChange={(event) => updatePermissions(membership, membership.role, { ...membership.permissions, canManagePlayers: event.target.checked })} />
                </label>
                <label className="checkbox-field">
                  <span>View Characters</span>
                  <input type="checkbox" checked={membership.permissions.canViewCharacters} onChange={(event) => updatePermissions(membership, membership.role, { ...membership.permissions, canViewCharacters: event.target.checked })} />
                </label>
                <label className="checkbox-field">
                  <span>Edit Characters</span>
                  <input type="checkbox" checked={membership.permissions.canEditCharacters} onChange={(event) => updatePermissions(membership, membership.role, { ...membership.permissions, canEditCharacters: event.target.checked })} />
                </label>
              </div>
            </div>
          ))}

          <div className="section-inline-header">
            <h3>Shared Characters</h3>
          </div>
          {bundles.map((bundle) => (
            <div key={bundle.id} className="stacked-editor">
              <div className="form-grid form-grid--three">
                <label>
                  Character Name
                  <input className="input" value={bundle.bundle.character.name} onChange={(event) => setBundles((current) => current.map((entry) => (entry.id === bundle.id ? { ...entry, name: event.target.value, bundle: { ...entry.bundle, character: { ...entry.bundle.character, name: event.target.value } } } : entry)))} />
                </label>
                <label>
                  Current HP
                  <input className="input" type="number" value={bundle.bundle.character.combat.hitPoints.current} onChange={(event) => setBundles((current) => current.map((entry) => (entry.id === bundle.id ? { ...entry, bundle: { ...entry.bundle, character: { ...entry.bundle.character, combat: { ...entry.bundle.character.combat, hitPoints: { ...entry.bundle.character.combat.hitPoints, current: parseNumber(event.target.value) } } } } } : entry)))} />
                </label>
                <label>
                  Max HP
                  <input className="input" type="number" value={bundle.bundle.character.combat.hitPoints.max} onChange={(event) => setBundles((current) => current.map((entry) => (entry.id === bundle.id ? { ...entry, bundle: { ...entry.bundle, character: { ...entry.bundle.character, combat: { ...entry.bundle.character.combat, hitPoints: { ...entry.bundle.character.combat.hitPoints, max: parseNumber(event.target.value) } } } } } : entry)))} />
                </label>
              </div>
              <TagInput values={bundle.bundle.character.conditions} onChange={(values) => setBundles((current) => current.map((entry) => (entry.id === bundle.id ? { ...entry, bundle: { ...entry.bundle, character: { ...entry.bundle.character, conditions: values } } } : entry)))} />
              <textarea className="textarea" rows={3} value={bundle.bundle.character.notes} onChange={(event) => setBundles((current) => current.map((entry) => (entry.id === bundle.id ? { ...entry, bundle: { ...entry.bundle, character: { ...entry.bundle.character, notes: event.target.value } } } : entry)))} />
              <button
                type="button"
                className="button"
                onClick={async () => {
                  try {
                    await collaborationService.saveCharacterBundle(bundle);
                    setMessage(`Saved ${bundle.bundle.character.name}.`);
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : 'Unable to save character bundle.');
                  }
                }}
              >
                Save Shared Character
              </button>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  );
};
