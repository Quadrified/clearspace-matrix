import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

// Sticky legends follow the actual header, including wrapping, text size, and safe areas.
export function useHeaderHeight(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const header = ref.current;
    if (!header) return;
    const root = document.documentElement;
    const measure = () => {
      const height = header.getBoundingClientRect().height;
      if (height > 0) root.style.setProperty('--app-header-height', `${height}px`);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(header);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      root.style.removeProperty('--app-header-height');
    };
  }, [ref]);
}
