import { StateCreator } from 'zustand';
import { companionTimerStateSchema } from '../../domain/schemas';
import { createBlankCompanion } from '../../domain/seeds';
import { createId } from '../../utils/id';
import { isoNow } from '../../utils/numbers';
import { removeById, touchCompanion, updateById } from '../helpers';
import { AppStore, CompanionsSlice } from '../types';

const createBlankTimer = () => ({
  id: createId('timer'),
  label: 'New Timer',
  durationRounds: 10,
  elapsedRounds: 0,
  notes: '',
});

export const createCompanionsSlice: StateCreator<AppStore, [], [], CompanionsSlice> = (set) => ({
  createCompanion: (parentCharacterId, initial) => {
    const companion = touchCompanion({
      ...createBlankCompanion(parentCharacterId),
      ...initial,
      updatedAt: isoNow(),
    });

    set((state) => ({
      companions: [companion, ...state.companions],
    }));

    return companion.id;
  },

  updateCompanion: (id, updater) =>
    set((state) => ({
      companions: updateById(state.companions, id, (companion) =>
        touchCompanion(updater(companion))
      ),
    })),

  deleteCompanion: (id) =>
    set((state) => ({
      companions: removeById(state.companions, id),
    })),

  addCompanionTimer: (companionId, timer = createBlankTimer()) => {
    const parsed = companionTimerStateSchema.safeParse(timer);
    if (!parsed.success) return;
    set((state) => ({
      companions: updateById(state.companions, companionId, (companion) =>
        touchCompanion({ ...companion, timers: [...companion.timers, parsed.data] })
      ),
    }));
  },

  updateCompanionTimer: (companionId, timerId, updater) =>
    set((state) => ({
      companions: updateById(state.companions, companionId, (companion) => {
        const updated = updater(companion.timers.find((t) => t.id === timerId) ?? createBlankTimer());
        const parsed = companionTimerStateSchema.safeParse(updated);
        if (!parsed.success) return companion;
        return touchCompanion({
          ...companion,
          timers: companion.timers.map((t) => (t.id === timerId ? parsed.data : t)),
        });
      }),
    })),

  removeCompanionTimer: (companionId, timerId) =>
    set((state) => ({
      companions: updateById(state.companions, companionId, (companion) =>
        touchCompanion({ ...companion, timers: companion.timers.filter((t) => t.id !== timerId) })
      ),
    })),
});
