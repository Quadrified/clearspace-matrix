import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ResetBoardDialog } from './ResetBoardDialog';

it('guards form submissions and clears confirmation on cancellation', () => {
  const onReset = vi.fn();
  const onClose = vi.fn();
  render(<ResetBoardDialog onClose={onClose} onReset={onReset} />);
  const input = screen.getByLabelText('Type Reset to confirm');
  const form = input.closest('form')!;
  const confirm = screen.getByRole('button', { name: 'Reset board' });
  for (const value of ['', 'reset', 'RESET', ' Reset', 'Reset ']) {
    fireEvent.change(input, { target: { value } });
    expect(confirm).toBeDisabled();
    fireEvent.submit(form);
    expect(onReset).not.toHaveBeenCalled();
  }
  fireEvent.change(input, { target: { value: 'Reset' } });
  expect(confirm).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onClose).toHaveBeenCalledOnce();
  // Even if the closing animation retains this instance, it cannot retain authorization.
  expect(confirm).toBeDisabled();
  fireEvent.change(input, { target: { value: 'Reset' } });
  fireEvent.submit(form);
  expect(onReset).toHaveBeenCalledOnce();
  expect(confirm).toBeDisabled();
});
