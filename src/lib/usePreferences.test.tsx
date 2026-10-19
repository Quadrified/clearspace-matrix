import { useLayoutEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

it('follows the system theme live on Auto and stops once a choice is saved', () => {
  const listeners = new Set<() => void>();
  const query = {
    matches: false,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  vi.stubGlobal('matchMedia', () => query);
  const systemChange = (dark: boolean) =>
    act(() => {
      query.matches = dark;
      listeners.forEach((fn) => fn());
    });
  function Probe() {
    const { theme, setTheme } = usePreferences(vi.fn());
    return (
      <>
        <output>{theme}</output>
        <button onClick={() => setTheme('light')}>Light</button>
        <button onClick={() => setTheme('auto')}>Auto</button>
      </>
    );
  }
  render(<Probe />);
  expect(screen.getByRole('status')).toHaveTextContent('auto');
  expect(document.body).not.toHaveClass('night');
  systemChange(true);
  expect(document.body).toHaveClass('night');
  expect(document.documentElement.style.colorScheme).toBe('dark');
  fireEvent.click(screen.getByRole('button', { name: 'Light' }));
  expect(document.body).not.toHaveClass('night');
  expect(localStorage.getItem('clearspace.theme')).toBe('light');
  expect(listeners.size).toBe(0);
  fireEvent.click(screen.getByRole('button', { name: 'Auto' }));
  expect(document.body).toHaveClass('night');
  expect(localStorage.getItem('clearspace.theme')).toBe('auto');
  systemChange(false);
  expect(document.body).not.toHaveClass('night');
});
