import { createSeedPersistedAppData } from '../../domain/seeds';
import { storageService } from './storageService';

describe('storageService.mergeBundles', () => {
  it('merges by id without dropping existing data', () => {
    const base = createSeedPersistedAppData();
    const incoming = createSeedPersistedAppData();
    incoming.characters[0].id = 'character-imported';
    incoming.characters[0].name = 'Imported Hero';

    const merged = storageService.mergeBundles(base, incoming);

    expect(merged.characters).toHaveLength(2);
    expect(merged.characters.some((entry) => entry.name === 'Imported Hero')).toBe(true);
    expect(merged.characters.some((entry) => entry.id === 'character-seed-moon-druid')).toBe(true);
  });
});
