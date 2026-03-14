import { StateCreator } from 'zustand';
import { createBlankNote } from '../../domain/seeds';
import { isoNow } from '../../utils/numbers';
import { removeById, touchNote, updateById } from '../helpers';
import { AppStore, NotesSlice } from '../types';

export const createNotesSlice: StateCreator<AppStore, [], [], NotesSlice> = (set) => ({
  createNote: (initial) => {
    const note = touchNote({
      ...createBlankNote(),
      ...initial,
      updatedAt: isoNow(),
    });

    set((state) => ({
      notes: [note, ...state.notes],
      uiPreferences: {
        ...state.uiPreferences,
        activeNoteId: note.id,
      },
    }));

    return note.id;
  },

  updateNote: (id, updater) =>
    set((state) => ({
      notes: updateById(state.notes, id, (note) => touchNote(updater(note))),
    })),

  deleteNote: (id) =>
    set((state) => ({
      notes: removeById(state.notes, id),
      uiPreferences: {
        ...state.uiPreferences,
        activeNoteId: state.uiPreferences.activeNoteId === id ? state.notes.find((note) => note.id !== id)?.id ?? null : state.uiPreferences.activeNoteId,
      },
    })),
});
