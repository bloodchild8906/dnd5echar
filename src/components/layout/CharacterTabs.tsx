import { NavLink } from 'react-router-dom';
import { characterNavLinks } from './characterNav';

interface CharacterTabsProps {
  characterId: string;
}

export const CharacterTabs = ({ characterId }: CharacterTabsProps) => {
  return (
    <nav className="character-tabs">
      {characterNavLinks.map((link) => (
        <NavLink
          key={link.to}
          to={`/characters/${characterId}/${link.to}`}
          className={({ isActive }) => (isActive ? 'tab-link tab-link--active' : 'tab-link')}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
};
