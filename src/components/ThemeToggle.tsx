import { Icon } from './Icon';
import { useMotionSettings } from '../lib/motion';

export function ThemeToggle({ night, onToggle }: { night: boolean; onToggle: () => void }) {
  const { instant } = useMotionSettings();
  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-label="Dark mode"
      aria-checked={night}
      title={night ? 'Switch to light mode' : 'Switch to dark mode'}
      data-keyboard={instant || undefined}
      onClick={onToggle}
    >
      <span className="theme-track" aria-hidden="true">
        <span className="theme-thumb" />
        <Icon name="sun" className="theme-sun" />
        <Icon name="moon" className="theme-moon" />
      </span>
    </button>
  );
}
