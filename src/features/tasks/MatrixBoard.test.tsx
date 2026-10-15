import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../../App';
import { MATRIX_KEY } from '../../domain/matrix';

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
  let data = '';
  const dataTransfer = {
    setData: (_type: string, value: string) => {
      data = value;
    },
    getData: () => data,
    effectAllowed: '',
    dropEffect: '',
  };
  return { source, destination, dataTransfer, animate };
}
afterEach(() => {
  vi.restoreAllMocks();
  delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
});
it('highlights the destination, animates the move, saves it, and supports Undo', () => {
  const { source, destination, dataTransfer, animate } = setup();
  fireEvent.dragStart(source, { dataTransfer });
  expect(source).toHaveClass('is-dragging');
  fireEvent.dragOver(destination, { dataTransfer });
  expect(destination).toHaveClass('dragover');
  fireEvent.drop(destination, { dataTransfer });
  expect(destination).not.toHaveClass('dragover');
  expect(destination).toContainElement(screen.getByRole('button', { name: 'Edit Move this task' }));
  expect(animate).toHaveBeenCalledOnce();
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks[0].q).toBe('schedule');
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks[0].q).toBe('do');
});
it('moves data without positional animation when reduced motion is requested', () => {
  const { source, destination, dataTransfer, animate } = setup(true);
  fireEvent.dragStart(source, { dataTransfer });
  fireEvent.drop(destination, { dataTransfer });
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks[0].q).toBe('schedule');
  expect(animate).not.toHaveBeenCalled();
});
it('clears feedback when a drag is cancelled', () => {
  const { source, destination, dataTransfer } = setup();
  fireEvent.dragStart(source, { dataTransfer });
  fireEvent.dragOver(destination, { dataTransfer });
  fireEvent.dragEnd(source, { dataTransfer });
  expect(source).not.toHaveClass('is-dragging');
  expect(destination).not.toHaveClass('dragover');
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks[0].q).toBe('do');
});
