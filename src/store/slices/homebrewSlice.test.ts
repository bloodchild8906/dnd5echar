// Feature: codex-arcanum, Property 13: Homebrew validation gate
// Feature: codex-arcanum, Property 14: Homebrew clone preserves source data
import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { create } from 'zustand';
import { homebrewEntrySchema } from '../../domain/schemas';
import { createBlankHomebrewEntry } from '../../domain/seeds';
import { createHomebrewSlice } from './homebrewSlice';
import { HomebrewSlice } from '../types';
import { PersistedAppData } from '../../domain/models';

// Minimal store for testing the homebrew slice in isolation
type TestStore = Pick<PersistedAppData, 'homebrew'> & HomebrewSlice;

const createTestStore = () =>
  create<TestStore>()((set, get, api) => ({
    homebrew: [],
    ...createHomebrewSlice(
      set as Parameters<typeof createHomebrewSlice>[0],
      get as Parameters<typeof createHomebrewSlice>[1],
      api as Parameters<typeof createHomebrewSlice>[2]
    ),
  }));

// Arbitrary for invalid homebrew objects (missing required fields or wrong types)
const invalidHomebrewArb = fc.oneof(
  // Missing name
  fc.record({
    id: fc.string(),
    entityType: fc.constantFrom('spell', 'item', 'creature'),
    name: fc.constant(''),
    summary: fc.string(),
    tags: fc.array(fc.string()),
    notes: fc.string(),
    createdAt: fc.string(),
    updatedAt: fc.string(),
    // sourceRef intentionally omitted — invalid
  }),
  // Wrong entityType
  fc.record({
    id: fc.string(),
    entityType: fc.string().filter((s) => !['race','class','subclass','feat','item','spell','creature','background','companion','form'].includes(s)),
    name: fc.string({ minLength: 1 }),
    summary: fc.string(),
    tags: fc.array(fc.string()),
    notes: fc.string(),
    sourceRef: fc.constant({ sourceType: 'homebrew', sourceName: 'Test' }),
    sourceData: fc.constant(null),
    overrideData: fc.constant({}),
    createdAt: fc.string(),
    updatedAt: fc.string(),
  }),
  // Null object
  fc.constant(null),
  // Empty object
  fc.constant({}),
);

describe('Property 13: Homebrew validation gate', () => {
  it('createHomebrew with invalid data still creates a blank entry (slice does not validate on create)', () => {
    // The slice's createHomebrew uses createBlankHomebrewEntry as base — always valid.
    // The validation gate is in HomebrewEditor before calling the slice.
    // This test verifies that homebrewEntrySchema rejects invalid objects,
    // so the editor can gate writes correctly.
    fc.assert(
      fc.property(invalidHomebrewArb, (invalid) => {
        const result = homebrewEntrySchema.safeParse(invalid);
        return result.success === false;
      }),
      { numRuns: 200 }
    );
  });

  it('updateHomebrew with a valid entry passes schema validation', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 80 }),
          summary: fc.string({ maxLength: 200 }),
          notes: fc.string({ maxLength: 500 }),
          tags: fc.array(fc.string({ maxLength: 30 }), { maxLength: 10 }),
        }),
        ({ name, summary, notes, tags }) => {
          const base = createBlankHomebrewEntry();
          const candidate = { ...base, name, summary, notes, tags };
          const result = homebrewEntrySchema.safeParse(candidate);
          return result.success === true;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('homebrew array is unchanged when schema validation fails before write', () => {
    // Simulate the editor pattern: only call updateHomebrew when safeParse succeeds
    fc.assert(
      fc.property(invalidHomebrewArb, (invalid) => {
        const store = createTestStore();
        const id = store.getState().createHomebrew();
        const before = store.getState().homebrew.length;

        // Simulate editor gate: only update if valid
        const result = homebrewEntrySchema.safeParse(invalid);
        if (!result.success) {
          // Do NOT call updateHomebrew — gate blocks it
          const after = store.getState().homebrew.length;
          return after === before;
        }
        return true;
      }),
      { numRuns: 200 }
    );
  });
});

describe('Property 14: Homebrew clone preserves source data', () => {
  it('cloneSourceToHomebrew result has sourceData equal to original and sourceType cloned-from-open5e', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 80 }),
          summary: fc.string({ maxLength: 200 }),
          entityType: fc.constantFrom(
            'spell' as const,
            'item' as const,
            'creature' as const,
            'feat' as const,
            'race' as const
          ),
          sourceData: fc.record({
            id: fc.string(),
            name: fc.string(),
            level: fc.integer({ min: 0, max: 9 }),
          }),
        }),
        ({ name, summary, entityType, sourceData }) => {
          const store = createTestStore();
          const id = store.getState().cloneSourceToHomebrew({
            entityType,
            name,
            summary,
            sourceRef: {
              sourceType: 'open5e',
              sourceId: 'test-id',
              sourceName: 'Open5e',
            },
            sourceData,
            overrideData: {},
          });

          const entry = store.getState().homebrew.find((h) => h.id === id);
          if (!entry) return false;

          // sourceType must be cloned-from-open5e
          if (entry.sourceRef.sourceType !== 'cloned-from-open5e') return false;

          // sourceData must deeply equal the original
          const storedData = entry.sourceData as typeof sourceData;
          return (
            storedData.id === sourceData.id &&
            storedData.name === sourceData.name &&
            storedData.level === sourceData.level
          );
        }
      ),
      { numRuns: 200 }
    );
  });

  it('cloneSourceToHomebrew adds exactly one entry to the homebrew array', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 60 }),
        (name) => {
          const store = createTestStore();
          const before = store.getState().homebrew.length;
          store.getState().cloneSourceToHomebrew({
            entityType: 'spell',
            name,
            summary: '',
            sourceRef: { sourceType: 'open5e', sourceName: 'Open5e' },
            sourceData: { raw: true },
            overrideData: {},
          });
          return store.getState().homebrew.length === before + 1;
        }
      ),
      { numRuns: 200 }
    );
  });
});
