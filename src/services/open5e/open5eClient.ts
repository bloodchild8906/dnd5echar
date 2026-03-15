import { ReferenceCreature, ReferenceOption, ReferenceResource, Spell } from '../../domain/models';
import {
  normalizeOpen5eCreature,
  normalizeOpen5eSpell,
  normalizeReferenceOption,
} from './normalizers';

export interface Open5eListResult<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type Open5eParams = Record<string, string | number | boolean | undefined>;

const OPEN5E_BASE_URL = 'https://api.open5e.com';

const resourceConfig: Record<
  ReferenceResource,
  { path: string; normalize: (value: unknown) => unknown }
> = {
  classes: {
    path: '/v1/classes/',
    normalize: (value) => normalizeReferenceOption('classes', value),
  },
  races: { path: '/v1/races/', normalize: (value) => normalizeReferenceOption('races', value) },
  backgrounds: {
    path: '/v2/backgrounds/',
    normalize: (value) => normalizeReferenceOption('backgrounds', value),
  },
  feats: { path: '/v2/feats/', normalize: (value) => normalizeReferenceOption('feats', value) },
  spells: { path: '/v2/spells/', normalize: normalizeOpen5eSpell },
  monsters: { path: '/v1/monsters/', normalize: normalizeOpen5eCreature },
  weapons: {
    path: '/v2/weapons/',
    normalize: (value) => normalizeReferenceOption('weapons', value),
  },
  armor: { path: '/v2/armor/', normalize: (value) => normalizeReferenceOption('armor', value) },
  magicitems: {
    path: '/v1/magicitems/',
    normalize: (value) => normalizeReferenceOption('magicitems', value),
  },
};

const withParams = (path: string, params: Open5eParams = {}) => {
  const url = new URL(path, OPEN5E_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const extractResults = (
  payload: unknown
): { count: number; next: string | null; previous: string | null; results: unknown[] } => {
  if (!payload || typeof payload !== 'object') {
    return { count: 0, next: null, previous: null, results: [] };
  }

  const record = payload as Record<string, unknown>;
  const results = Array.isArray(record.results)
    ? record.results
    : Array.isArray(record.data)
      ? record.data
      : [];

  return {
    count: typeof record.count === 'number' ? record.count : results.length,
    next: typeof record.next === 'string' ? record.next : null,
    previous: typeof record.previous === 'string' ? record.previous : null,
    results,
  };
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Open5e request failed with ${response.status}`);
  }

  return (await response.json()) as T;
};

export const open5eClient = {
  async fetchList<T extends Spell | ReferenceCreature | ReferenceOption>(
    resource: ReferenceResource,
    params: Open5eParams = {}
  ): Promise<Open5eListResult<T>> {
    const config = resourceConfig[resource];
    const payload = await fetchJson<unknown>(withParams(config.path, params));
    const extracted = extractResults(payload);

    return {
      count: extracted.count,
      next: extracted.next,
      previous: extracted.previous,
      results: extracted.results.map((entry) => config.normalize(entry) as T),
    };
  },

  async fetchDetail<T extends Spell | ReferenceCreature | ReferenceOption>(
    resource: ReferenceResource,
    slug: string
  ): Promise<T> {
    const config = resourceConfig[resource];
    const payload = await fetchJson<unknown>(withParams(`${config.path}${slug}/`));
    return config.normalize(payload) as T;
  },

  async searchResources<T extends Spell | ReferenceCreature | ReferenceOption>(
    resource: ReferenceResource,
    search: string,
    params: Open5eParams = {}
  ): Promise<Open5eListResult<T>> {
    return this.fetchList<T>(resource, {
      ...params,
      search,
    });
  },

  async fetchAllPages<T extends Spell | ReferenceCreature | ReferenceOption>(
    resource: ReferenceResource,
    params: Open5eParams = {}
  ): Promise<T[]> {
    let nextUrl: string | null = withParams(resourceConfig[resource].path, params);
    const items: T[] = [];

    while (nextUrl) {
      const payload = await fetchJson<unknown>(nextUrl);
      const extracted = extractResults(payload);
      items.push(
        ...extracted.results.map((entry) => resourceConfig[resource].normalize(entry) as T)
      );
      nextUrl = extracted.next;
    }

    return items;
  },
};
