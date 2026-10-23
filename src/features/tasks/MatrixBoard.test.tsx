import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../../app/App';
import { MATRIX_KEY } from '../../state/storage';

function setup(reducedMotion = false) {
  localStorage.setItem('clearspace.tutorial.v1', 'seen');
  localStorage.setItem(
    MATRIX_KEY,
    JSON.stringify({
      version: 2,
      projects: [],
      tasks: [
        {
          id: 'move-me',
          title: 'Move this task',
          q: 'do',
          done: false,
          notes: '',
          category: 'Work',
          owner: '',
          due: '',
          created: 1,
        },
      ],
    }),
  );
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
  const animate = vi.fn();
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    return {
      left: this.closest('[data-q="schedule"]') ? 400 : 0,
      top: 0,
      width: 200,
      height: 50,
    } as DOMRect;
  });
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
  render(<App />);
  const source = screen.getByRole('button', { name: 'Edit Move this task' }).closest('article')!;
  const destination = screen.getByRole('region', { name: 'Schedule, Important, not urgent' });
  return { source, destination, animate };
}
/** Presses on the card and moves the mouse over `over` (jsdom has no layout, so hit-testing is stubbed). */
function startDrag(source: HTMLElement, over: Element) {
  document.elementFromPoint = () => over;
  fireEvent.pointerDown(source, { pointerType: 'mouse', button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 60, clientY: 40 });
}
/** Releases the mouse; browsers follow with a click, which the board swallows after a drag. */
function endDrag() {
  fireEvent.pointerUp(window);
  fireEvent.click(document.body);
}
afterEach(() => {
  vi.restoreAllMocks();
  delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  delete (document as Partial<Document>).elementFromPoint;
});
it('highlights the destination, saves the move, and supports Undo', () => {
  const { source, destination } = setup();
  startDrag(source, destination);
  expect(source).toHaveClass('is-dragging');
  expect(destination).toHaveClass('dragover');
  expect(document.documentElement).toHaveClass('card-dragging');
  endDrag();
  expect(destination).not.toHaveClass('dragover');
  expect(document.documentElement).not.toHaveClass('card-dragging');
  expect(document.querySelector('.drag-ghost')).not.toBeInTheDocument();
  expect(destination).toContainElement(screen.getByRole('button', { name: 'Edit Move this task' }));
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks[0].q).toBe('schedule');
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks[0].q).toBe('do');
});
it('opens the editor on a plain click but not after a drag', () => {
  const { source, destination } = setup();
  const card = screen.getByRole('button', { name: 'Edit Move this task' });
  startDrag(source, document.body);
  fireEvent.pointerUp(window);
  fireEvent.click(card);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(destination).not.toContainElement(card);
  fireEvent.pointerDown(source, { pointerType: 'mouse', button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(window);
  fireEvent.click(card);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
it('moves data without positional animation when reduced motion is requested', () => {
  const { source, destination, animate } = setup(true);
  startDrag(source, destination);
  endDrag();
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks[0].q).toBe('schedule');
  expect(animate).not.toHaveBeenCalled();
});
it('clears feedback when a drag is cancelled with Escape', () => {
  const { source, destination } = setup();
  startDrag(source, destination);
  fireEvent.keyDown(document.body, { key: 'Escape' });
  endDrag();
  expect(source).not.toHaveClass('is-dragging');
  expect(destination).not.toHaveClass('dragover');
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks[0].q).toBe('do');
});

it('celebrates completing the last active task, dismisses after four seconds, and can celebrate again', () => {
  vi.useFakeTimers();
  setup();
  expect(screen.queryByRole('status', { name: 'Quadrant cleared' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Complete Move this task' }), { detail: 1 });
  const celebration = screen.getByRole('status', { name: 'Quadrant cleared' });
  expect(celebration).toHaveTextContent('Do first cleared!');
  expect(celebration).toHaveClass('celebrate-motion');
  act(() => {
    vi.advanceTimersByTime(4000);
  });
  expect(screen.queryByRole('status', { name: 'Quadrant cleared' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Complete Move this task' }));
  expect(screen.getByRole('status', { name: 'Quadrant cleared' })).not.toHaveClass(
    'celebrate-motion',
  );
});
it('cancels a celebration when Undo reopens the task', () => {
  setup();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Complete Move this task' }));
  expect(screen.getByRole('status', { name: 'Quadrant cleared' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.queryByRole('status', { name: 'Quadrant cleared' })).not.toBeInTheDocument();
});
it('does not celebrate a quadrant cleared by moving a task', () => {
  const { source, destination } = setup();
  startDrag(source, destination);
  endDrag();
  expect(screen.queryByRole('status', { name: 'Quadrant cleared' })).not.toBeInTheDocument();
});
it('does not celebrate finishing only the visible tasks while another active task is filtered out', () => {
  setup();
  const data = JSON.parse(localStorage.getItem(MATRIX_KEY)!);
  data.tasks.push({ ...data.tasks[0], id: 'hidden', title: 'Hidden task', category: 'Health' });
  fireEvent(
    window,
    new StorageEvent('storage', { key: MATRIX_KEY, newValue: JSON.stringify(data) }),
  );
  fireEvent.change(screen.getByRole('textbox', { name: 'Find a task' }), {
    target: { value: 'Move this task' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Complete Move this task' }));
  expect(screen.queryByRole('status', { name: 'Quadrant cleared' })).not.toBeInTheDocument();
});
