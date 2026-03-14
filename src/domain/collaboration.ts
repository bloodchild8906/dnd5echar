import { Character, Companion, Note } from './models';

export type GameRole = 'gm' | 'assistant_gm' | 'player' | 'viewer';

export interface GamePermissionSet {
  canViewCharacters: boolean;
  canEditCharacters: boolean;
  canManagePlayers: boolean;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameRecord {
  id: string;
  gmUserId: string;
  name: string;
  joinCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameMembership {
  id: string;
  gameId: string;
  userId: string;
  role: GameRole;
  permissions: GamePermissionSet;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterBundle {
  character: Character;
  companions: Companion[];
  notes: Note[];
}

export interface CharacterBundleRecord {
  id: string;
  name: string;
  ownerUserId: string;
  gameId?: string | null;
  bundle: CharacterBundle;
  createdAt: string;
  updatedAt: string;
}
