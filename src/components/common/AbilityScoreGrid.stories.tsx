import type { Meta, StoryObj } from '@storybook/react';
import { AbilityScoreGrid } from './AbilityScoreGrid';
import { createBlankCharacter } from '../../domain/seeds';

const meta = {
  title: 'Common/AbilityScoreGrid',
  component: AbilityScoreGrid,
  parameters: { layout: 'padded' },
  args: {
    onUpdate: () => {},
  },
} satisfies Meta<typeof AbilityScoreGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    character: createBlankCharacter(),
  },
};

export const WithOverrides: Story = {
  args: {
    character: (() => {
      const c = createBlankCharacter();
      c.savingThrows.strength.override = {
        value: 8,
        reason: 'Belt of Giant Strength',
        updatedAt: new Date().toISOString(),
      };
      c.abilityScores.strength.bonus = 4;
      return c;
    })(),
  },
};
