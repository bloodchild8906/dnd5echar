import { Character, Skill, skills } from '../../domain/models';
import { getSkillBonus, skillAbilityMap } from '../../domain/derived';
import { formatModifier, titleCase } from '../../utils/format';

interface SkillListProps {
  character: Character;
  onUpdate: (updater: (c: Character) => Character) => void;
}

const proficiencyIcon = (level: string) => {
  if (level === 'expertise') return '◆';
  if (level === 'proficient') return '●';
  return '○';
};

const nextProficiency = (current: string) => {
  if (current === 'none') return 'proficient';
  if (current === 'proficient') return 'expertise';
  return 'none';
};

export const SkillList = ({ character, onUpdate }: SkillListProps) => {
  const handleToggle = (skill: Skill) => {
    onUpdate((c) => ({
      ...c,
      skills: {
        ...c.skills,
        [skill]: {
          ...c.skills[skill],
          proficiency: nextProficiency(c.skills[skill].proficiency),
        },
      },
    }));
  };

  return (
    <div className="stack-list">
      {(skills as readonly Skill[]).map((skill) => {
        const state = character.skills[skill];
        const bonus = getSkillBonus(character, skill);
        const ability = skillAbilityMap[skill].slice(0, 3).toUpperCase();
        return (
          <div key={skill} className="skill-row">
            <button
              type="button"
              className="button button--icon"
              aria-label={`Toggle proficiency for ${titleCase(skill)}`}
              onClick={() => handleToggle(skill)}
            >
              {proficiencyIcon(state.proficiency)}
            </button>
            <span className="skill-row__name">{titleCase(skill)}</span>
            <span className="skill-row__ability">{ability}</span>
            <span className="skill-row__bonus">{formatModifier(bonus)}</span>
          </div>
        );
      })}
    </div>
  );
};
