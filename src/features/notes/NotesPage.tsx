import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionCard } from '../../components/common/SectionCard';
import { TagInput } from '../../components/common/TagInput';
import { CharacterTabs } from '../../components/layout/CharacterTabs';
import { renderMarkdownLite, renderPlainText } from '../../utils/markdownLite';
import { useCurrentCharacter } from '../../hooks/useCurrentCharacter';
import { useAppStore } from '../../store/useAppStore';
import { createId } from '../../utils/id';

export const NotesPage = () => {
  const { character } = useCurrentCharacter();
  const notes = useAppStore((state) => state.notes);
  const createNote = useAppStore((state) => state.createNote);
  const updateNote = useAppStore((state) => state.updateNote);
  const deleteNote = useAppStore((state) => state.deleteNote);
  const activeNoteId = useAppStore((state) => state.uiPreferences.activeNoteId);
  const updateUiPreferences = useAppStore((state) => state.updateUiPreferences);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => {
        const matchesCharacter =
          !character || !note.relatedCharacterId || note.relatedCharacterId === character.id;
        const matchesSearch =
          !search ||
          note.title.toLowerCase().includes(search.toLowerCase()) ||
          note.body.toLowerCase().includes(search.toLowerCase()) ||
          note.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
        const matchesType = !typeFilter || note.type === typeFilter;
        return matchesCharacter && matchesSearch && matchesType;
      }),
    [character, notes, search, typeFilter]
  );

  const selectedNote =
    filteredNotes.find((note) => note.id === activeNoteId) ?? filteredNotes[0] ?? null;

  if (!character) {
    return (
      <EmptyState
        title="Character not found"
        description="Select a character to manage linked notes."
      />
    );
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Notes and Journaling</p>
          <h1>{character.name}</h1>
          <p>
            Searchable notes for sessions, quests, NPCs, locations, spells, items, and companion
            records.
          </p>
        </div>
      </section>

      <CharacterTabs characterId={character.id} />

      <div className="split-layout split-layout--sidebar">
        <SectionCard
          title="Notes"
          actions={
            <button
              type="button"
              className="button"
              onClick={() =>
                updateUiPreferences((ui) => ({
                  ...ui,
                  activeNoteId: createNote({ relatedCharacterId: character.id }),
                }))
              }
            >
              New Note
            </button>
          }
        >
          <div className="toolbar">
            <SearchBar value={search} placeholder="Search notes" onChange={setSearch} />
            <select
              className="input"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="">All types</option>
              <option value="character">Character</option>
              <option value="session">Session</option>
              <option value="quest">Quest</option>
              <option value="npc">NPC</option>
              <option value="location">Location</option>
              <option value="item">Item</option>
              <option value="spell">Spell</option>
              <option value="companion">Companion</option>
            </select>
          </div>
          <div className="stack-list">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                className={
                  selectedNote?.id === note.id ? 'list-button list-button--active' : 'list-button'
                }
                onClick={() => updateUiPreferences((ui) => ({ ...ui, activeNoteId: note.id }))}
              >
                <strong>{note.title}</strong>
                <span>{note.type}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        {selectedNote ? (
          <SectionCard
            title={selectedNote.title}
            subtitle="Plain text or markdown-lite with optional collapsible sections."
          >
            <div className="form-grid form-grid--three">
              <label>
                Title
                <input
                  className="input"
                  value={selectedNote.title}
                  onChange={(event) =>
                    updateNote(selectedNote.id, (entry) => ({
                      ...entry,
                      title: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Type
                <select
                  className="input"
                  value={selectedNote.type}
                  onChange={(event) =>
                    updateNote(selectedNote.id, (entry) => ({
                      ...entry,
                      type: event.target.value as typeof entry.type,
                    }))
                  }
                >
                  <option value="character">Character</option>
                  <option value="session">Session</option>
                  <option value="quest">Quest</option>
                  <option value="npc">NPC</option>
                  <option value="location">Location</option>
                  <option value="item">Item</option>
                  <option value="spell">Spell</option>
                  <option value="companion">Companion</option>
                </select>
              </label>
              <label>
                Format
                <select
                  className="input"
                  value={selectedNote.format}
                  onChange={(event) =>
                    updateNote(selectedNote.id, (entry) => ({
                      ...entry,
                      format: event.target.value as typeof entry.format,
                    }))
                  }
                >
                  <option value="plain">Plain Text</option>
                  <option value="markdown-lite">Markdown-lite</option>
                </select>
              </label>
            </div>
            <TagInput
              label="Tags"
              values={selectedNote.tags}
              onChange={(values) =>
                updateNote(selectedNote.id, (entry) => ({ ...entry, tags: values }))
              }
            />
            <label className="checkbox-field">
              <span>Pinned</span>
              <input
                type="checkbox"
                checked={selectedNote.pinned}
                onChange={(event) =>
                  updateNote(selectedNote.id, (entry) => ({
                    ...entry,
                    pinned: event.target.checked,
                  }))
                }
              />
            </label>
            <textarea
              className="textarea"
              rows={8}
              value={selectedNote.body}
              onChange={(event) =>
                updateNote(selectedNote.id, (entry) => ({ ...entry, body: event.target.value }))
              }
            />
            <div className="section-inline-header">
              <h3>Sections</h3>
              <button
                type="button"
                className="button button--ghost"
                onClick={() =>
                  updateNote(selectedNote.id, (entry) => ({
                    ...entry,
                    sections: [
                      ...entry.sections,
                      {
                        id: createId('note-section'),
                        title: 'New Section',
                        body: '',
                        collapsed: false,
                      },
                    ],
                  }))
                }
              >
                Add Section
              </button>
            </div>
            {selectedNote.sections.map((section) => (
              <div key={section.id} className="stacked-editor">
                <input
                  className="input"
                  value={section.title}
                  onChange={(event) =>
                    updateNote(selectedNote.id, (entry) => ({
                      ...entry,
                      sections: entry.sections.map((current) =>
                        current.id === section.id
                          ? { ...current, title: event.target.value }
                          : current
                      ),
                    }))
                  }
                />
                <textarea
                  className="textarea"
                  rows={3}
                  value={section.body}
                  onChange={(event) =>
                    updateNote(selectedNote.id, (entry) => ({
                      ...entry,
                      sections: entry.sections.map((current) =>
                        current.id === section.id
                          ? { ...current, body: event.target.value }
                          : current
                      ),
                    }))
                  }
                />
                <label className="checkbox-field">
                  <span>Collapsed</span>
                  <input
                    type="checkbox"
                    checked={section.collapsed}
                    onChange={(event) =>
                      updateNote(selectedNote.id, (entry) => ({
                        ...entry,
                        sections: entry.sections.map((current) =>
                          current.id === section.id
                            ? { ...current, collapsed: event.target.checked }
                            : current
                        ),
                      }))
                    }
                  />
                </label>
              </div>
            ))}
            <div
              className="note-preview"
              dangerouslySetInnerHTML={{
                __html:
                  selectedNote.format === 'markdown-lite'
                    ? renderMarkdownLite(selectedNote.body)
                    : renderPlainText(selectedNote.body),
              }}
            />
            <button
              type="button"
              className="button button--ghost button--danger"
              onClick={() => deleteNote(selectedNote.id)}
            >
              Delete Note
            </button>
          </SectionCard>
        ) : (
          <EmptyState
            title="No note selected"
            description="Create or select a note to edit and preview it."
          />
        )}
      </div>
    </div>
  );
};
