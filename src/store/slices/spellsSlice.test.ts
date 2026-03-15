import { describe, expect, it } from 'vitest';
import { createBlankCharacter, createBlankSpell, createSpellEntry } from '../../domain/seeds';
import { removeSpellEntryCollections, updateSpellEntryCollections } from './spellsSlice';

describe('spellsSlice helpers', () => {
  it('updates entries across all spellbook collections', () => {
    const spellbook = createBlankCharacter().spellbook;
    const classEntry = createSpellEntry(createBlankSpell('Class Spell'));
    const innateEntry = {
      ...createSpellEntry(createBlankSpell('Innate Spell')),
      sourceKind: 'innate' as const,
    };
    const itemEntry = {
      ...createSpellEntry(createBlankSpell('Item Spell')),
      sourceKind: 'item' as const,
    };

    const updated = updateSpellEntryCollections(
      {
        ...spellbook,
        spells: [classEntry],
        innateSpells: [innateEntry],
        itemGrantedSpells: [itemEntry],
      },
      innateEntry.id,
      (entry) => ({ ...entry, prepared: true, notes: 'Always available' })
    );

    expect(updated.spells[0]).toEqual(classEntry);
    expect(updated.innateSpells[0]).toMatchObject({ prepared: true, notes: 'Always available' });
    expect(updated.itemGrantedSpells[0]).toEqual(itemEntry);
  });

  it('removes entries across all spellbook collections', () => {
    const spellbook = createBlankCharacter().spellbook;
    const classEntry = createSpellEntry(createBlankSpell('Class Spell'));
    const innateEntry = {
      ...createSpellEntry(createBlankSpell('Innate Spell')),
      sourceKind: 'innate' as const,
    };
    const itemEntry = {
      ...createSpellEntry(createBlankSpell('Item Spell')),
      sourceKind: 'item' as const,
    };

    const updated = removeSpellEntryCollections(
      {
        ...spellbook,
        spells: [classEntry],
        innateSpells: [innateEntry],
        itemGrantedSpells: [itemEntry],
      },
      itemEntry.id
    );

    expect(updated.spells).toHaveLength(1);
    expect(updated.innateSpells).toHaveLength(1);
    expect(updated.itemGrantedSpells).toHaveLength(0);
  });
});
