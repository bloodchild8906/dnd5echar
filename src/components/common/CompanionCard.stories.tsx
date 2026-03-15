import type { Meta, StoryObj } from '@storybook/react';
import { CompanionCard } from './CompanionCard';
import { createBlankCompanion, createBlankCharacter } from '../../domain/seeds';

const baseChar = createBlankCharacter();

const makeCompanion = () => {
  const c = createBlankCompanion(baseChar.id);
  c.name = 'Familiar';
  c.type = 'familiar';
  c.stats.hp = { max: 20, current: 20, temp: 0 };
  c.stats.ac = 12;
  return c;
};

const meta = {
  title: 'Common/CompanionCard',
  component: CompanionCard,
  parameters: { layout: 'padded' },
  args: {
    onUpdate: () => {},
  },
} satisfies Meta<typeof CompanionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    companion: makeCompanion(),
  },
};

export const LowHP: Story = {
  args: {
    companion: (() => {
      const c = makeCompanion();
      c.stats.hp = { max: 20, current: 3, temp: 0 };
      return c;
    })(),
  },
};

export const Expanded: Story = {
  args: {
    companion: makeCompanion(),
    children: <p>Stat block goes here</p>,
  },
};
