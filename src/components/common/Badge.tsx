interface BadgeProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'warning' | 'success';
}

export const Badge = ({ children, tone = 'neutral' }: BadgeProps) => {
  return <span className={`badge badge--${tone}`}>{children}</span>;
};
