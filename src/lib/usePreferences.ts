import { useEffect, useState } from 'react';
import { defaultLabels, labelsSchema, quadrants } from '../domain/models';
import type { Labels } from '../domain/models';
export function readLabels(): Labels {
  try {
    const raw = JSON.parse(localStorage.getItem('clearspace.labels.v1') ?? 'null');
    const parsed = labelsSchema.safeParse(raw?.quadrants ?? raw);
    if (!parsed.success) return structuredClone(defaultLabels);
    const old = [
      'Handle what needs you now.',
      'Make time for the things that matter.',
      'You don’t have to do it all.',
      'Less noise. More room to think.',
      "You don't have to do it all.",
    ];
    for (const q of quadrants)
      if (old.includes(parsed.data[q.id].subtitle)) parsed.data[q.id].subtitle = q.subtitle;
    return parsed.data;
  } catch {
    return structuredClone(defaultLabels);
  }
}
function get(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
export function usePreferences(notify: (s: string) => void) {
  const [labels, setLabels] = useState(readLabels);
  const [night, setNight] = useState(() => get('clearspace.theme', 'light') === 'night');
  const [size, setSize] = useState(() => {
    const n = Number(get('clearspace.fontSize.v1', '100'));
    return Number.isFinite(n) ? Math.max(90, Math.min(160, n)) : 100;
  });
  useEffect(() => {
    document.body.classList.toggle('night', night);
    document.documentElement.style.colorScheme = night ? 'dark' : 'light';
    // Match browser chrome to the app's explicit preference, even if the OS differs.
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.content = night ? '#12271e' : '#f4f6ef';
    });
    document.documentElement.style.setProperty('--text-scale', String(size / 100));
  }, [night, size]);
  function save(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      notify('Preferences could not be saved in this browser.');
    }
  }
  return {
    labels,
    night,
    size,
    setLabels: (v: Labels) => {
      setLabels(v);
      save('clearspace.labels.v1', JSON.stringify({ quadrants: v }));
    },
    toggleNight: () => {
      setNight(!night);
      save('clearspace.theme', night ? 'light' : 'night');
    },
    setSize: (v: number) => {
      const n = Math.min(160, Math.max(90, v));
      setSize(n);
      save('clearspace.fontSize.v1', String(n));
    },
  };
}
