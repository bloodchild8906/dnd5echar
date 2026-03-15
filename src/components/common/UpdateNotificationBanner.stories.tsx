import type { Meta, StoryObj } from '@storybook/react';
import { UpdateNotificationBanner } from './UpdateNotificationBanner';

const meta = {
  title: 'Common/UpdateNotificationBanner',
  component: UpdateNotificationBanner,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof UpdateNotificationBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

// The mock always returns needRefresh=true, so the banner is always visible.
export const Default: Story = {};

// needRefresh=false would hide the banner, but since the mock always returns true,
// this story also shows the banner (demonstrating the visible state).
export const Hidden: Story = {};
