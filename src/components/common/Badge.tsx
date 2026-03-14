import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'warning' | 'success';
}

export const Badge = ({ children, tone = 'neutral' }: BadgeProps) => {
  return <span className={`badge badge--${tone}`}>{children}</span>;
};
