import { StateCreator } from 'zustand';
import { PolymorphState } from '../../domain/models';
import { createBlankWildShapeForm } from '../../domain/seeds';
import { touchCharacter, updateById } from '../helpers';
import { AppStore, WildShapesSlice } from '../types';

export const createWildShapesSlice: StateCreator<AppStore, [], [], WildShapesSlice> = (set) => ({
  addWildShapeForm: (characterId, form = createBlankWildShapeForm()) => {
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          wildShapes: {
            ...character.wildShapes,
            forms: [form, ...character.wildShapes.forms],
          },
        })
      ),
    }));

    return form.id;
  },

  updateWildShapeForm: (characterId, formId, updater) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          wildShapes: {
            ...character.wildShapes,
            forms: updateById(character.wildShapes.forms, formId, updater),
          },
        })
      ),
    })),

  removeWildShapeForm: (characterId, formId) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          wildShapes: {
            ...character.wildShapes,
            forms: character.wildShapes.forms.filter((form) => form.id !== formId),
            activeForm:
              character.wildShapes.activeForm?.formId === formId
                ? null
                : character.wildShapes.activeForm,
          },
        })
      ),
    })),

  setActiveWildShape: (characterId, formId) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) => {
        const form = character.wildShapes.forms.find((entry) => entry.id === formId);
        if (!form) {
          return character;
        }

        return touchCharacter({
          ...character,
          wildShapes: {
            ...character.wildShapes,
            activeForm: {
              formId,
              currentHp: form.stats.hp.current,
              revertHp: character.combat.hitPoints.current,
              notes: '',
              retainedMentalStats: true,
              retainedSkillProficiencies: true,
            },
          },
        });
      }),
    })),

  clearActiveWildShape: (characterId) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          wildShapes: {
            ...character.wildShapes,
            activeForm: null,
          },
        })
      ),
    })),

  updateActiveWildShapeHp: (characterId, delta) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) => {
        if (!character.wildShapes.activeForm) return character;
        const newHp = Math.max(0, character.wildShapes.activeForm.currentHp + delta);
        if (newHp === 0) {
          // Auto-revert: restore character HP and clear active form
          return touchCharacter({
            ...character,
            combat: {
              ...character.combat,
              hitPoints: {
                ...character.combat.hitPoints,
                current: character.wildShapes.activeForm.revertHp,
              },
            },
            wildShapes: { ...character.wildShapes, activeForm: null },
          });
        }
        return touchCharacter({
          ...character,
          wildShapes: {
            ...character.wildShapes,
            activeForm: { ...character.wildShapes.activeForm, currentHp: newHp },
          },
        });
      }),
    })),

  setActivePolymorph: (characterId, polymorphState: PolymorphState) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({ ...character, activePolymorph: polymorphState })
      ),
    })),

  clearPolymorph: (characterId) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) => {
        const revertHp = character.activePolymorph?.revertHp ?? character.combat.hitPoints.current;
        return touchCharacter({
          ...character,
          combat: {
            ...character.combat,
            hitPoints: { ...character.combat.hitPoints, current: revertHp },
          },
          activePolymorph: null,
        });
      }),
    })),
});
