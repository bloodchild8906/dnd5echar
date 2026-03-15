import { StateCreator } from 'zustand';
import { mapPinSchema, settlementSchema, settlementSectionSchema } from '../../domain/schemas';
import { MapPin, Settlement, SettlementSection, settlementSectionTypes } from '../../domain/models';
import { createId } from '../../utils/id';
import { isoNow } from '../../utils/numbers';
import { removeById, updateById } from '../helpers';
import { AppStore, SettlementsSlice } from '../types';

const createBlankSettlement = (initial?: Partial<Settlement>): Settlement => {
  const now = isoNow();
  const sections: SettlementSection[] = settlementSectionTypes.map((type, index) => ({
    id: createId('section'),
    title: type.charAt(0).toUpperCase() + type.slice(1),
    body: '',
    entries: [],
    order: index,
  }));

  return {
    id: createId('settlement'),
    name: 'New Settlement',
    description: '',
    sections,
    mapPins: [],
    published: false,
    createdAt: now,
    updatedAt: now,
    ...initial,
  };
};

export const createSettlementsSlice: StateCreator<AppStore, [], [], SettlementsSlice> = (set) => ({
  createSettlement: (initial) => {
    const settlement = createBlankSettlement(initial);
    const parsed = settlementSchema.safeParse(settlement);
    if (!parsed.success) {
      console.error('[settlementsSlice] createSettlement: schema validation failed', parsed.error);
      return settlement.id;
    }
    set((state) => ({
      settlements: [parsed.data, ...state.settlements],
    }));
    return parsed.data.id;
  },

  updateSettlementSection: (settlementId, sectionId, updater) =>
    set((state) => ({
      settlements: updateById(state.settlements, settlementId, (settlement) => {
        const existing = settlement.sections.find((s) => s.id === sectionId);
        if (!existing) return settlement;
        const updated = updater(existing);
        const parsed = settlementSectionSchema.safeParse(updated);
        if (!parsed.success) {
          console.error(
            '[settlementsSlice] updateSettlementSection: schema validation failed',
            parsed.error
          );
          return settlement;
        }
        return {
          ...settlement,
          sections: updateById(settlement.sections, sectionId, () => parsed.data),
          updatedAt: isoNow(),
        };
      }),
    })),

  addMapPin: (settlementId, pin) => {
    const newPin: MapPin = {
      id: createId('pin'),
      label: '',
      x: 50,
      y: 50,
      notes: '',
      ...pin,
    };
    const parsed = mapPinSchema.safeParse(newPin);
    if (!parsed.success) {
      console.error('[settlementsSlice] addMapPin: schema validation failed', parsed.error);
      return;
    }
    set((state) => ({
      settlements: updateById(state.settlements, settlementId, (settlement) => ({
        ...settlement,
        mapPins: [...settlement.mapPins, parsed.data],
        updatedAt: isoNow(),
      })),
    }));
  },

  removeMapPin: (settlementId, pinId) =>
    set((state) => ({
      settlements: updateById(state.settlements, settlementId, (settlement) => ({
        ...settlement,
        mapPins: removeById(settlement.mapPins, pinId),
        updatedAt: isoNow(),
      })),
    })),

  publishSettlement: (id) =>
    set((state) => ({
      settlements: updateById(state.settlements, id, (settlement) => ({
        ...settlement,
        published: true,
        updatedAt: isoNow(),
      })),
    })),

  deleteSettlement: (id) =>
    set((state) => ({
      settlements: removeById(state.settlements, id),
    })),
});
