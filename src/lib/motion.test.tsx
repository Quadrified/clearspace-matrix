import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { MotionProvider, useMotionSettings } from './motion';
import { Modal } from '../components/Modal';
import { SoftPresence } from '../components/SoftPresence';

function mockPreference() {
  let listener = () => {};
  const media = {
    matches: false,
    addEventListener: (_event: string, fn: () => void) => {
      listener = fn;
    },
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
  vi.stubGlobal('matchMedia', () => media);
  return { media, notify: () => act(() => listener()) };
}
function Probe() {
  const { instant } = useMotionSettings();
  return <output data-testid="motion">{instant ? 'instant' : 'animated'}</output>;
}
function Editor() {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState('');
  return (
    <>
      <SoftPresence>
        {open && (
          <Modal
            key="editor"
            id="motionTestDialog"
            title="Motion draft"
            onClose={() => setOpen(false)}
          >
            <label>
              Draft
              <input value={draft} onChange={(e) => setDraft(e.target.value)} />
            </label>
          </Modal>
        )}
      </SoftPresence>
      <Probe />
    </>
  );
}
afterEach(() => vi.unstubAllEnvs());
it('responds to input modality and live reduced-motion preference changes', () => {
  const { media, notify } = mockPreference();
  render(
    <MotionProvider>
      <Probe />
    </MotionProvider>,
  );
  expect(screen.getByTestId('motion')).toHaveTextContent('animated');
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(screen.getByTestId('motion')).toHaveTextContent('instant');
  fireEvent.pointerDown(document);
  expect(screen.getByTestId('motion')).toHaveTextContent('animated');
  media.matches = true;
  notify();
  expect(screen.getByTestId('motion')).toHaveTextContent('instant');
  fireEvent.pointerDown(document);
  expect(screen.getByTestId('motion')).toHaveTextContent('instant');
});
it('keeps drafts and focus when switching between pointer and keyboard input', async () => {
  vi.stubEnv('MODE', 'development');
  mockPreference();
  const user = userEvent.setup();
  render(
    <MotionProvider>
      <Editor />
    </MotionProvider>,
  );
  const input = screen.getByRole('textbox', { name: 'Draft' });
  await user.type(input, 'Keep this draft');
  expect(input).toHaveFocus();
  fireEvent.pointerDown(input);
  expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(input);
  expect(input).toHaveValue('Keep this draft');
  expect(input).toHaveFocus();
});
it('makes outgoing dialogs inert and removes them after their exit', async () => {
  vi.stubEnv('MODE', 'development');
  mockPreference();
  render(
    <MotionProvider>
      <Editor />
    </MotionProvider>,
  );
  const dialog = screen.getByRole('dialog');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(dialog).toHaveAttribute('inert');
  expect(dialog).toHaveAttribute('aria-hidden', 'true');
  expect(dialog).not.toHaveAttribute('open');
  await waitFor(() => expect(document.getElementById('motionTestDialog')).toBeNull());
});
