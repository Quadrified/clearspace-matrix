import type { RefObject } from 'react';
import { Icon } from '../../components/Icon';

const DAY = 86_400_000;

function backupDue(lastBackup: number, taskCount: number) {
  return taskCount >= 5 && (!lastBackup || Date.now() - lastBackup > 7 * DAY);
}

function backupText(lastBackup: number, taskCount: number) {
  if (!lastBackup) return taskCount ? 'Last backup: never.' : '';
  const days = Math.floor((Date.now() - lastBackup) / DAY);
  return days < 1
    ? 'Last backup: today.'
    : `Last backup: ${days} ${days === 1 ? 'day' : 'days'} ago.`;
}

export function AppFooter({
  importRef,
  lastBackup,
  taskCount,
  onExport,
  onImport,
  onClearCompleted,
}: {
  importRef: RefObject<HTMLInputElement | null>;
  lastBackup: number;
  taskCount: number;
  onExport: () => void;
  onImport: (file?: File) => void;
  onClearCompleted: () => void;
}) {
  return (
    <footer>
      <span>
        <Icon name="lock" /> Your tasks stay in this browser. Export a backup to keep them safe.{' '}
        <span className={`backup-state${backupDue(lastBackup, taskCount) ? ' due' : ''}`}>
          {backupText(lastBackup, taskCount)}
        </span>
      </span>
      <div>
        <button className="iconbtn" onClick={onExport}>
          Export backup
        </button>
        <button className="iconbtn" onClick={() => importRef.current?.click()}>
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
        <button className="iconbtn danger" onClick={onClearCompleted}>
          Clear completed
        </button>
      </div>
    </footer>
  );
}
