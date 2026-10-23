import { useLayoutEffect } from 'react';
import { readBaseStyles } from '../test/readBaseStyles';
import { fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Modal } from './Modal';
import { MotionProvider } from '../lib/motion';

afterEach(() => {
  document.getElementById('backdrop-regression-style')?.remove();
  document.querySelector('.backdrop-probe')?.remove();
});

it('does not restart the backdrop fade when switching from typing to clicking an input', async () => {
  // jsdom cannot compute pseudo-element styles. Apply the actual global backdrop
  // declarations to an ordinary probe so the same cascade can be measured.
  const css = await readBaseStyles();
  const rules = [...css.matchAll(/^(?:\.keyboard-input )?dialog::backdrop\s*\{[^}]*\}/gm)];
  const style = document.createElement('style');
  style.id = 'backdrop-regression-style';
  style.textContent = rules
    .map(([rule]) => rule.replace('dialog::backdrop', '.backdrop-probe'))
    .join('\n');
  document.head.append(style);
  const probe = document.createElement('div');
  probe.className = 'backdrop-probe';
  document.body.append(probe);
  render(
    <MotionProvider>
      <input aria-label="Focused field" />
    </MotionProvider>,
  );
  const animation = getComputedStyle(probe).animation;
  expect(animation).toContain('backdrop-in');
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(getComputedStyle(probe).animation).toBe(animation);
  fireEvent.pointerDown(document.querySelector('input')!);
  expect(getComputedStyle(probe).animation).toBe(animation);
});

it('opens the native dialog before the browser can paint its mounted content', () => {
  const observed: boolean[] = [];
  function Probe() {
    useLayoutEffect(() => {
      observed.push((document.getElementById('paintDialog') as HTMLDialogElement).open);
    }, []);
    return (
      <Modal id="paintDialog" title="Paint timing" onClose={vi.fn()}>
        <input aria-label="Task" />
      </Modal>
    );
  }
  render(<Probe />);
  expect(observed).toEqual([true]);
});
