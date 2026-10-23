/**
 * Every value Clearspace keeps in localStorage, in one place. The key names are part of the saved
 * data format: renaming one would make existing browsers forget that value.
 */
export const STORAGE_KEYS = {
  /** Tasks and projects (version-2 JSON). */
  matrix: 'clearspace.matrix.v1',
  /** Quadrant titles, subtitles and icons. */
  labels: 'clearspace.labels.v1',
  /** 'auto', 'light' or 'night'. */
  theme: 'clearspace.theme',
  /** Text size percentage, 90 to 160. */
  fontSize: 'clearspace.fontSize.v1',
  /** Set once the Getting Started tutorial has been seen. */
  tutorial: 'clearspace.tutorial.v1',
  /** Timestamp of the last exported backup. */
  lastBackup: 'clearspace.lastBackup.v1',
  /** Set once the first-drag hint has been shown. */
  dragHint: 'clearspace.dragHint.v1',
} as const;

export const MATRIX_KEY = STORAGE_KEYS.matrix;

/**
 * Reads a value without throwing. Storage can be blocked entirely (private modes, strict
 * settings), so callers choose what an unavailable store means with `whenUnavailable`.
 */
export function readStorage(key: string, whenUnavailable: string | null = null): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return whenUnavailable;
  }
}

/** Writes a value without throwing. Returns false when the browser refused the write. */
export function writeStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
