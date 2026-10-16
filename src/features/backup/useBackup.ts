import { useRef, useState } from 'react';
import { mergeMatrix, parseBackup, serializeMatrix } from '../../domain/matrix';
import type { Matrix } from '../../domain/models';
import { datedFilename, downloadJson } from '../../lib/download';

// A UTF-8 character is at most 4 bytes; parseBackup enforces the exact 5,000,000-character cap.
const MAX_BACKUP_BYTES = 5_000_000 * 4;
const BACKUP_KEY = 'clearspace.lastBackup.v1';

function readLastBackup() {
  try {
    const value = Number(localStorage.getItem(BACKUP_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function useBackup({
  matrix,
  rawStored,
  storageError,
  change,
  notify,
}: {
  matrix: Matrix;
  rawStored: string;
  storageError: string;
  change: (update: (m: Matrix) => Matrix, message: string) => void;
  notify: (message: string) => void;
}) {
  const importRef = useRef<HTMLInputElement>(null);
  const [lastBackup, setLastBackup] = useState(readLastBackup);
  function exportBackup() {
    // When saved data could not be read, the board on screen is empty: hand back the original text.
    if (storageError && rawStored) downloadJson(datedFilename('clearspace-recovery'), rawStored);
    else downloadJson(datedFilename('clearspace'), serializeMatrix(matrix));
    const now = Date.now();
    setLastBackup(now);
    try {
      localStorage.setItem(BACKUP_KEY, String(now));
    } catch {
      /* The backup file was still downloaded. */
    }
    notify('Backup exported.');
  }
  async function importBackup(file?: File) {
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw Error('Backup too large');
      const incoming = parseBackup(await file.text());
      change((m) => mergeMatrix(m, incoming), 'Backup imported.');
    } catch {
      notify('This backup could not be imported. Check that it is a Clearspace JSON backup.');
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  }
  return { importRef, exportBackup, importBackup, lastBackup };
}
