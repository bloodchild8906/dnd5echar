interface NumberAdjusterProps {
  value: number;
  label?: string;
  step?: number;
  min?: number;
  onChange: (value: number) => void;
}

export const NumberAdjuster = ({ value, label, step = 1, min = 0, onChange }: NumberAdjusterProps) => {
  return (
    <div className="number-adjuster">
      {label ? <span>{label}</span> : null}
      <div className="number-adjuster__controls">
        <button type="button" className="button button--ghost" onClick={() => onChange(Math.max(min, value - step))}>
          -
        </button>
        <strong>{value}</strong>
        <button type="button" className="button button--ghost" onClick={() => onChange(value + step)}>
          +
        </button>
      </div>
    </div>
  );
};
