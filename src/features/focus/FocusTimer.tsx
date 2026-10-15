import { useEffect, useRef, useState } from 'react';
import type { Task } from '../../domain/models';
import { Modal } from '../../components/Modal';
import { Icon } from '../../components/Icon';
import { formatTime, parseTime, remainingAt } from './time';
export function FocusTimer({ tasks, notify }: { tasks: Task[]; notify: (s: string) => void }) {
  const [open, setOpen] = useState(false),
    [duration, setDuration] = useState('25'),
    [custom, setCustom] = useState('25'),
    [selected, setSelected] = useState(''),
    [remaining, setRemaining] = useState(1500),
    [running, setRunning] = useState(false),
    [started, setStarted] = useState(false),
    [editing, setEditing] = useState(false),
    [input, setInput] = useState(''),
    [error, setError] = useState('');
  const deadline = useRef(0),
    editSnapshot = useRef({ remaining: 1500, running: false });
  const notifyRef = useRef(notify);
  notifyRef.current = notify;
  useEffect(() => {
    if (!running) return;
    function tick() {
      const left = remainingAt(deadline.current);
      setRemaining(left);
      if (!left) {
        setRunning(false);
        notifyRef.current('Focus session complete. Take a moment to breathe.');
        try {
          const context = new AudioContext(),
            osc = context.createOscillator(),
            gain = context.createGain();
          osc.connect(gain);
          gain.connect(context.destination);
          gain.gain.setValueAtTime(0.08, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);
          osc.start();
          osc.stop(context.currentTime + 0.6);
          osc.onended = () => {
            void context.close();
          };
        } catch {
          /* Sound is optional. */
        }
      }
    }
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [running]);
  const sessionMinutes = duration === 'custom' ? Number(custom) : Number(duration);
  function validSession() {
    return Number.isInteger(sessionMinutes) && sessionMinutes >= 1 && sessionMinutes <= 240;
  }
  function start(seconds = remaining) {
    if (!seconds || !validSession()) {
      setError('Choose a whole number from 1 to 240 minutes.');
      return;
    }
    deadline.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    setRunning(true);
    setStarted(true);
    setOpen(false);
  }
  function reset() {
    if (!validSession()) {
      setError('Choose a whole number from 1 to 240 minutes.');
      return;
    }
    setRunning(false);
    setStarted(false);
    setRemaining(sessionMinutes * 60);
    setError('');
  }
  function beginEdit() {
    const left = running ? remainingAt(deadline.current) : remaining;
    editSnapshot.current = { remaining: left, running };
    setRunning(false);
    setRemaining(left);
    setInput(formatTime(left));
    setError('');
    setEditing(true);
  }
  function cancelEdit() {
    setEditing(false);
    setError('');
    setRemaining(editSnapshot.current.remaining);
    if (editSnapshot.current.running) {
      deadline.current = Date.now() + editSnapshot.current.remaining * 1000;
      setRunning(true);
    }
  }
  function close() {
    if (editing) cancelEdit();
    setOpen(false);
  }
  return (
    <>
      <button
        id="focusButton"
        className={`btn${started ? ' focus-active' : ''}`}
        onClick={() => setOpen(true)}
      >
        <Icon name="clock" />
        Focus
        {started && (
          <span id="focusRemaining">
            {formatTime(remaining)}
            {!running && remaining > 0 ? ' · Paused' : ''}
          </span>
        )}
      </button>
      {open && (
        <Modal id="timerDialog" title="One thing at a time." onClose={close} backdropClose>
          <p className="quiet">Choose a task, give it your attention, and let the rest wait.</p>
          <label className="field">
            Focus on
            <select
              value={selected}
              disabled={running || editing}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">An uninterrupted work session</option>
              {tasks
                .filter((t) => !t.done)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            Session length
            <select
              value={duration}
              disabled={running || editing}
              onChange={(e) => {
                setDuration(e.target.value);
                setRemaining(
                  (e.target.value === 'custom' ? Number(custom) : Number(e.target.value)) * 60,
                );
                setStarted(false);
                setError('');
              }}
            >
              <option value="25">25 minutes</option>
              <option value="15">15 minutes</option>
              <option value="50">50 minutes</option>
              <option value="5">5 minute break</option>
              <option value="custom">Custom duration</option>
            </select>
          </label>
          {duration === 'custom' && (
            <label className="field">
              Minutes
              <input
                type="number"
                min={1}
                max={240}
                step={1}
                disabled={running || editing}
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value);
                  setRemaining(Number(e.target.value) * 60);
                  setStarted(false);
                }}
              />
              <span className="hint">Choose a whole number from 1 to 240 minutes.</span>
            </label>
          )}
          {editing ? (
            <form
              id="clockEditor"
              onSubmit={(e) => {
                e.preventDefault();
                const seconds = parseTime(input);
                if (seconds === null) {
                  setError('Enter minutes or MM:SS, up to 240 minutes.');
                  return;
                }
                setRemaining(seconds);
                setEditing(false);
                setError('');
                if (editSnapshot.current.running) start(seconds);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  cancelEdit();
                }
              }}
            >
              <label className="field">
                Remaining time
                <input
                  id="clockInput"
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="25:00"
                />
              </label>
              <div className="timer-actions">
                <button className="btn" type="button" onClick={cancelEdit}>
                  Cancel
                </button>
                <button className="btn primary">Save time</button>
              </div>
            </form>
          ) : (
            <>
              <div
                id="clock"
                className="timer-number"
                role="timer"
                tabIndex={0}
                aria-label="Remaining time. Double-click or press Enter to edit."
                onDoubleClick={beginEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    beginEdit();
                  }
                }}
              >
                {formatTime(Number.isFinite(remaining) ? remaining : 0)}
              </div>
              <button className="iconbtn edit-time-link" onClick={beginEdit}>
                Edit time
              </button>
              <p className="quiet" style={{ textAlign: 'center' }}>
                {running
                  ? 'You have space for just this one thing.'
                  : started
                    ? 'Ready to continue.'
                    : 'Ready when you are.'}
              </p>
              <div className="timer-actions">
                <button
                  className="btn primary"
                  onClick={() => {
                    if (running) {
                      setRemaining(remainingAt(deadline.current));
                      setRunning(false);
                    } else start();
                  }}
                >
                  {running ? 'Pause' : started && remaining ? 'Resume' : 'Start focus'}
                </button>
                <button className="btn" onClick={reset}>
                  Reset
                </button>
              </div>
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </Modal>
      )}
    </>
  );
}
