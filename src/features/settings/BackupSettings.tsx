import type { RefObject } from 'react';
import { Icon } from '../../components/Icon';

const DAY = 86_400_000;

function backupDue(lastBackup: number, taskCount: number) {
  return taskCount >= 5 && (!lastBackup || Date.now() - lastBackup > 7 * DAY);
}

function backupText(lastBackup: number) {
  if (!lastBackup) return 'Last backup: never.';
  const days = Math.floor((Date.now() - lastBackup) / DAY);
  return days < 1
    ? 'Last backup: today.'
    : `Last backup: ${days} ${days === 1 ? 'day' : 'days'} ago.`;
}

export function BackupSettings({
  importRef,
  lastBackup,
  taskCount,
  onExport,
  onImport,
}: {
  importRef: RefObject<HTMLInputElement | null>;
  lastBackup: number;
  taskCount: number;
  onExport: () => void;
  onImport: (file?: File) => void;
}) {
  return (
    <section className="settings-backup" aria-label="Backups and data">
      <p>
        <Icon name="lock" /> Stored in this browser. Export to back up.{' '}
        <span className={`backup-state${backupDue(lastBackup, taskCount) ? ' due' : ''}`}>
          {backupText(lastBackup)}
        </span>
      </p>
      <div className="settings-actions">
        <button className="iconbtn" onClick={onExport}>
          <Icon name="download" />
          Export backup
        </button>
        <button className="iconbtn" onClick={() => importRef.current?.click()}>
          <Icon name="upload" />
          Import
        </button>
        <input
          type="file"
          accept="application/json,.json"
          ref={importRef}
          hidden
          onChange={(e) => {
            onImport(e.target.files?.[0]);
          }}
        />
      </div>
    </section>
  );
}
