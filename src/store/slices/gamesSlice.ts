import { StateCreator } from 'zustand';
import { GameMembership, GamePermissionSet, GameRecord, GameRole } from '../../domain/collaboration';
import { AppStore, GamesSlice } from '../types';

const canManageMemberships = (role: GameRole): boolean =>
  role === 'gm' || role === 'assistant_gm';

export const createGamesSlice: StateCreator<AppStore, [], [], GamesSlice> = (set) => ({
  games: [],
  activeMemberships: [],

  setGames: (games) => set({ games }),

  addGame: (game) =>
    set((state) => ({
      games: [game, ...state.games.filter((g) => g.id !== game.id)],
    })),

  removeGame: (gameId) =>
    set((state) => ({
      games: state.games.filter((g) => g.id !== gameId),
      activeMemberships: state.activeMemberships.filter((m) => m.gameId !== gameId),
    })),

  setActiveMemberships: (memberships: GameMembership[]) => set({ activeMemberships: memberships }),

  updateMembershipLocal: (
    callerRole: GameRole,
    membershipId: string,
    role: GameRole,
    permissions: GamePermissionSet
  ) => {
    if (!canManageMemberships(callerRole)) {
      console.warn('updateMembershipLocal: caller does not have GM or Co-GM role');
      return;
    }
    set((state) => ({
      activeMemberships: state.activeMemberships.map((m) =>
        m.id === membershipId ? { ...m, role, permissions } : m
      ),
    }));
  },
});
