import { useRef, useState } from 'react';
import { mergeMatrix, parseBackup, serializeMatrix } from '../../domain/serialization';
import type { Matrix } from '../../domain/models';
import { datedFilename, downloadJson } from '../../lib/download';
import { readStorage, STORAGE_KEYS, writeStorage } from '../../state/storage';
import type { ChangeMatrix } from '../../state/useMatrix';

// A UTF-8 character is at most 4 bytes; parseBackup enforces the exact 5,000,000-character cap.
const MAX_BACKUP_BYTES = 5_000_000 * 4;

function readLastBackup() {
  const value = Number(readStorage(STORAGE_KEYS.lastBackup));
  return Number.isFinite(value) && value > 0 ? value : 0;
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
  change: ChangeMatrix;
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
    // If storage refuses the timestamp, the backup file was still downloaded.
    writeStorage(STORAGE_KEYS.lastBackup, String(now));
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
