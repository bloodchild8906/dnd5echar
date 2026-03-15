interface LoadingSkeletonProps {
  rows?: number;
  variant?: 'row' | 'card' | 'text';
  label?: string;
}

/**
 * Accessible loading placeholder.
 * Wraps skeleton rows in a container with `aria-busy="true"` and a
 * visually-hidden status label for screen readers.
 */
export const LoadingSkeleton = ({ rows = 3, variant = 'row', label = 'Loading…' }: LoadingSkeletonProps) => (
  <div aria-busy="true" aria-label={label} role="status">
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className={`skeleton skeleton--${variant}`} aria-hidden="true" />
    ))}
  </div>
);
