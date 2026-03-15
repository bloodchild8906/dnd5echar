import type { Meta, StoryObj } from '@storybook/react';
import { VirtualList } from './VirtualList';

// VirtualList is generic; Storybook infers T=unknown from the component type.
// We cast the render/key callbacks to satisfy strict TS while keeping stories readable.
const meta = {
  title: 'Common/VirtualList',
  component: VirtualList,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof VirtualList>;

export default meta;
type Story = StoryObj<typeof meta>;

const makeItems = (count: number) =>
  Array.from({ length: count }, (_, i) => `Item ${i + 1}`);

const renderString = (item: unknown) => (
  <div style={{ padding: '8px 0' }}>{String(item)}</div>
);
const keyString = (item: unknown) => String(item);

export const Default: Story = {
  args: {
    items: makeItems(10),
    renderItem: renderString,
    getKey: keyString,
  },
};

export const Virtualized: Story = {
  args: {
    items: makeItems(100),
    renderItem: renderString,
    getKey: keyString,
  },
};

export const CustomHeight: Story = {
  args: {
    items: makeItems(60),
    maxHeight: 200,
    renderItem: renderString,
    getKey: keyString,
  },
};
