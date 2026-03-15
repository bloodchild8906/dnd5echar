import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionCard } from '../../components/common/SectionCard';
import { useAuth } from '../../context/AuthContext';
import { GameRecord } from '../../domain/collaboration';
import { collaborationService } from '../../services/supabase/collaborationService';
import { selectPersistedAppData, useAppStore } from '../../store/useAppStore';

export const GamesPage = () => {
  const navigate = useNavigate();
  const { configured, user } = useAuth();
  const state = useAppStore((current) => current);
  const replaceAllData = useAppStore((current) => current.replaceAllData);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }

    collaborationService
      .listGamesForUser(user.id)
      .then(setGames)
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'Unable to load games.');
      });
  }, [user]);

  const filteredGames = useMemo(
    () =>
      games.filter(
        (game) =>
          !query ||
          game.name.toLowerCase().includes(query.toLowerCase()) ||
          game.joinCode.toLowerCase().includes(query.toLowerCase())
      ),
    [games, query]
  );

  if (!configured) {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="eyebrow">Games</p>
            <h1>Local mode active</h1>
            <p>
              Supabase is not configured, so campaign collaboration is unavailable. Local
              characters, notes, inventory, and exports still work from this browser.
            </p>
          </div>
          <div className="button-row">
            <button type="button" className="button" onClick={() => navigate('/settings')}>
              Open Settings
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => navigate('/import-export')}
            >
              Open Backups
            </button>
          </div>
        </section>

        <SectionCard
          title="Local Characters"
          subtitle="These sheets are stored in localStorage and remain fully editable offline."
        >
          {state.characters.length ? (
            <div className="stack-list">
              {state.characters.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  className="list-button"
                  onClick={() => navigate(`/characters/${character.id}/sheet`)}
                >
                  <strong>{character.name}</strong>
                  <span>
                    Level {character.level} {character.className}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No local characters yet"
              description="Create a character from the dashboard to start using the app without Supabase."
            />
          )}
        </SectionCard>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="eyebrow">Games</p>
            <h1>Sign in required</h1>
            <p>Authentication is required to create games, join by code, and publish characters.</p>
          </div>
          <button type="button" className="button" onClick={() => navigate('/auth')}>
            Go to Auth
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Games</p>
          <h1>Campaign Collaboration</h1>
          <p>
            Create a game, join a table with a code, and publish character sheets into a GM-managed
            workspace.
          </p>
        </div>
        <button type="button" className="button button--ghost" onClick={() => navigate('/gm')}>
          Open GM Screen
        </button>
      </section>

      <div className="split-layout split-layout--sidebar">
        <SectionCard title="Your Games">
          <div className="toolbar">
            <SearchBar value={query} placeholder="Search games" onChange={setQuery} />
          </div>
          <div className="stack-list">
            {filteredGames.map((game) => (
              <button
                key={game.id}
                type="button"
                className={
                  selectedGameId === game.id ? 'list-button list-button--active' : 'list-button'
                }
                onClick={() => navigate(`/games/${game.id}`)}
              >
                <strong>{game.name}</strong>
                <span>{game.joinCode}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Create or Join Game">
          {message ? <p className="callout">{message}</p> : null}
          <div className="form-grid">
            <label>
              New Game Name
              <input
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="button"
              onClick={async () => {
                try {
                  const game = await collaborationService.createGame(user.id, name || 'New Game');
                  setGames((current) => [game, ...current]);
                  setSelectedGameId(game.id);
                  setName('');
                  setMessage(`Created ${game.name}. Join code: ${game.joinCode}`);
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Unable to create game.');
                }
              }}
            >
              Create Game
            </button>
          </div>
          <div className="form-grid">
            <label>
              Join Code
              <input
                className="input"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              />
            </label>
            <button
              type="button"
              className="button button--ghost"
              onClick={async () => {
                try {
                  await collaborationService.joinGameByCode(user.id, joinCode);
                  const refreshed = await collaborationService.listGamesForUser(user.id);
                  setGames(refreshed);
                  setMessage(`Joined game ${joinCode}.`);
                  setJoinCode('');
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Unable to join game.');
                }
              }}
            >
              Join Game
            </button>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Publish Local Character to Selected Game"
        subtitle="This shares the selected character bundle with the game and makes it viewable according to game RBAC rules."
      >
        <div className="stack-list">
          {state.characters.map((character) => (
            <article key={character.id} className="spell-card spell-card--compact">
              <div>
                <h3>{character.name}</h3>
                <p>
                  Level {character.level} {character.className}
                </p>
              </div>
              <button
                type="button"
                className="button"
                disabled={!selectedGameId}
                onClick={async () => {
                  try {
                    await collaborationService.publishCharacterToGame(
                      selectedGameId,
                      user.id,
                      character,
                      state.companions,
                      state.notes
                    );
                    setMessage(`Published ${character.name} to the selected game.`);
                  } catch (error) {
                    setMessage(
                      error instanceof Error ? error.message : 'Unable to publish character.'
                    );
                  }
                }}
              >
                Publish to Game
              </button>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Load Shared Character into Local Workspace"
        subtitle="Pull a published character bundle down for local viewing and editing."
      >
        <div className="stack-list">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              className="list-button"
              onClick={async () => {
                try {
                  const bundles = await collaborationService.listCharacterBundles(game.id);
                  if (!bundles[0]) {
                    setMessage(`No published characters found in ${game.name}.`);
                    return;
                  }

                  const current = selectPersistedAppData(state);
                  replaceAllData({
                    ...current,
                    characters: [
                      ...current.characters.filter(
                        (entry) => entry.id !== bundles[0].bundle.character.id
                      ),
                      bundles[0].bundle.character,
                    ],
                    companions: [
                      ...current.companions.filter(
                        (entry) => entry.parentCharacterId !== bundles[0].bundle.character.id
                      ),
                      ...bundles[0].bundle.companions,
                    ],
                    notes: [
                      ...current.notes.filter(
                        (entry) => entry.relatedCharacterId !== bundles[0].bundle.character.id
                      ),
                      ...bundles[0].bundle.notes,
                    ],
                    selectedCharacterId: bundles[0].bundle.character.id,
                  });
                  navigate(`/characters/${bundles[0].bundle.character.id}/sheet`);
                } catch (error) {
                  setMessage(
                    error instanceof Error ? error.message : 'Unable to load shared character.'
                  );
                }
              }}
            >
              <strong>{game.name}</strong>
              <span>Load latest shared character</span>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};
