import { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useHeaderHeight } from './useHeaderHeight';

function Header() {
  const ref = useRef<HTMLElement>(null);
  useHeaderHeight(ref);
  return <header ref={ref}>Header</header>;
}
it('updates sticky offsets when the header wraps and releases observation on unmount', () => {
  let resize = () => {};
  const observe = vi.fn(),
    disconnect = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class implements ResizeObserver {
      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
      constructor(callback: ResizeObserverCallback) {
        resize = () => callback([], this);
      }
    },
  );
  const bounds = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(0, 0, 320, 88));
  const view = render(<Header />);
  expect(observe).toHaveBeenCalledWith(screen.getByRole('banner'));
  expect(document.documentElement.style.getPropertyValue('--app-header-height')).toBe('88px');
  bounds.mockReturnValue(new DOMRect(0, 0, 320, 160));
  act(resize);
  expect(document.documentElement.style.getPropertyValue('--app-header-height')).toBe('160px');
  view.unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(document.documentElement.style.getPropertyValue('--app-header-height')).toBe('');
});
it('remeasures on window resize when ResizeObserver is unavailable', () => {
  vi.stubGlobal('ResizeObserver', undefined);
  const bounds = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(0, 0, 320, 80));
  render(<Header />);
  bounds.mockReturnValue(new DOMRect(0, 0, 640, 120));
  fireEvent(window, new Event('resize'));
  expect(document.documentElement.style.getPropertyValue('--app-header-height')).toBe('120px');
});
