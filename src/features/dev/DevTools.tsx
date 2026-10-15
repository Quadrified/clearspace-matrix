import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { localDate, mergeMatrix } from '../../domain/matrix';
import type { Matrix } from '../../domain/models';
import { createSamples } from './samples';

type Props = {
  matrix: Matrix;
  change: (update: (matrix: Matrix) => Matrix, message: string) => void;
  notify: (message: string) => void;
};

export default function DevTools({ matrix, change, notify }: Props) {
  const [open, setOpen] = useState(false);
  function generate() {
    try {
      const samples = createSamples(localDate());
      change((current) => mergeMatrix(current, samples), '24 Dev sample tasks added.');
      setOpen(false);
    } catch {
      notify(
        'Could not add samples. Export a backup and check the board size before trying again.',
      );
    }
  }
  return (
    <>
      <button className="btn" id="devButton" onClick={() => setOpen(true)}>
        Dev
      </button>
      {open && (
        <Modal id="devDialog" title="Local development tools" onClose={() => setOpen(false)}>
          <p className="quiet">
            Only available during local development. Adds six tasks each for Work, Personal, Health,
            and Learning. Sample tasks save in this browser.
          </p>
          <button className="btn primary" onClick={generate}>
            Add 24 sample tasks
          </button>
          <button
            className="btn"
            disabled={!matrix.tasks.some((task) => task.isDevSample)}
            onClick={() =>
              change(
                (current) => ({
                  ...current,
                  tasks: current.tasks.filter((task) => !task.isDevSample),
                }),
                'Dev sample tasks removed.',
              )
            }
          >
            Remove Dev samples
          </button>
        </Modal>
      )}
    </>
  );
}
