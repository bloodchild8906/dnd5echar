import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { FloatingCompendiumPanel } from './FloatingCompendiumPanel';
import { useAppStore } from '../../store/useAppStore';

const StoreInitDecorator = (Story: React.ComponentType) => {
  useEffect(() => {
    useAppStore.setState({
      homebrew: [],
      uiPreferences: {
        compendium: { pinnedEntries: [], recentEntries: [] },
        navCollapsed: false,
        spellFiltersOpen: false,
        compactCards: false,
        activeNoteId: null,
      },
      settings: {
        referenceDocumentFilter: '',
        referenceCacheHours: 24,
        encumbranceMode: 'off',
        compactMode: false,
        seedLoaded: false,
        lastSelectedCharacterId: null,
        printOptions: { showNotes: true, showSpellbook: true },
        supabase: { autoSync: false },
      },
    });
  }, []);

  return <Story />;
};

const meta = {
  title: 'Common/FloatingCompendiumPanel',
  component: FloatingCompendiumPanel,
  parameters: { layout: 'fullscreen' },
  decorators: [StoreInitDecorator],
} satisfies Meta<typeof FloatingCompendiumPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    onClose: () => {},
  },
};
