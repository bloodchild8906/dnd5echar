import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { SectionCard } from '../../components/common/SectionCard';
import { getCharacterSummary } from '../../domain/derived';
import { useAppStore } from '../../store/useAppStore';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const characters = useAppStore((state) => state.characters);
  const createCharacter = useAppStore((state) => state.createCharacter);
  const duplicateCharacter = useAppStore((state) => state.duplicateCharacter);
  const deleteCharacter = useAppStore((state) => state.deleteCharacter);
  const selectCharacter = useAppStore((state) => state.selectCharacter);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Character Roster</h1>
          <p>Build, track, print, and export table-ready sheets with local-first persistence.</p>
        </div>
        <button
          type="button"
          className="button"
          onClick={() => {
            const id = createCharacter();
            navigate(`/characters/${id}/builder`);
          }}
        >
          New Character
        </button>
      </section>

      {characters.length === 0 ? (
        <EmptyState title="No characters yet" description="Create a character to unlock the builder, spellbook, inventory, companions, and print views." />
      ) : (
        <div className="card-grid card-grid--wide">
          {characters.map((character) => {
            const summary = getCharacterSummary(character);
            return (
              <SectionCard
                key={character.id}
                title={summary.name}
                subtitle={`${summary.raceName} • Level ${summary.level} ${summary.className}`}
                actions={<Badge tone={summary.currentHp > 0 ? 'success' : 'warning'}>{summary.currentHp}/{summary.maxHp} HP</Badge>}
              >
                <div className="character-card">
                  <div className="character-card__meta">
                    {character.portraitUrl ? <img className="character-card__portrait" src={character.portraitUrl} alt={character.name} /> : <div className="character-card__portrait character-card__portrait--empty">No portrait</div>}
                    <div className="inline-badges">
                      {summary.conditions.map((condition) => (
                        <Badge key={condition} tone="warning">{condition}</Badge>
                      ))}
                      {!summary.conditions.length ? <Badge>Ready</Badge> : null}
                    </div>
                  </div>
                  <div className="button-row">
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        selectCharacter(character.id);
                        navigate(`/characters/${character.id}/sheet`);
                      }}
                    >
                      Open Sheet
                    </button>
                    <button type="button" className="button button--ghost" onClick={() => navigate(`/characters/${character.id}/builder`)}>
                      Builder
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => {
                        const copyId = duplicateCharacter(character.id);
                        if (copyId) {
                          navigate(`/characters/${copyId}/builder`);
                        }
                      }}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="button button--ghost button--danger"
                      onClick={() => {
                        if (window.confirm(`Delete ${character.name}?`)) {
                          deleteCharacter(character.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
