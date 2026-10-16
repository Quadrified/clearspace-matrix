import { useLayoutEffect } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { usePreferences } from './usePreferences';

afterEach(() => {
  document.body.classList.remove('night');
  document.documentElement.classList.remove('night');
});

it('applies the saved theme and both directions of a toggle before layout observers run', () => {
  localStorage.setItem('clearspace.theme', 'night');
  const frames: boolean[][] = [];
  function Probe() {
    const { night, toggleNight } = usePreferences(vi.fn());
    useLayoutEffect(() => {
      frames.push([
        night,
        document.body.classList.contains('night'),
        document.documentElement.classList.contains('night'),
      ]);
    }, [night]);
    return <button onClick={toggleNight}>Toggle theme</button>;
  }
  render(<Probe />);
  fireEvent.click(screen.getByRole('button'));
  fireEvent.click(screen.getByRole('button'));
  expect(frames).toEqual([
    [true, true, true],
    [false, false, false],
    [true, true, true],
  ]);
  expect(localStorage.getItem('clearspace.theme')).toBe('night');
});
