import { useState } from 'react';

interface TagInputProps {
  label?: string;
  values: string[];
  placeholder?: string;
  onChange: (values: string[]) => void;
}

export const TagInput = ({ label, values, placeholder = 'Add tag', onChange }: TagInputProps) => {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const next = draft.trim();
    if (!next || values.includes(next)) {
      setDraft('');
      return;
    }

    onChange([...values, next]);
    setDraft('');
  };

  return (
    <div className="tag-input">
      {label ? <label>{label}</label> : null}
      <div className="tag-input__chips">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            className="tag-chip"
            aria-label={`Remove ${value}`}
            onClick={() => onChange(values.filter((entry) => entry !== value))}
          >
            {value}
            <span aria-hidden="true">x</span>
          </button>
        ))}
      </div>
      <div className="tag-input__controls">
        <input
          className="input"
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
          }}
        />
        <button type="button" className="button button--ghost" onClick={commit}>
          Add
        </button>
      </div>
    </div>
  );
};
