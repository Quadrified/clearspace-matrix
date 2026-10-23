import { useEffect, useState } from 'react';
import { localDate } from '../domain/dates';

// Keeps "today" correct in a tab that stays open past midnight or wakes from sleep.
export function useToday() {
  const [today, setToday] = useState(() => localDate());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => setToday(localDate());
    const schedule = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(
        () => {
          refresh();
          schedule();
        },
        midnight.getTime() - now.getTime() + 1000,
      );
    };
    const visible = () => {
      if (document.visibilityState === 'visible') {
        refresh();
        clearTimeout(timer);
        schedule();
      }
    };
    schedule();
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);
  return today;
}
