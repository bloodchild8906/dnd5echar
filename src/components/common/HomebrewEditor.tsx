import { useEffect, useState } from 'react';
import { homebrewEntrySchema } from '../../domain/schemas';
import { HomebrewEntry, HomebrewEntityType, homebrewEntityTypes } from '../../domain/models';
import { TagInput } from './TagInput';

interface HomebrewEditorProps {
  entry: HomebrewEntry;
  onSave: (updater: (entry: HomebrewEntry) => HomebrewEntry) => void;
}

const entityTypeLabels: Record<HomebrewEntityType, string> = {
  race: 'Race',
  class: 'Class',
  subclass: 'Subclass',
  feat: 'Feat',
  item: 'Item',
  spell: 'Spell',
  creature: 'Creature',
  background: 'Background',
  companion: 'Companion',
  form: 'Form',
};

type FieldErrors = Partial<Record<keyof HomebrewEntry, string>>;

export const HomebrewEditor = ({ entry, onSave }: HomebrewEditorProps) => {
  const [draft, setDraft] = useState<HomebrewEntry>(entry);
  const [overrideDraft, setOverrideDraft] = useState(
    JSON.stringify(entry.overrideData ?? {}, null, 2)
  );
  const [overrideParseError, setOverrideParseError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  // Sync when entry changes externally (e.g. switching selected entry)
  useEffect(() => {
    setDraft(entry);
    setOverrideDraft(JSON.stringify(entry.overrideData ?? {}, null, 2));
    setOverrideParseError('');
    setFieldErrors({});
    setSaved(false);
  }, [entry.id]);

  const patch = (partial: Partial<HomebrewEntry>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  };

  const handleOverrideChange = (value: string) => {
    setOverrideDraft(value);
    setSaved(false);
    try {
      const parsed = JSON.parse(value) as unknown;
      setDraft((prev) => ({ ...prev, overrideData: parsed }));
      setOverrideParseError('');
    } catch {
      setOverrideParseError('Override data must be valid JSON.');
    }
  };

  const handleSave = () => {
    if (overrideParseError) return;

    const result = homebrewEntrySchema.safeParse(draft);
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof HomebrewEntry;
        if (key) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSave(() => result.data as HomebrewEntry);
    setSaved(true);
  };

  return (
    <div className="stacked-editor">
      <div className="form-grid form-grid--three">
        <label>
          Name
          {fieldErrors.name ? (
            <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
              {fieldErrors.name}
            </span>
          ) : null}
          <input
            className="input"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
            aria-invalid={!!fieldErrors.name}
          />
        </label>

        <label>
          Entity Type
          {fieldErrors.entityType ? (
            <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
              {fieldErrors.entityType}
            </span>
          ) : null}
          <select
            className="input"
            value={draft.entityType}
            onChange={(e) => patch({ entityType: e.target.value as HomebrewEntityType })}
            aria-invalid={!!fieldErrors.entityType}
          >
            {homebrewEntityTypes.map((t) => (
              <option key={t} value={t}>
                {entityTypeLabels[t]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Summary
          {fieldErrors.summary ? (
            <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
              {fieldErrors.summary}
            </span>
          ) : null}
          <input
            className="input"
            value={draft.summary}
            onChange={(e) => patch({ summary: e.target.value })}
            aria-invalid={!!fieldErrors.summary}
          />
        </label>
      </div>

      <TagInput
        label="Tags"
        values={draft.tags}
        onChange={(values) => patch({ tags: values })}
      />

      <label>
        Notes
        <textarea
          className="textarea"
          rows={3}
          value={draft.notes}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </label>

      <label>
        Override Data (JSON)
        {overrideParseError ? (
          <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
            {overrideParseError}
          </span>
        ) : null}
        <textarea
          className="textarea"
          rows={8}
          value={overrideDraft}
          onChange={(e) => handleOverrideChange(e.target.value)}
          aria-invalid={!!overrideParseError}
        />
      </label>

      {Object.keys(fieldErrors).length > 0 ? (
        <div role="alert" className="callout">
          Fix the errors above before saving.
        </div>
      ) : null}

      <div className="button-row">
        <button
          type="button"
          className="button"
          onClick={handleSave}
          disabled={!!overrideParseError}
        >
          Save Changes
        </button>
        {saved ? (
          <span style={{ color: 'var(--success)', fontSize: '0.88rem' }}>Saved</span>
        ) : null}
      </div>
    </div>
  );
};
