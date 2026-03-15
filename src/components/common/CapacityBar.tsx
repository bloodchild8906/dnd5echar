interface CapacityBarProps {
  currentWeight: number;
  weightCapacity?: number;
  label?: string;
}

export const CapacityBar = ({ currentWeight, weightCapacity, label }: CapacityBarProps) => {
  if (weightCapacity === undefined || weightCapacity <= 0) return null;

  const pct = Math.min((currentWeight / weightCapacity) * 100, 100);
  const overCapacity = currentWeight > weightCapacity;

  return (
    <div className="capacity-bar" aria-label={label ?? 'Container weight capacity'}>
      <div className="capacity-bar__track">
        <div
          className={`capacity-bar__fill${overCapacity ? ' capacity-bar__fill--over' : ''}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={currentWeight}
          aria-valuemin={0}
          aria-valuemax={weightCapacity}
        />
      </div>
      <span className={`capacity-bar__label${overCapacity ? ' capacity-bar__label--over' : ''}`}>
        {currentWeight.toFixed(1)} / {weightCapacity} lb
        {overCapacity ? ' — Over capacity' : ''}
      </span>
    </div>
  );
};
