import { useState } from 'react';
import { Modal } from '../../components/Modal';

export function ResetBoardDialog({
  onClose,
  onReset,
}: {
  onClose: () => void;
  onReset: () => void;
}) {
  const [confirmation, setConfirmation] = useState('');
  const confirmed = confirmation === 'Reset';
  function close() {
    setConfirmation('');
    onClose();
  }
  return (
    <Modal id="resetDialog" title="Need a fresh start?" onClose={close}>
      <p>
        All tasks and projects will be cleared. Your labels and appearance preferences will stay.
        You can undo this reset.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (confirmed) {
            setConfirmation('');
            onReset();
          }
        }}
      >
        <label className="field">
          Type Reset to confirm
          <input
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={close}>
            Cancel
          </button>
          <button type="submit" className="btn reset-confirm" disabled={!confirmed}>
            Reset board
          </button>
        </div>
      </form>
    </Modal>
  );
}
