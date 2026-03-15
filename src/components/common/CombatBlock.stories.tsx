import type { Meta, StoryObj } from '@storybook/react';
import { CombatBlock } from './CombatBlock';
import { createBlankCharacter } from '../../domain/seeds';

const meta = {
  title: 'Common/CombatBlock',
  component: CombatBlock,
  parameters: { layout: 'padded' },
  args: {
    onUpdate: () => {},
  },
} satisfies Meta<typeof CombatBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    character: createBlankCharacter(),
  },
};

export const FullHealth: Story = {
  args: {
    character: (() => {
      const c = createBlankCharacter();
      c.combat.hitPoints = { max: 20, current: 20, temp: 0 };
      return c;
    })(),
  },
};

export const Bloodied: Story = {
  args: {
    character: (() => {
      const c = createBlankCharacter();
      c.combat.hitPoints = { max: 20, current: 8, temp: 0 };
      return c;
    })(),
  },
};

export const DeathSaves: Story = {
  args: {
    character: (() => {
      const c = createBlankCharacter();
      c.combat.hitPoints = { max: 20, current: 0, temp: 0 };
      c.combat.deathSaves = { successes: 1, failures: 2 };
      return c;
    })(),
  },
};
