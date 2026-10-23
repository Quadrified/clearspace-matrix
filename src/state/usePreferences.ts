/**
 * Appearance and personalization that live outside the board: quadrant labels, light/dark theme
 * and text size. Each is saved to localStorage and applied to the page before it paints.
 */
import { useEffect, useLayoutEffect, useState } from 'react';
import { defaultLabels, labelsSchema, quadrants } from '../domain/models';
import type { Labels } from '../domain/models';
import { readStorage, STORAGE_KEYS, writeStorage } from './storage';

// Stock subtitles from earlier versions. Saved copies switch to today's wording; custom text stays.
const LEGACY_SUBTITLES = [
  'Handle what needs you now.',
  'Make time for the things that matter.',
  'You don’t have to do it all.',
  'Less noise. More room to think.',
  "You don't have to do it all.",
];

function readLabels(): Labels {
  try {
    const raw = JSON.parse(readStorage(STORAGE_KEYS.labels) ?? 'null') as unknown;
    const saved = raw as { quadrants?: unknown } | null;
    const parsed = labelsSchema.safeParse(saved?.quadrants ?? raw);
    if (!parsed.success) return structuredClone(defaultLabels);
    for (const q of quadrants)
      if (LEGACY_SUBTITLES.includes(parsed.data[q.id].subtitle))
        parsed.data[q.id].subtitle = q.subtitle;
    return parsed.data;
  } catch {
    return structuredClone(defaultLabels);
  }
}
const get = (key: string, fallback: string) => readStorage(key) ?? fallback;
export type ThemeChoice = 'auto' | 'light' | 'night';
const darkQuery = '(prefers-color-scheme: dark)';
function systemPrefersDark() {
  return window.matchMedia?.(darkQuery).matches ?? false;
}
function readTheme(): ThemeChoice {
  const saved = get(STORAGE_KEYS.theme, '');
  // No saved choice (or an unknown one) starts in Light; Auto is opt-in.
  return saved === 'auto' || saved === 'night' ? saved : 'light';
}
export type Preferences = ReturnType<typeof usePreferences>;

export function usePreferences(notify: (s: string) => void) {
  const [labels, setLabels] = useState(readLabels);
  const [theme, setTheme] = useState(readTheme);
  const [systemNight, setSystemNight] = useState(systemPrefersDark);
  const night = theme === 'auto' ? systemNight : theme === 'night';
  const [size, setSize] = useState(() => {
    const n = Number(get(STORAGE_KEYS.fontSize, '100'));
    return Number.isFinite(n) ? Math.max(90, Math.min(160, n)) : 100;
  });
  useEffect(() => {
    if (theme !== 'auto') return;
    const query = window.matchMedia?.(darkQuery);
    // Follow the OS live while on Auto, e.g. when it switches to dark at sunset.
    const sync = () => setSystemNight(query?.matches ?? false);
    sync();
    query?.addEventListener?.('change', sync);
    return () => query?.removeEventListener?.('change', sync);
  }, [theme]);
  useLayoutEffect(() => {
    // Update the canvas, controls, and browser chrome in the same pre-paint commit.
    document.documentElement.classList.toggle('night', night);
    document.body.classList.toggle('night', night);
    document.documentElement.style.colorScheme = night ? 'dark' : 'light';
    // Match browser chrome to the app's explicit preference, even if the OS differs.
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.content = night ? '#12271e' : '#f4f6ef';
    });
    document.documentElement.style.setProperty('--text-scale', String(size / 100));
  }, [night, size]);
  function save(key: string, value: string) {
    if (!writeStorage(key, value)) notify('Preferences could not be saved in this browser.');
  }
  return {
    labels,
    night,
    theme,
    size,
    setLabels: (v: Labels) => {
      setLabels(v);
      save(STORAGE_KEYS.labels, JSON.stringify({ quadrants: v }));
    },
    setTheme: (v: ThemeChoice) => {
      setTheme(v);
      save(STORAGE_KEYS.theme, v);
    },
    setSize: (v: number) => {
      const n = Math.min(160, Math.max(90, v));
      setSize(n);
      save(STORAGE_KEYS.fontSize, String(n));
    },
  };
}
