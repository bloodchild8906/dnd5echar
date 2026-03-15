import { Character, Ability } from '../../domain/models';
import { getAbilityTotal, getAbilityModifier, getSavingThrowBonus } from '../../domain/derived';
import { formatModifier } from '../../utils/format';
import { OverrideIndicator } from './OverrideIndicator';

interface AbilityScoreGridProps {
  character: Character;
  onUpdate: (updater: (character: Character) => Character) => void;
}

const abilities: Ability[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export const AbilityScoreGrid = ({ character, onUpdate }: AbilityScoreGridProps) => {
  return (
    <div className="stats-row">
      {abilities.map((ability) => {
        const total = getAbilityTotal(character, ability);
        const modifier = getAbilityModifier(character, ability);
        const save = getSavingThrowBonus(character, ability);
        const hasScoreOverride = character.abilityScores[ability].temp !== 0 || character.abilityScores[ability].bonus !== 0;
        const hasSaveOverride = character.savingThrows[ability].override !== undefined;

        return (
          <div key={ability} className="stat-tile">
            <span>{ability.slice(0, 3).toUpperCase()}</span>
            <strong>{total}</strong>
            <small>{formatModifier(modifier)}</small>
            <small>Save: {formatModifier(save)}</small>
            {(hasScoreOverride || hasSaveOverride) && (
              <OverrideIndicator 
                isActive={true} 
                reason={hasSaveOverride ? character.savingThrows[ability].override?.reason : undefined}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
