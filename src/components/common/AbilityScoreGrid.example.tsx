/**
 * Example usage of AbilityScoreGrid component
 * 
 * This component displays all six D&D ability scores with their modifiers,
 * saving throw bonuses, and override indicators.
 * 
 * To integrate into CharacterSheetPage, replace the existing stats-row div
 * with this component:
 * 
 * Before:
 * ```tsx
 * <div className="stats-row">
 *   {getAbilityArray(character).map((entry) => (
 *     <div key={entry.ability} className="stat-tile">
 *       <span>{entry.ability.slice(0, 3).toUpperCase()}</span>
 *       <strong>{entry.total}</strong>
 *       <small>{formatModifier(entry.modifier)}</small>
 *     </div>
 *   ))}
 * </div>
 * ```
 * 
 * After:
 * ```tsx
 * import { AbilityScoreGrid } from '../../components/common/AbilityScoreGrid';
 * 
 * <AbilityScoreGrid 
 *   character={character} 
 *   onUpdate={patch}
 * />
 * ```
 * 
 * The component will automatically:
 * - Display all six ability scores (STR, DEX, CON, INT, WIS, CHA)
 * - Show the total score, modifier, and saving throw bonus for each
 * - Display an OverrideIndicator badge when a ManualOverride is active
 * - Wire to the updateCharacter patch function for future inline editing
 */

import { AbilityScoreGrid } from './AbilityScoreGrid';
import { createBlankCharacter } from '../../domain/seeds';

export const AbilityScoreGridExample = () => {
  const character = createBlankCharacter();
  
  // Example: Set an override on a saving throw
  character.savingThrows.strength.override = {
    value: 10,
    reason: 'Magic item bonus',
    updatedAt: new Date().toISOString(),
  };

  const handleUpdate = (updater: (char: typeof character) => typeof character) => {
    console.log('Character updated:', updater(character));
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ability Score Grid Example</h2>
      <AbilityScoreGrid character={character} onUpdate={handleUpdate} />
    </div>
  );
};
