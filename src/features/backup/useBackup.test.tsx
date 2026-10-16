import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { emptyMatrix } from '../../domain/models';
import { useBackup } from './useBackup';

// jsdom's Blob has no text(), so read it the old way.
const readBlob = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });

function captureDownload() {
  const blobs: Blob[] = [];
  const names: string[] = [];
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: (blob: Blob) => {
      blobs.push(blob);
      return 'blob:test';
    },
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    names.push(this.download);
  });
  return { blobs, names };
}
afterEach(() => vi.restoreAllMocks());

it('exports the board as a normal backup', async () => {
  const { blobs, names } = captureDownload();
  const notify = vi.fn();
  const { result } = renderHook(() =>
    useBackup({ matrix: emptyMatrix, rawStored: '', storageError: '', change: vi.fn(), notify }),
  );
  act(() => result.current.exportBackup());
  expect(names[0]).toMatch(/^clearspace-\d{4}-\d{2}-\d{2}\.json$/);
  expect(JSON.parse(await readBlob(blobs[0]!))).toMatchObject({
    version: 2,
    tasks: [],
    projects: [],
  });
  expect(notify).toHaveBeenCalledWith('Backup exported.');
});

it('exports the original unreadable data when saved tasks could not be read', async () => {
  const { blobs, names } = captureDownload();
  const { result } = renderHook(() =>
    useBackup({
      matrix: emptyMatrix,
      rawStored: '{"tasks": broken',
      storageError: 'Saved tasks could not be read.',
      change: vi.fn(),
      notify: vi.fn(),
    }),
  );
  act(() => result.current.exportBackup());
  expect(names[0]).toMatch(/^clearspace-recovery-/);
  expect(await readBlob(blobs[0]!)).toBe('{"tasks": broken');
});

it('rejects an oversized file before reading it', async () => {
  const notify = vi.fn();
  const change = vi.fn();
  const { result } = renderHook(() =>
    useBackup({ matrix: emptyMatrix, rawStored: '', storageError: '', change, notify }),
  );
  const big = new File(['{}'], 'big.json');
  Object.defineProperty(big, 'size', { value: 100_000_000 });
  const text = vi.fn(() => Promise.resolve('{}'));
  Object.defineProperty(big, 'text', { value: text });
  await act(() => result.current.importBackup(big));
  expect(text).not.toHaveBeenCalled();
  expect(change).not.toHaveBeenCalled();
  expect(notify).toHaveBeenCalledWith(expect.stringMatching(/could not be imported/));
});
