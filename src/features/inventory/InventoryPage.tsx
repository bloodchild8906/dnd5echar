import { useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionCard } from '../../components/common/SectionCard';
import { TagInput } from '../../components/common/TagInput';
import { CharacterTabs } from '../../components/layout/CharacterTabs';
import { getAttunedItemCount, getCarryCapacity, getEncumbranceStatus, getTotalCarriedWeight } from '../../domain/derived';
import { useCurrentCharacter } from '../../hooks/useCurrentCharacter';
import { useOpen5eResource } from '../../hooks/useOpen5eResource';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrencyValue } from '../../utils/format';
import { parseNumber } from '../../utils/numbers';
import { referenceToInventoryItem } from '../../services/open5e/normalizers';
import { getMergedHomebrewData } from '../../domain/derived';

const referenceKinds = ['weapons', 'armor', 'magicitems'] as const;

export const InventoryPage = () => {
  const { character } = useCurrentCharacter();
  const addCharacterItem = useAppStore((state) => state.addCharacterItem);
  const updateCharacterItem = useAppStore((state) => state.updateCharacterItem);
  const removeCharacterItem = useAppStore((state) => state.removeCharacterItem);
  const moveCharacterItem = useAppStore((state) => state.moveCharacterItem);
  const addCharacterContainer = useAppStore((state) => state.addCharacterContainer);
  const updateCharacterCurrency = useAppStore((state) => state.updateCharacterCurrency);
  const settings = useAppStore((state) => state.settings);
  const homebrewItems = useAppStore((state) => state.homebrew.filter((entry) => entry.entityType === 'item'));
  const [search, setSearch] = useState('');
  const [referenceSearch, setReferenceSearch] = useState('');
  const [resource, setResource] = useState<(typeof referenceKinds)[number]>('weapons');

  const references = useOpen5eResource(resource, {
    document__slug: settings.referenceDocumentFilter,
    search: referenceSearch,
    limit: 18,
  });

  if (!character) {
    return <EmptyState title="Character not found" description="Select a character to manage inventory." />;
  }

  const filteredItems = character.inventory.items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>{character.name}</h1>
          <p>Track carried weight, attunement, nested containers, charges, and quick-use items.</p>
        </div>
      </section>

      <CharacterTabs characterId={character.id} />

      <SectionCard title="Inventory Summary" actions={<Badge tone={getEncumbranceStatus(character) === 'encumbered' ? 'warning' : 'success'}>{settings.encumbranceMode === 'off' ? 'Encumbrance Off' : getEncumbranceStatus(character)}</Badge>}>
        <div className="stats-row stats-row--dense">
          <div className="sheet-chip">Carry Weight: {getTotalCarriedWeight(character.inventory.items).toFixed(1)} lb</div>
          <div className="sheet-chip">Capacity: {getCarryCapacity(character)} lb</div>
          <div className="sheet-chip">Attuned Items: {getAttunedItemCount(character.inventory.items)}</div>
        </div>
        <div className="form-grid form-grid--five compact-grid">
          {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map((coin) => (
            <label key={coin}>
              {coin.toUpperCase()}
              <input className="input" type="number" value={character.currency[coin]} onChange={(event) => updateCharacterCurrency(character.id, (wallet) => ({ ...wallet, [coin]: parseNumber(event.target.value) }))} />
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Backpack and Equipment" actions={<div className="button-row"><button type="button" className="button" onClick={() => addCharacterItem(character.id)}>Add Item</button><button type="button" className="button button--ghost" onClick={() => addCharacterContainer(character.id)}>Add Container</button></div>}>
        <div className="toolbar">
          <SearchBar value={search} placeholder="Filter items" onChange={setSearch} />
        </div>
        <div className="stack-list">
          {filteredItems.map((item) => (
            <article key={item.id} className="item-card">
              <div className="item-card__head">
                <input className="input" value={item.name} onChange={(event) => updateCharacterItem(character.id, item.id, (current) => ({ ...current, name: event.target.value }))} />
                <div className="inline-badges">
                  {item.attuned ? <Badge tone="accent">Attuned</Badge> : null}
                  {item.equipped ? <Badge tone="success">Equipped</Badge> : null}
                  {item.consumable ? <Badge tone="warning">Consumable</Badge> : null}
                </div>
              </div>
              <div className="form-grid form-grid--four">
                <label>
                  Quantity
                  <input className="input" type="number" min={0} value={item.quantity} onChange={(event) => updateCharacterItem(character.id, item.id, (current) => ({ ...current, quantity: parseNumber(event.target.value, 1) }))} />
                </label>
                <label>
                  Weight
                  <input className="input" type="number" min={0} value={item.weight} onChange={(event) => updateCharacterItem(character.id, item.id, (current) => ({ ...current, weight: parseNumber(event.target.value) }))} />
                </label>
                <label>
                  Value
                  <input className="input" value={formatCurrencyValue(item.value)} onChange={(event) => {
                    const [amount, denomination] = event.target.value.split(' ');
                    updateCharacterItem(character.id, item.id, (current) => ({ ...current, value: { amount: parseNumber(amount), denomination: (denomination || 'gp') as typeof current.value.denomination } }));
                  }} />
                </label>
                <label>
                  Container
                  <select className="input" value={item.containerId ?? ''} onChange={(event) => moveCharacterItem(character.id, item.id, event.target.value || null)}>
                    <option value="">On person</option>
                    {character.inventory.containers.map((container) => <option key={container.id} value={container.id}>{container.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="form-grid form-grid--four">
                <label className="checkbox-field"><span>Equipped</span><input type="checkbox" checked={item.equipped} onChange={(event) => updateCharacterItem(character.id, item.id, (current) => ({ ...current, equipped: event.target.checked }))} /></label>
                <label className="checkbox-field"><span>Attunement Required</span><input type="checkbox" checked={item.attunementRequired} onChange={(event) => updateCharacterItem(character.id, item.id, (current) => ({ ...current, attunementRequired: event.target.checked }))} /></label>
                <label className="checkbox-field"><span>Attuned</span><input type="checkbox" checked={item.attuned} onChange={(event) => updateCharacterItem(character.id, item.id, (current) => ({ ...current, attuned: event.target.checked }))} /></label>
                <label className="checkbox-field"><span>Consumable</span><input type="checkbox" checked={item.consumable} onChange={(event) => updateCharacterItem(character.id, item.id, (current) => ({ ...current, consumable: event.target.checked }))} /></label>
              </div>
              <TagInput values={item.tags} onChange={(values) => updateCharacterItem(character.id, item.id, (current) => ({ ...current, tags: values }))} />
              <textarea className="textarea" rows={2} value={item.notes} placeholder="Item notes" onChange={(event) => updateCharacterItem(character.id, item.id, (current) => ({ ...current, notes: event.target.value }))} />
              <button type="button" className="button button--ghost button--danger" onClick={() => removeCharacterItem(character.id, item.id)}>Remove</button>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Reference and Homebrew Items" subtitle="Clone canonical data into local inventory without mutating source records.">
        <div className="toolbar">
          <select className="input" value={resource} onChange={(event) => setResource(event.target.value as (typeof referenceKinds)[number])}>
            {referenceKinds.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </select>
          <SearchBar value={referenceSearch} placeholder="Search Open5e items" onChange={setReferenceSearch} />
        </div>
        {references.error ? <p className="callout">{references.error}</p> : null}
        <div className="stack-list">
          {references.items.map((entry) => (
            <article key={entry.id} className="spell-card spell-card--compact">
              <div>
                <h3>{entry.name}</h3>
                <p>{entry.summary}</p>
              </div>
              <button type="button" className="button" onClick={() => addCharacterItem(character.id, referenceToInventoryItem(resource, entry.raw))}>Add Item</button>
            </article>
          ))}
          {homebrewItems.map((entry) => {
            const merged = getMergedHomebrewData<Record<string, unknown>>(entry);
            return (
              <article key={entry.id} className="spell-card spell-card--compact">
                <div>
                  <h3>{String(merged.name ?? entry.name)}</h3>
                  <p>{entry.summary}</p>
                </div>
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    addCharacterItem(character.id, {
                      id: entry.id,
                      name: String(merged.name ?? entry.name),
                      description: String(merged.description ?? entry.summary),
                      quantity: 1,
                      weight: Number(merged.weight ?? 0),
                      value: { amount: Number(merged.value ?? 0), denomination: 'gp' },
                      rarity: String(merged.rarity ?? 'Homebrew'),
                      attunementRequired: Boolean(merged.attunementRequired ?? false),
                      attuned: false,
                      equipped: false,
                      consumable: Boolean(merged.consumable ?? false),
                      tags: entry.tags,
                      notes: entry.notes,
                      containerId: null,
                      sourceRef: entry.sourceRef,
                    })
                  }
                >
                  Add Homebrew Item
                </button>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
};
