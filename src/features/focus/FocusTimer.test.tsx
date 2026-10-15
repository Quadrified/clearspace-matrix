import { act, fireEvent, render, screen } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import { FocusTimer } from './FocusTimer';
import { formatTime, parseTime, remainingAt } from './time';
it('validates clock edits and calculates from wall-clock time', () => {
  expect(parseTime('2:30')).toBe(150);
  expect(parseTime('2')).toBe(120);
  for (const value of ['0', '2:60', '241', '-3', 'foo']) expect(parseTime(value)).toBeNull();
  expect(formatTime(61)).toBe('01:01');
  expect(remainingAt(10500, 1000)).toBe(10);
  expect(remainingAt(1000, 2000)).toBe(0);
});
it('starts, closes the popup and keeps updating the Focus button', () => {
  vi.useFakeTimers();
  render(<FocusTimer tasks={[]} notify={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Focus' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start focus' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole('button', { name: /Focus 24:55/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Focus/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole('button', { name: /Focus 24:50/ })).toBeInTheDocument();
});
it('double-click editing changes remaining time but Reset uses the selected session', () => {
  render(<FocusTimer tasks={[]} notify={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Focus' }));
  fireEvent.doubleClick(screen.getByRole('timer'));
  fireEvent.change(screen.getByLabelText('Remaining time'), { target: { value: '2:30' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save time' }));
  expect(screen.getByRole('timer')).toHaveTextContent('02:30');
  expect(screen.getByRole('combobox', { name: 'Session length' })).toHaveTextContent('25 minutes');
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(screen.getByRole('timer')).toHaveTextContent('25:00');
});
it('Escape cancels an edit without closing the timer controls', () => {
  render(<FocusTimer tasks={[]} notify={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Focus' }));
  fireEvent.doubleClick(screen.getByRole('timer'));
  fireEvent.change(screen.getByLabelText('Remaining time'), { target: { value: '3' } });
  fireEvent.keyDown(screen.getByLabelText('Remaining time'), { key: 'Escape' });
  expect(screen.getByRole('timer')).toHaveTextContent('25:00');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
it('editing a running timer resumes the new time and closes the popup', () => {
  vi.useFakeTimers();
  render(<FocusTimer tasks={[]} notify={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Focus' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start focus' }));
  act(() => vi.advanceTimersByTime(1000));
  fireEvent.click(screen.getByRole('button', { name: /Focus/ }));
  fireEvent.doubleClick(screen.getByRole('timer'));
  fireEvent.change(screen.getByLabelText('Remaining time'), { target: { value: '1:05' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save time' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole('button', { name: /Focus 01:00/ })).toBeInTheDocument();
});
it('a backdrop click dismisses the controls without stopping the running timer', () => {
  vi.useFakeTimers();
  render(<FocusTimer tasks={[]} notify={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Focus' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start focus' }));
  fireEvent.click(screen.getByRole('button', { name: /Focus/ }));
  const dialog = screen.getByRole('dialog');
  vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
    left: 100,
    right: 500,
    top: 100,
    bottom: 500,
    width: 400,
    height: 400,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  });
  fireEvent.pointerDown(dialog, { clientX: 1, clientY: 1 });
  fireEvent.click(dialog, { clientX: 1, clientY: 1 });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole('button', { name: /Focus 24:55/ })).toBeInTheDocument();
});
