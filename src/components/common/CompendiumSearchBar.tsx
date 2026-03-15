import { useEffect, useRef, useState } from 'react';
import { ReferenceResource } from '../../domain/models';

interface CompendiumSearchBarProps {
  resource: ReferenceResource;
  query: string;
  onQueryChange: (q: string) => void;
  loading?: boolean;
  error?: string;
}

export const CompendiumSearchBar = ({
  resource,
  query,
  onQueryChange,
  loading,
  error,
}: CompendiumSearchBarProps) => {
  const [draft, setDraft] = useState(query);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external query changes (e.g. shelf selection) back into draft
  useEffect(() => {
    setDraft(query);
  }, [query]);

  const handleChange = (value: string) => {
    setDraft(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onQueryChange(value);
    }, 300);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          type="search"
          value={draft}
          placeholder={`Search ${resource}…`}
          onChange={(e) => handleChange(e.target.value)}
          aria-label={`Search ${resource}`}
          style={{ paddingRight: loading ? '2.5rem' : undefined }}
        />
        {loading ? (
          <span
            aria-live="polite"
            aria-label="Loading"
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--accent-soft)',
              fontSize: '0.8rem',
            }}
          >
            ⟳
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="callout" style={{ fontSize: '0.82rem', margin: 0 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
};
