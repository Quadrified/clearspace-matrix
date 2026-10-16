import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { DueDateInput, displayDueDate, parseDueDate } from './DueDateInput';
import App from '../../App';
import { MATRIX_KEY, parseStoredMatrix } from '../../domain/matrix';

it('displays month/day/year and validates real calendar dates', () => {
  expect(displayDueDate('2026-10-15')).toBe('10/15/2026');
  expect(parseDueDate('10/15/2026')).toBe('2026-10-15');
  expect(parseDueDate('02/29/2024')).toBe('2024-02-29');
  expect(parseDueDate('')).toBe('');
  for (const value of ['15/10/2026', '02/29/2026', '04/31/2026', '10/15/', '00/15/2026'])
    expect(parseDueDate(value)).toBeUndefined();
});

it('synchronizes typing, calendar selection, quick dates and clearing without stale validation', () => {
  function Example() {
    const [value, setValue] = useState('2026-10-15');
    return (
      <>
        <label htmlFor="taskDue">Due date</label>
        <DueDateInput value={value} onChange={setValue} />
        <button onClick={() => setValue('2026-10-15')}>Today</button>
      </>
    );
  }
  render(<Example />);
  const input = screen.getByLabelText('Due date');
  expect(input).toHaveValue('10/15/2026');
  fireEvent.change(input, { target: { value: '02/30/2026' } });
  expect(input).toBeInvalid();
  fireEvent.click(screen.getByRole('button', { name: 'Today' }));
  expect(input).toHaveValue('10/15/2026');
  expect(input).toBeValid();
  fireEvent.change(screen.getByLabelText('Choose date from calendar'), {
    target: { value: '2026-12-31' },
  });
  expect(input).toHaveValue('12/31/2026');
  fireEvent.change(input, { target: { value: '' } });
  expect(input).toHaveValue('');
  expect(input).toBeValid();
});

it('saves typed US dates as the existing ISO storage format and reopens them formatted', () => {
  localStorage.setItem('clearspace.tutorial.v1', 'seen');
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Add your first task' }));
  fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Review budget' } });
  fireEvent.change(screen.getByLabelText(/Due date/), { target: { value: '10/30/2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  expect(parseStoredMatrix(localStorage.getItem(MATRIX_KEY)).tasks[0]?.due).toBe('2026-10-30');
  fireEvent.click(screen.getByRole('button', { name: 'Edit Review budget' }));
  expect(screen.getByLabelText(/Due date/)).toHaveValue('10/30/2026');
});
