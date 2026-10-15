import type { RefObject } from 'react';
import { Icon } from '../../components/Icon';

export function AppFooter({
  importRef,
  onExport,
  onImport,
  onClearCompleted,
}: {
  importRef: RefObject<HTMLInputElement | null>;
  onExport: () => void;
  onImport: (file?: File) => void;
  onClearCompleted: () => void;
}) {
  return (
    <footer>
      <span>
        <Icon name="lock" /> Your tasks stay in this browser. Export a backup to keep them safe.
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
        <button className="iconbtn" onClick={onClearCompleted}>
          Clear completed
        </button>
      </div>
    </footer>
  );
}
