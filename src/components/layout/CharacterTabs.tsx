import { NavLink } from 'react-router-dom';

interface CharacterTabsProps {
  characterId: string;
}

const links = [
  { to: 'builder', label: 'Builder' },
  { to: 'sheet', label: 'Sheet' },
  { to: 'spells', label: 'Spells' },
  { to: 'inventory', label: 'Inventory' },
  { to: 'companions', label: 'Companions' },
  { to: 'forms', label: 'Wild Shapes' },
  { to: 'notes', label: 'Notes' },
];

export const CharacterTabs = ({ characterId }: CharacterTabsProps) => {
  return (
    <nav className="character-tabs">
      {links.map((link) => (
        <NavLink key={link.to} to={`/characters/${characterId}/${link.to}`} className={({ isActive }) => (isActive ? 'tab-link tab-link--active' : 'tab-link')}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
};
