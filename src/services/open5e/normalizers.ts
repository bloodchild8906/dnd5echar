import {
  ActionEntry,
  ActorStatBlock,
  Companion,
  InventoryContainer,
  InventoryItem,
  ReferenceCreature,
  ReferenceOption,
  ReferenceResource,
  SourceReference,
  Spell,
  WildShapeForm,
} from '../../domain/models';
import { createBlankCompanion, createBlankWildShapeForm } from '../../domain/seeds';
import { createId } from '../../utils/id';
import { isoNow, parseNumber } from '../../utils/numbers';

const asRecord = (value: unknown): Record<string, unknown> => (typeof value === 'object' && value ? (value as Record<string, unknown>) : {});

const readString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const readNumber = (value: unknown, fallback = 0): number => parseNumber(typeof value === 'number' || typeof value === 'string' ? value : fallback, fallback);
const readBoolean = (value: unknown, fallback = false): boolean => (typeof value === 'boolean' ? value : fallback);
const splitList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => readString(entry)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

const buildSourceReference = (raw: Record<string, unknown>, resource: ReferenceResource): SourceReference => ({
  sourceType: 'open5e',
  sourceId: readString(raw.slug) || readString(raw.key) || readString(raw.name).toLowerCase().replaceAll(' ', '-'),
  sourceName: 'Open5e',
  originCollection: resource,
  documentSlug: readString(raw.document__slug) || readString(raw.document_slug) || '5esrd',
  sourceUrl: readString(raw.url),
  canonicalUrl: readString(raw.url),
  fetchedAt: isoNow(),
});

const normalizeActionList = (value: unknown, fallbackName = 'Action'): ActionEntry[] => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => {
      const raw = asRecord(entry);
      return {
        id: createId('action'),
        name: readString(raw.name, `${fallbackName} ${index + 1}`),
        description: readString(raw.desc) || readString(raw.description) || JSON.stringify(entry),
        attackBonus: raw.attack_bonus ? readNumber(raw.attack_bonus) : undefined,
        damage: readString(raw.damage_dice) || readString(raw.damage),
      };
    });
  }

  if (typeof value === 'string' && value.trim()) {
    return [{ id: createId('action'), name: fallbackName, description: value.trim() }];
  }

  return [];
};

const parseSpeed = (value: unknown): ActorStatBlock['speed'] => {
  if (typeof value === 'object' && value) {
    const raw = value as Record<string, unknown>;
    return {
      walk: readNumber(raw.walk, 30),
      fly: raw.fly ? readNumber(raw.fly) : undefined,
      swim: raw.swim ? readNumber(raw.swim) : undefined,
      climb: raw.climb ? readNumber(raw.climb) : undefined,
      burrow: raw.burrow ? readNumber(raw.burrow) : undefined,
    };
  }

  if (typeof value === 'string') {
    const walk = Number(value.match(/(\d+)/)?.[1] ?? 30);
    const speed: ActorStatBlock['speed'] = { walk };
    if (/fly/i.test(value)) speed.fly = walk;
    if (/swim/i.test(value)) speed.swim = walk;
    if (/climb/i.test(value)) speed.climb = walk;
    if (/burrow/i.test(value)) speed.burrow = walk;
    return speed;
  }

  return { walk: 30 };
};

const normalizeStats = (raw: Record<string, unknown>): ActorStatBlock => ({
  abilities: {
    strength: { score: readNumber(raw.str, 10), bonus: 0, temp: 0 },
    dexterity: { score: readNumber(raw.dex, 10), bonus: 0, temp: 0 },
    constitution: { score: readNumber(raw.con, 10), bonus: 0, temp: 0 },
    intelligence: { score: readNumber(raw.int, 10), bonus: 0, temp: 0 },
    wisdom: { score: readNumber(raw.wis, 10), bonus: 0, temp: 0 },
    charisma: { score: readNumber(raw.cha, 10), bonus: 0, temp: 0 },
  },
  skills: {},
  savingThrows: {},
  ac: readNumber(raw.armor_class, 10),
  hp: {
    max: readNumber(raw.hit_points, 1),
    current: readNumber(raw.hit_points, 1),
    temp: 0,
  },
  speed: parseSpeed(raw.speed),
  senses: splitList(raw.senses),
  languages: splitList(raw.languages),
  actions: normalizeActionList(raw.actions),
  traits: normalizeActionList(raw.special_abilities, 'Trait').map((entry) => ({ id: entry.id, name: entry.name, description: entry.description })),
  initiative: 0,
  hitDice: readString(raw.hit_dice, ''),
  notes: '',
});

export const normalizeOpen5eSpell = (value: unknown): Spell => {
  const raw = asRecord(value);
  return {
    id: readString(raw.slug) || readString(raw.key) || createId('spell'),
    name: readString(raw.name, 'Unknown Spell'),
    level: readNumber(raw.level_int ?? raw.level, 0),
    school: readString(raw.school, 'Unknown'),
    description: readString(raw.desc) || readString(raw.desc_text) || readString(raw.description),
    higherLevel: readString(raw.higher_level) || readString(raw.higher_level_text) || undefined,
    castingTime: readString(raw.casting_time, '1 action'),
    range: readString(raw.range, 'Self'),
    duration: readString(raw.duration, 'Instantaneous'),
    classes: splitList(raw.dnd_class ?? raw.classes),
    ritual: readBoolean(raw.ritual, /ritual/i.test(readString(raw.duration))),
    concentration: readBoolean(raw.concentration, /concentration/i.test(readString(raw.duration))),
    components: splitList(raw.components),
    tags: splitList(raw.tags),
    damageRoll: readString(raw.damage_dice) || undefined,
    savingThrowAbility: readString(raw.saving_throw) || undefined,
    attackRoll: readBoolean(raw.attack_roll, false),
    sourceRef: buildSourceReference(raw, 'spells'),
    url: readString(raw.url) || undefined,
  };
};

export const normalizeOpen5eCreature = (value: unknown): ReferenceCreature => {
  const raw = asRecord(value);
  return {
    id: readString(raw.slug) || readString(raw.key) || createId('creature'),
    name: readString(raw.name, 'Unknown Creature'),
    size: readString(raw.size, 'Medium'),
    creatureType: readString(raw.type, 'Creature'),
    alignment: readString(raw.alignment, ''),
    challengeRating: readString(raw.challenge_rating) || String(readNumber(raw.cr, 0)),
    description: readString(raw.desc) || readString(raw.description),
    sourceRef: buildSourceReference(raw, 'monsters'),
    stats: normalizeStats(raw),
  };
};

export const normalizeReferenceOption = (resource: ReferenceResource, value: unknown): ReferenceOption => {
  const raw = asRecord(value);
  return {
    id: readString(raw.slug) || readString(raw.key) || createId(resource),
    name: readString(raw.name, 'Unknown Reference'),
    summary: readString(raw.desc) || readString(raw.desc_text) || readString(raw.description) || readString(raw.subtitle),
    resource,
    tags: splitList(raw.tags),
    sourceRef: buildSourceReference(raw, resource),
    raw,
  };
};

export const creatureToWildShape = (creature: ReferenceCreature): WildShapeForm => ({
  ...createBlankWildShapeForm(creature.name),
  name: creature.name,
  size: creature.size,
  creatureType: creature.creatureType,
  challengeRating: creature.challengeRating,
  stats: creature.stats,
  sourceRef: creature.sourceRef,
});

export const creatureToCompanion = (creature: ReferenceCreature, parentCharacterId: string): Companion => {
  const companion = createBlankCompanion(parentCharacterId);
  companion.name = creature.name;
  companion.type = 'summoned';
  companion.stats = creature.stats;
  companion.initiative = creature.stats.initiative;
  companion.sourceRef = creature.sourceRef;
  return companion;
};

export const referenceToInventoryItem = (resource: ReferenceResource, value: unknown, containerId?: string | null): InventoryItem => {
  const raw = asRecord(value);
  return {
    id: createId('item'),
    name: readString(raw.name, 'Reference Item'),
    description: readString(raw.desc) || readString(raw.description),
    quantity: 1,
    weight: readNumber(raw.weight, 0),
    value: {
      amount: readNumber(raw.cost ?? raw.value, 0),
      denomination: 'gp',
    },
    rarity: readString(raw.rarity, 'Common'),
    attunementRequired: /attunement/i.test(readString(raw.requires_attunement) || readString(raw.attunement)),
    attuned: false,
    equipped: false,
    consumable: /consumable|potion|scroll/i.test(readString(raw.type) + readString(raw.name)),
    tags: [resource],
    notes: '',
    containerId,
    sourceRef: buildSourceReference(raw, resource),
    armorClass: raw.ac ? readNumber(raw.ac) : undefined,
    damage: readString(raw.damage_dice) || undefined,
    properties: splitList(raw.properties),
  };
};

export const referenceToContainer = (name = 'Imported Container'): InventoryContainer => ({
  id: createId('container'),
  name,
  notes: '',
  type: 'custom',
  order: 99,
  parentId: null,
});
