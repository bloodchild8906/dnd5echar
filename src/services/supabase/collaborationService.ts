import { RealtimeChannel } from '@supabase/supabase-js';
import {
  CharacterBundle,
  CharacterBundleRecord,
  GameMembership,
  GamePermissionSet,
  GameRecord,
  GameRole,
  InviteToken,
  SessionLogEntry,
  SessionLogEntryType,
} from '../../domain/collaboration';
import { Character, Companion, Note, Settlement } from '../../domain/models';
import { createId } from '../../utils/id';
import { getSupabaseClient } from './supabaseClient';

// Module-level channel ref — one active subscription at a time
let activeChannel: RealtimeChannel | null = null;

const defaultPermissions = (role: GameRole): GamePermissionSet => ({
  canViewCharacters: role !== 'viewer' ? true : true,
  canEditCharacters: role === 'gm' || role === 'assistant_gm',
  canManagePlayers: role === 'gm',
});

const makeJoinCode = (): string => Math.random().toString(36).slice(2, 8).toUpperCase();

export const buildCharacterBundle = (
  character: Character,
  companions: Companion[],
  notes: Note[]
): CharacterBundle => ({
  character,
  companions: companions.filter((entry) => entry.parentCharacterId === character.id),
  notes: notes.filter((entry) => entry.relatedCharacterId === character.id),
});

const normalizeMembership = (value: Record<string, unknown>): GameMembership => ({
  id: String(value.id),
  gameId: String(value.game_id),
  userId: String(value.user_id),
  role: value.role as GameRole,
  permissions: {
    canViewCharacters: Boolean(
      (value.permissions as Record<string, unknown> | null)?.canViewCharacters ?? true
    ),
    canEditCharacters: Boolean(
      (value.permissions as Record<string, unknown> | null)?.canEditCharacters ?? false
    ),
    canManagePlayers: Boolean(
      (value.permissions as Record<string, unknown> | null)?.canManagePlayers ?? false
    ),
  },
  createdAt: String(value.created_at),
  updatedAt: String(value.updated_at),
});

const normalizeGame = (value: Record<string, unknown>): GameRecord => ({
  id: String(value.id),
  gmUserId: String(value.gm_user_id),
  name: String(value.name),
  joinCode: String(value.join_code),
  createdAt: String(value.created_at),
  updatedAt: String(value.updated_at),
});

const normalizeBundleRecord = (value: Record<string, unknown>): CharacterBundleRecord => ({
  id: String(value.id),
  name: String(value.name),
  ownerUserId: String(value.owner_user_id),
  gameId: value.game_id ? String(value.game_id) : null,
  bundle: value.bundle as CharacterBundle,
  createdAt: String(value.created_at),
  updatedAt: String(value.updated_at),
});

const normalizeInviteToken = (value: Record<string, unknown>): InviteToken => ({
  id: String(value.id),
  gameId: String(value.game_id),
  token: String(value.token),
  createdByUserId: String(value.created_by_user_id),
  expiresAt: String(value.expires_at),
  usedAt: value.used_at ? String(value.used_at) : null,
  usedByUserId: value.used_by_user_id ? String(value.used_by_user_id) : null,
  createdAt: String(value.created_at),
});

const normalizeSessionLogEntry = (value: Record<string, unknown>): SessionLogEntry => ({
  id: String(value.id),
  gameId: String(value.game_id),
  authorUserId: String(value.author_user_id),
  entryType: value.entry_type as SessionLogEntryType,
  body: String(value.body),
  isGmOnly: Boolean(value.is_gm_only),
  createdAt: String(value.created_at),
  updatedAt: String(value.updated_at),
});

/** Strip GM-only inventory fields from a bundle before delivering to non-GM players. */
const stripGmOnlyFields = (bundle: CharacterBundle): CharacterBundle => ({
  ...bundle,
  character: {
    ...bundle.character,
    inventory: {
      ...bundle.character.inventory,
      items: bundle.character.inventory.items.map((item) => {
        const ext = item as unknown as Record<string, unknown>;
        return {
          ...item,
          gmVisibleOnly: undefined,
          // Only strip cursed if item is unidentified (Phase 3 fields, may not exist yet)
          cursed: ext['identified'] === false ? undefined : (ext['cursed'] as boolean | undefined),
        };
      }),
    },
  },
});

export const collaborationService = {
  defaultPermissions,

  async listGamesForUser(userId: string): Promise<GameRecord[]> {
    const supabase = getSupabaseClient();
    const { data: memberships, error: membershipError } = await supabase
      .from('game_memberships')
      .select('game_id')
      .eq('user_id', userId);
    if (membershipError) {
      throw membershipError;
    }

    const membershipGameIds = (memberships ?? []).map((entry) => entry.game_id as string);
    const { data: games, error } = await supabase
      .from('games')
      .select('*')
      .or(
        `gm_user_id.eq.${userId}${membershipGameIds.length ? `,id.in.(${membershipGameIds.join(',')})` : ''}`
      )
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (games ?? []).map((entry) => normalizeGame(entry as Record<string, unknown>));
  },

  async createGame(userId: string, name: string): Promise<GameRecord> {
    const supabase = getSupabaseClient();
    const { data: game, error } = await supabase
      .from('games')
      .insert({
        gm_user_id: userId,
        name,
        join_code: makeJoinCode(),
      })
      .select('*')
      .single();

    if (error || !game) {
      throw error ?? new Error('Unable to create game.');
    }

    const permissions = defaultPermissions('gm');
    await supabase.from('game_memberships').upsert({
      game_id: game.id,
      user_id: userId,
      role: 'gm',
      permissions,
    });

    return normalizeGame(game as Record<string, unknown>);
  },

  async joinGameByCode(userId: string, joinCode: string): Promise<GameMembership> {
    const supabase = getSupabaseClient();
    const { data: game, error } = await supabase
      .from('games')
      .select('id')
      .eq('join_code', joinCode.toUpperCase())
      .single();
    if (error || !game) {
      throw error ?? new Error('Game not found.');
    }

    const permissions = defaultPermissions('player');
    const { data: membership, error: membershipError } = await supabase
      .from('game_memberships')
      .upsert({
        game_id: game.id,
        user_id: userId,
        role: 'player',
        permissions,
      })
      .select('*')
      .single();

    if (membershipError || !membership) {
      throw membershipError ?? new Error('Unable to join game.');
    }

    return normalizeMembership(membership as Record<string, unknown>);
  },

  async listMemberships(gameId: string): Promise<GameMembership[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('game_memberships')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at');
    if (error) {
      throw error;
    }

    return (data ?? []).map((entry) => normalizeMembership(entry as Record<string, unknown>));
  },

  async updateMembership(
    membershipId: string,
    role: GameRole,
    permissions: GamePermissionSet
  ): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('game_memberships')
      .update({ role, permissions })
      .eq('id', membershipId);
    if (error) {
      throw error;
    }
  },

  async listCharacterBundles(gameId: string): Promise<CharacterBundleRecord[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('character_bundles')
      .select('*')
      .eq('game_id', gameId)
      .order('updated_at', { ascending: false });
    if (error) {
      throw error;
    }

    return (data ?? []).map((entry) => normalizeBundleRecord(entry as Record<string, unknown>));
  },

  async listOwnedCharacterBundles(userId: string): Promise<CharacterBundleRecord[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('character_bundles')
      .select('*')
      .eq('owner_user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) {
      throw error;
    }

    return (data ?? []).map((entry) => normalizeBundleRecord(entry as Record<string, unknown>));
  },

  async saveCharacterBundle(record: CharacterBundleRecord): Promise<CharacterBundleRecord> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('character_bundles')
      .upsert({
        id: record.id,
        name: record.name,
        owner_user_id: record.ownerUserId,
        game_id: record.gameId ?? null,
        bundle: record.bundle,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw error ?? new Error('Unable to save character bundle.');
    }

    return normalizeBundleRecord(data as Record<string, unknown>);
  },

  async publishCharacterToGame(
    gameId: string,
    ownerUserId: string,
    character: Character,
    companions: Companion[],
    notes: Note[]
  ) {
    return this.saveCharacterBundle({
      id: character.id,
      name: character.name,
      ownerUserId,
      gameId,
      bundle: buildCharacterBundle(character, companions, notes),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  createDraftBundle(
    ownerUserId: string,
    character: Character,
    companions: Companion[],
    notes: Note[]
  ): CharacterBundleRecord {
    return {
      id: character.id || createId('character-bundle'),
      name: character.name,
      ownerUserId,
      gameId: null,
      bundle: buildCharacterBundle(character, companions, notes),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async generateInviteToken(gameId: string, userId: string): Promise<InviteToken> {
    const supabase = getSupabaseClient();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('invite_tokens')
      .insert({
        game_id: gameId,
        created_by_user_id: userId,
        expires_at: expiresAt,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw error ?? new Error('Unable to generate invite token.');
    }

    return normalizeInviteToken(data as Record<string, unknown>);
  },

  async consumeInviteToken(token: string, userId: string): Promise<GameMembership> {
    const supabase = getSupabaseClient();
    const { data: tokenRow, error: tokenError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenRow) {
      throw new Error('Invite token is invalid or has expired.');
    }

    const row = tokenRow as Record<string, unknown>;
    const isExpired = new Date(String(row.expires_at)) <= new Date();
    const isUsed = row.used_at !== null && row.used_at !== undefined;

    if (isExpired || isUsed) {
      throw new Error('Invite token is invalid or has expired.');
    }

    const { error: updateError } = await supabase
      .from('invite_tokens')
      .update({ used_at: new Date().toISOString(), used_by_user_id: userId })
      .eq('token', token);

    if (updateError) {
      throw updateError;
    }

    const gameId = String(row.game_id);
    const permissions = defaultPermissions('player');
    const { data: membership, error: membershipError } = await supabase
      .from('game_memberships')
      .upsert({
        game_id: gameId,
        user_id: userId,
        role: 'player',
        permissions,
      })
      .select('*')
      .single();

    if (membershipError || !membership) {
      throw membershipError ?? new Error('Unable to join game.');
    }

    return normalizeMembership(membership as Record<string, unknown>);
  },

  /**
   * Subscribe to character_bundles changes for a game via Supabase Realtime.
   * Strips GM-only fields before delivering bundles to the callback.
   * Call `unsubscribeFromCharacterBundles()` to clean up.
   */
  subscribeToCharacterBundles(
    gameId: string,
    isGm: boolean,
    callback: (bundle: CharacterBundleRecord) => void
  ): void {
    const supabase = getSupabaseClient();

    // Remove any existing subscription first
    if (activeChannel) {
      void supabase.removeChannel(activeChannel);
      activeChannel = null;
    }

    activeChannel = supabase
      .channel(`character_bundles:game_id=eq.${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_bundles',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const raw = (payload.new ?? payload.old) as Record<string, unknown> | null;
          if (!raw) return;
          const record = normalizeBundleRecord(raw);
          // Strip GM-only fields for non-GM players
          if (!isGm) {
            record.bundle = stripGmOnlyFields(record.bundle);
          }
          callback(record);
        }
      )
      .subscribe();
  },

  unsubscribeFromCharacterBundles(): void {
    if (!activeChannel) return;
    try {
      const supabase = getSupabaseClient();
      void supabase.removeChannel(activeChannel);
    } catch {
      // Client may not be configured; ignore
    }
    activeChannel = null;
  },

  async addSessionLogEntry(
    gameId: string,
    authorUserId: string,
    entryType: SessionLogEntryType,
    body: string,
    isGmOnly = false
  ): Promise<SessionLogEntry> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('session_log_entries')
      .insert({
        game_id: gameId,
        author_user_id: authorUserId,
        entry_type: entryType,
        body,
        is_gm_only: isGmOnly,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw error ?? new Error('Unable to add session log entry.');
    }

    return normalizeSessionLogEntry(data as Record<string, unknown>);
  },

  async listSessionLogEntries(
    gameId: string,
    includeGmOnly = false
  ): Promise<SessionLogEntry[]> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('session_log_entries')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at');

    if (!includeGmOnly) {
      query = query.eq('is_gm_only', false);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((entry) =>
      normalizeSessionLogEntry(entry as Record<string, unknown>)
    );
  },

  subscribeToSessionLog(
    gameId: string,
    includeGmOnly: boolean,
    callback: (entry: SessionLogEntry) => void
  ): RealtimeChannel {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`session_log:game_id=eq.${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_log_entries',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const entry = normalizeSessionLogEntry(raw);
          if (!includeGmOnly && entry.isGmOnly) return;
          callback(entry);
        }
      )
      .subscribe();
    return channel;
  },

  unsubscribeChannel(channel: RealtimeChannel): void {
    try {
      const supabase = getSupabaseClient();
      void supabase.removeChannel(channel);
    } catch {
      // ignore
    }
  },

  async publishSettlementToSupabase(settlement: Settlement): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('settlements').upsert({
      id: settlement.id,
      name: settlement.name,
      description: settlement.description,
      sections: settlement.sections,
      map_pins: settlement.mapPins,
      map_image_url: settlement.mapImageUrl ?? null,
      published: settlement.published,
      game_id: settlement.gameId ?? null,
      owner_id: settlement.ownerId ?? null,
      created_at: settlement.createdAt,
      updated_at: settlement.updatedAt,
    });
    if (error) {
      throw error;
    }
  },
};
