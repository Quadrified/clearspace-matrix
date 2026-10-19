import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

// Matches the wide-screen side rail in styles.css.
export const RAIL_MEDIA = '(min-width: 1360px)';
// How much of the bottom row must show on the first screen: its heading and a little more.
export const BOTTOM_ROW_PEEK = 72;

/**
 * Whether the side rail leaves the bottom row of quadrants (Delegate, Let go) on the first
 * screen. The board is always measured in its rail layout, so folding into the day bar,
 * which reshapes the board, never flips the answer back and forth.
 */
export function useRailFits(ref: RefObject<HTMLElement | null>) {
  const [fits, setFits] = useState(true);
  useLayoutEffect(() => {
    const main = ref.current;
    if (!main) return;
    const measure = () => {
      if (!window.matchMedia?.(RAIL_MEDIA).matches) return setFits(true);
      const bottom = main.querySelector('.quad[data-q="delegate"]');
      if (!bottom) return setFits(true);
      const probing = !main.classList.contains('has-rail');
      if (probing) main.classList.add('has-rail');
      const top = bottom.getBoundingClientRect().top + window.scrollY;
      if (probing) main.classList.remove('has-rail');
      setFits(top + BOTTOM_ROW_PEEK <= window.innerHeight);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    const board = main.querySelector('.matrix');
    if (board) observer?.observe(board);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [ref]);
  return fits;
}
