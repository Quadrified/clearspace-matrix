import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MATRIX_KEY } from '../state/storage';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('render failed');
}
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));
afterEach(() => vi.restoreAllMocks());

it('renders its children when nothing fails', () => {
  render(
    <ErrorBoundary>
      <p>All good</p>
    </ErrorBoundary>,
  );
  expect(screen.getByText('All good')).toBeInTheDocument();
});

it('shows a recovery screen with a way to download saved data after a render error', () => {
  localStorage.setItem(MATRIX_KEY, '{"saved":true}');
  const created: Blob[] = [];
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: (blob: Blob) => (created.push(blob), 'blob:test'),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
  fireEvent.click(screen.getByRole('button', { name: 'Download saved data' }));
  expect(created).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
});

it('omits the download button when there is nothing saved', () => {
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>,
  );
  expect(screen.queryByRole('button', { name: 'Download saved data' })).not.toBeInTheDocument();
});
