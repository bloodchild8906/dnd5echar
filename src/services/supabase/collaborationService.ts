import { CharacterBundle, CharacterBundleRecord, GameMembership, GamePermissionSet, GameRecord, GameRole } from '../../domain/collaboration';
import { Character, Companion, Note } from '../../domain/models';
import { createId } from '../../utils/id';
import { getSupabaseClient } from './supabaseClient';

const defaultPermissions = (role: GameRole): GamePermissionSet => ({
  canViewCharacters: role !== 'viewer' ? true : true,
  canEditCharacters: role === 'gm' || role === 'assistant_gm',
  canManagePlayers: role === 'gm',
});

const makeJoinCode = (): string => Math.random().toString(36).slice(2, 8).toUpperCase();

export const buildCharacterBundle = (character: Character, companions: Companion[], notes: Note[]): CharacterBundle => ({
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
    canViewCharacters: Boolean((value.permissions as Record<string, unknown> | null)?.canViewCharacters ?? true),
    canEditCharacters: Boolean((value.permissions as Record<string, unknown> | null)?.canEditCharacters ?? false),
    canManagePlayers: Boolean((value.permissions as Record<string, unknown> | null)?.canManagePlayers ?? false),
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

export const collaborationService = {
  defaultPermissions,

  async listGamesForUser(userId: string): Promise<GameRecord[]> {
    const supabase = getSupabaseClient();
    const { data: memberships, error: membershipError } = await supabase.from('game_memberships').select('game_id').eq('user_id', userId);
    if (membershipError) {
      throw membershipError;
    }

    const membershipGameIds = (memberships ?? []).map((entry) => entry.game_id as string);
    const { data: games, error } = await supabase
      .from('games')
      .select('*')
      .or(`gm_user_id.eq.${userId}${membershipGameIds.length ? `,id.in.(${membershipGameIds.join(',')})` : ''}`)
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
    const { data: game, error } = await supabase.from('games').select('id').eq('join_code', joinCode.toUpperCase()).single();
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
    const { data, error } = await supabase.from('game_memberships').select('*').eq('game_id', gameId).order('created_at');
    if (error) {
      throw error;
    }

    return (data ?? []).map((entry) => normalizeMembership(entry as Record<string, unknown>));
  },

  async updateMembership(membershipId: string, role: GameRole, permissions: GamePermissionSet): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('game_memberships').update({ role, permissions }).eq('id', membershipId);
    if (error) {
      throw error;
    }
  },

  async listCharacterBundles(gameId: string): Promise<CharacterBundleRecord[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('character_bundles').select('*').eq('game_id', gameId).order('updated_at', { ascending: false });
    if (error) {
      throw error;
    }

    return (data ?? []).map((entry) => normalizeBundleRecord(entry as Record<string, unknown>));
  },

  async listOwnedCharacterBundles(userId: string): Promise<CharacterBundleRecord[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('character_bundles').select('*').eq('owner_user_id', userId).order('updated_at', { ascending: false });
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

  async publishCharacterToGame(gameId: string, ownerUserId: string, character: Character, companions: Companion[], notes: Note[]) {
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

  createDraftBundle(ownerUserId: string, character: Character, companions: Companion[], notes: Note[]): CharacterBundleRecord {
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
};
