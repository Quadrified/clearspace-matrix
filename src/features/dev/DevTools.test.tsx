import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import DevTools from './DevTools';
import type { Matrix } from '../../domain/models';
import { createSamples } from './samples';

test('Remove Dev samples removes them and closes the dialog', async () => {
  const matrix: Matrix = createSamples('2026-10-15');
  const change = vi.fn();
  render(<DevTools matrix={matrix} change={change} notify={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Dev' }));
  fireEvent.click(screen.getByRole('button', { name: 'Remove Dev samples' }));
  expect(change).toHaveBeenCalledWith(expect.any(Function), 'Dev sample tasks removed.');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
