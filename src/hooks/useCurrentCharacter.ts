import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export const useCurrentCharacter = () => {
  const params = useParams<{ characterId: string }>();
  const characterId = params.characterId ?? null;
  const selectCharacter = useAppStore((state) => state.selectCharacter);
  const characters = useAppStore((state) => state.characters);
  const companions = useAppStore((state) => state.companions);

  const character = useMemo(
    () => characters.find((entry) => entry.id === characterId) ?? null,
    [characterId, characters]
  );
  const linkedCompanions = useMemo(
    () => companions.filter((entry) => entry.parentCharacterId === characterId),
    [characterId, companions]
  );

  useEffect(() => {
    if (characterId && character) {
      selectCharacter(characterId);
      return;
    }

    if (characterId) {
      selectCharacter(null);
    }
  }, [character, characterId, selectCharacter]);

  return {
    characterId,
    character,
    companions: linkedCompanions,
  };
};
