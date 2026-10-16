import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useToday } from './useToday';

afterEach(() => vi.useRealTimers());

test('rolls over to the next day at midnight without a reload', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 15, 23, 59, 30));
  const { result } = renderHook(() => useToday());
  expect(result.current).toBe('2026-10-15');
  act(() => {
    vi.advanceTimersByTime(60_000);
  });
  expect(result.current).toBe('2026-10-16');
});

test('refreshes when the tab becomes visible again', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 15, 12));
  const { result } = renderHook(() => useToday());
  vi.setSystemTime(new Date(2026, 9, 17, 8));
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(result.current).toBe('2026-10-17');
});
