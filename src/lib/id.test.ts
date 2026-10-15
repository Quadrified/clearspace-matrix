import { afterEach, expect, test, vi } from 'vitest';
import { newId } from './id';

afterEach(() => vi.unstubAllGlobals());

test('uses crypto.randomUUID when it exists', () => {
  vi.stubGlobal('crypto', { randomUUID: () => 'native-id' });
  expect(newId()).toBe('native-id');
});

test('falls back to a v4 UUID over plain HTTP, where randomUUID is missing', () => {
  vi.stubGlobal('crypto', {
    getRandomValues: (bytes: Uint8Array) => bytes.fill(255),
  });
  expect(newId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('still returns unique ids with no crypto at all', () => {
  vi.stubGlobal('crypto', undefined);
  expect(newId()).not.toBe(newId());
});
