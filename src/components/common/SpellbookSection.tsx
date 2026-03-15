import { useState } from 'react';
import { Character, PactMagicState, SpellPreparationState, SpellSlotState } from '../../domain/models';
import { getSpellAttackBonus, getSpellSaveDc } from '../../domain/derived';
import { formatModifier } from '../../utils/format';
import { SearchBar } from './SearchBar';
import { VirtualList } from './VirtualList';

interface SpellbookSectionProps {
  character: Character;
  onUpdateSpellSlot: (level: number, updater: (slot: SpellSlotState) => SpellSlotState) => void;
  onUpdatePactMagic: (updater: (pact: PactMagicState) => PactMagicState) => void;
  onUpdateSpell: (
    spellEntryId: string,
    updater: (entry: SpellPreparationState) => SpellPreparationState
  ) => void;
  onAddSpell: () => void;
  onRemoveSpell: (spellEntryId: string) => void;
}

const SpellRow = ({
  entry,
  onTogglePrepared,
  onRemove,
}: {
  entry: SpellPreparationState;
  onTogglePrepared: () => void;
  onRemove: () => void;
}) => (
  <div className="stacked-editor stacked-editor--compact">
    <label>
      <input type="checkbox" checked={entry.prepared} onChange={onTogglePrepared} />
      {' '}
      <strong>{entry.spell.name}</strong>
      {entry.spell.level === 0 ? ' (Cantrip)' : ` (Lv ${entry.spell.level})`}
    </label>
    <button type="button" className="button button--icon" aria-label="Remove spell" onClick={onRemove}>
      ×
    </button>
  </div>
);

const SpellList = ({
  title,
  entries,
  onUpdateSpell,
  onRemoveSpell,
  filter,
}: {
  title: string;
  entries: SpellPreparationState[];
  onUpdateSpell: SpellbookSectionProps['onUpdateSpell'];
  onRemoveSpell: SpellbookSectionProps['onRemoveSpell'];
  filter: string;
}) => {
  const filtered = filter
    ? entries.filter((e) => e.spell.name.toLowerCase().includes(filter.toLowerCase()))
    : entries;

  return (
    <div>
      <h4>{title}</h4>
      <VirtualList
        items={filtered}
        className="stack-list"
        estimateSize={48}
        maxHeight={360}
        getKey={(entry) => entry.id}
        renderItem={(entry) => (
          <SpellRow
            entry={entry}
            onTogglePrepared={() =>
              onUpdateSpell(entry.id, (e) => ({ ...e, prepared: !e.prepared }))
            }
            onRemove={() => onRemoveSpell(entry.id)}
          />
        )}
      />
      {filtered.length === 0 && <p className="empty-hint">No spells.</p>}
    </div>
  );
};

export const SpellbookSection = ({
  character,
  onUpdateSpellSlot,
  onUpdatePactMagic,
  onUpdateSpell,
  onAddSpell,
  onRemoveSpell,
}: SpellbookSectionProps) => {
  const [filter, setFilter] = useState('');
  const { slots, pactMagic, spells, innateSpells, itemGrantedSpells } = character.spellbook;

  return (
    <div className="spellbook-section">
      <div className="stats-row">
        <div className="stat-tile">
          <span>Spell Save DC</span>
          <strong>{getSpellSaveDc(character)}</strong>
        </div>
        <div className="stat-tile">
          <span>Spell Attack</span>
          <strong>{formatModifier(getSpellAttackBonus(character))}</strong>
        </div>
      </div>

      <h4>Spell Slots</h4>
      <div className="stats-row stats-row--dense">
        {slots.map((slot) => (
          <div key={slot.level} className="stat-tile">
            <span>Lv {slot.level}</span>
            <small>{slot.used}/{slot.max}</small>
            <div>
              <button
                type="button"
                className="button button--ghost"
                disabled={slot.used >= slot.max}
                onClick={() => onUpdateSpellSlot(slot.level, (s) => ({ ...s, used: Math.min(s.max, s.used + 1) }))}
              >
                Use
              </button>
              <button
                type="button"
                className="button button--ghost"
                disabled={slot.used <= 0}
                onClick={() => onUpdateSpellSlot(slot.level, (s) => ({ ...s, used: Math.max(0, s.used - 1) }))}
              >
                Recover
              </button>
            </div>
          </div>
        ))}
      </div>

      {pactMagic.enabled && (
        <div className="callout">
          <strong>Pact Magic</strong> — Slot Level {pactMagic.slotLevel} &nbsp;
          {pactMagic.used}/{pactMagic.slots}
          <button
            type="button"
            className="button button--ghost"
            disabled={pactMagic.used >= pactMagic.slots}
            onClick={() => onUpdatePactMagic((p) => ({ ...p, used: Math.min(p.slots, p.used + 1) }))}
          >
            Use
          </button>
          <button
            type="button"
            className="button button--ghost"
            disabled={pactMagic.used <= 0}
            onClick={() => onUpdatePactMagic((p) => ({ ...p, used: Math.max(0, p.used - 1) }))}
          >
            Recover
          </button>
        </div>
      )}

      <div className="section-card__actions">
        <SearchBar value={filter} onChange={setFilter} placeholder="Filter spells…" />
        <button type="button" className="button" onClick={onAddSpell}>
          + Add Spell
        </button>
      </div>

      <SpellList title="Prepared / Known" entries={spells} onUpdateSpell={onUpdateSpell} onRemoveSpell={onRemoveSpell} filter={filter} />
      <SpellList title="Innate Spells" entries={innateSpells} onUpdateSpell={onUpdateSpell} onRemoveSpell={onRemoveSpell} filter={filter} />
      <SpellList title="Item-Granted Spells" entries={itemGrantedSpells} onUpdateSpell={onUpdateSpell} onRemoveSpell={onRemoveSpell} filter={filter} />
    </div>
  );
};
