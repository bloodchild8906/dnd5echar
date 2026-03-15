import { Character } from '../../domain/models';
import { TagInput } from './TagInput';

interface ConditionsBarProps {
  character: Character;
  onUpdate: (updater: (c: Character) => Character) => void;
}

export const ConditionsBar = ({ character, onUpdate }: ConditionsBarProps) => (
  <TagInput
    label="Conditions"
    values={character.conditions}
    placeholder="Add condition"
    onChange={(values) => onUpdate((c) => ({ ...c, conditions: values }))}
  />
);
