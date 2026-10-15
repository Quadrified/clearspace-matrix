import { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';

export function QuadrantCelebration({ title, animated }: { title: string; animated: boolean }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return (
    <div
      className={`quadrant-celebration${animated ? ' celebrate-motion' : ''}`}
      role="status"
      aria-label="Quadrant cleared"
    >
      <span className="celebration-check">
        <Icon name="check" />
      </span>
      <span>
        <strong>{title} cleared!</strong>
        <span className="celebration-caption">A little more breathing room.</span>
      </span>
      <span className="celebration-sparkles" aria-hidden="true">
        <Icon name="leaf" />
      </span>
    </div>
  );
}
