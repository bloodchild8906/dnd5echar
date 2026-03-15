import type { Meta, StoryObj } from '@storybook/react';
import { InventorySection } from './InventorySection';
import { createBlankCharacter } from '../../domain/seeds';
import { isoNow } from '../../utils/numbers';

const meta = {
  title: 'Common/InventorySection',
  component: InventorySection,
  parameters: { layout: 'padded' },
  args: {
    onAddItem: () => {},
    onUpdateItem: () => {},
    onRemoveItem: () => {},
    onMoveItem: () => {},
    onUpdateCurrency: () => {},
  },
} satisfies Meta<typeof InventorySection>;

export default meta;
type Story = StoryObj<typeof meta>;

const makeItem = (id: string, name: string) => ({
  id,
  name,
  description: '',
  quantity: 1,
  weight: 1,
  value: { amount: 1, denomination: 'gp' as const },
  rarity: 'Common',
  attunementRequired: false,
  attuned: false,
  equipped: false,
  consumable: false,
  tags: [],
  notes: '',
  containerId: null,
  sourceRef: { sourceType: 'user-created' as const, fetchedAt: isoNow() },
});

export const Default: Story = {
  args: {
    character: (() => {
      const c = createBlankCharacter();
      c.inventory.items = [
        makeItem('i1', 'Longsword'),
        makeItem('i2', 'Shield'),
        makeItem('i3', 'Rope (50 ft)'),
      ];
      return c;
    })(),
  },
};

export const Empty: Story = {
  args: {
    character: (() => {
      const c = createBlankCharacter();
      c.inventory.items = [];
      return c;
    })(),
  },
};
