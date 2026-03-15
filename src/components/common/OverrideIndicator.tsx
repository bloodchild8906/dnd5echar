import { Badge } from './Badge';

interface OverrideIndicatorProps {
  isActive: boolean;
  reason?: string;
}

export const OverrideIndicator = ({ isActive, reason }: OverrideIndicatorProps) => {
  if (!isActive) {
    return null;
  }

  return (
    <Badge tone="warning">
      {reason || 'Override'}
    </Badge>
  );
};
