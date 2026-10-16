import { useLayoutEffect, useRef } from 'react';
import { Icon } from '../../components/Icon';

export function displayDueDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : value;
}

export function parseDueDate(value: string): string | undefined {
  if (!value) return '';
  const match = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(\d{4})$/.exec(value);
  if (!match || match[3] === '0000') return undefined;
  const iso = `${match[3]}-${match[1]}-${match[2]}`;
  const date = new Date(`${iso}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : undefined;
}

export function DueDateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const text = displayDueDate(value);
  const validDate = parseDueDate(text);
  useLayoutEffect(() => {
    input.current?.setCustomValidity(
      validDate === undefined ? 'Enter a valid date as MM/DD/YYYY.' : '',
    );
  }, [validDate]);
  return (
    <div className="due-date-input">
      <input
        ref={input}
        id="taskDue"
        type="text"
        placeholder="MM/DD/YYYY"
        maxLength={10}
        autoComplete="off"
        spellCheck={false}
        value={text}
        onChange={(event) => onChange(parseDueDate(event.target.value) ?? event.target.value)}
      />
      <span className="due-date-calendar">
        <Icon name="schedule" />
        <input
          type="date"
          aria-label="Choose date from calendar"
          value={validDate ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </div>
  );
}
