import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { vi, it, expect, beforeEach } from 'vitest';
import App from './App';
import { MATRIX_KEY } from './domain/matrix';
beforeEach(() => {
  localStorage.setItem('clearspace.tutorial.v1', 'seen');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ authorized: false }) }),
  );
});
it('adds a Work task, saves it in the existing storage format, and undoes it', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a task to Do first' }));
  expect(screen.getByLabelText('Category')).toHaveValue('Work');
  fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Ship the React app' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  expect(screen.getByText('Ship the React app')).toBeInTheDocument();
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks[0].title).toBe('Ship the React app'),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.queryByText('Ship the React app')).not.toBeInTheDocument();
});
it('preserves a draft when creating its project', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a task to Do first' }));
  fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Launch checklist' } });
  fireEvent.click(screen.getByRole('button', { name: 'Manage projects' }));
  fireEvent.change(screen.getByLabelText('New project'), { target: { value: 'Clearspace' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add project' }));
  expect(screen.getByLabelText('Task')).toHaveValue('Launch checklist');
  expect(screen.getByLabelText('Project')).not.toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  expect(screen.getAllByText('Clearspace').length).toBeGreaterThan(0);
});
it('keeps existing labels and dark appearance, and does not expose editable branding', () => {
  localStorage.setItem('clearspace.theme', 'night');
  render(<App />);
  expect(document.body).toHaveClass('night');
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit labels' }));
  expect(screen.queryByLabelText('Page title')).not.toBeInTheDocument();
  expect(screen.getAllByLabelText('Title')).toHaveLength(4);
});
it('all notifications dismiss after ten seconds, including Undo', () => {
  vi.useFakeTimers();
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Clear completed' }));
  expect(screen.getByRole('status')).toHaveTextContent('Completed tasks cleared.');
  act(() => vi.advanceTimersByTime(9999));
  expect(screen.getByRole('status')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
it('reset confirms and clears tasks and projects, and Undo restores both', () => {
  localStorage.setItem(
    MATRIX_KEY,
    JSON.stringify({
      version: 2,
      projects: [{ id: 'p', name: 'Keep me' }],
      tasks: [
        {
          id: 't',
          title: 'Task to clear',
          q: 'do',
          done: false,
          notes: '',
          owner: '',
          category: 'Work',
          due: '',
          created: 1,
          projectId: 'p',
        },
      ],
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reset board' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('All tasks and projects will be cleared.');
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset board' }));
  expect(screen.queryByText('Task to clear')).not.toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Keep me' })).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!)).toMatchObject({ tasks: [], projects: [] });
  expect(screen.getByRole('progressbar', { name: 'Completion' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByText('Task to clear')).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Keep me' })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks[0].projectId).toBe('p');
});
it('does not expose Dev to anonymous visitors', async () => {
  render(<App />);
  await act(async () => {});
  expect(screen.queryByRole('button', { name: 'Dev' })).not.toBeInTheDocument();
});

it('does not overwrite unreadable saved data when working in memory', async () => {
  localStorage.setItem(MATRIX_KEY, 'corrupt-original');
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a task to Do first' }));
  fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Recovery task' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  await act(async () => {});
  expect(localStorage.getItem(MATRIX_KEY)).toBe('corrupt-original');
  expect(screen.getByText('Recovery task')).toBeInTheDocument();
});
it('keeps custom quadrant titles, icons and text size from the original app', () => {
  localStorage.setItem(
    'clearspace.labels.v1',
    JSON.stringify({
      title: 'Old editable marketing title',
      quadrants: {
        do: { title: 'Now', subtitle: 'Custom priority', icon: 'star' },
        schedule: { title: 'Plan', subtitle: 'Later' },
        delegate: { title: 'Ask', subtitle: 'Help' },
        eliminate: { title: 'Skip', subtitle: 'Less' },
      },
    }),
  );
  localStorage.setItem('clearspace.fontSize.v1', '130');
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Now' })).toBeInTheDocument();
  expect(screen.getByText('Custom priority')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Make room for what matters.' })).toBeInTheDocument();
  expect(document.documentElement.style.getPropertyValue('--text-scale')).toBe('1.3');
});
it('only offers examples at the final tutorial step and does not duplicate them on replay', () => {
  render(<App />);
  function help() {
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
  }
  help();
  expect(
    screen.queryByRole('button', { name: 'Start with example tasks' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Tutorial step 7' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start with example tasks' }));
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks).toHaveLength(4);
  help();
  fireEvent.click(screen.getByRole('button', { name: 'Tutorial step 7' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start with example tasks' }));
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks).toHaveLength(4);
});
it('owner Dev can add and remove only marked samples, preserving personal tasks', async () => {
  const base = {
    id: 'mine',
    title: 'My task',
    q: 'do',
    done: false,
    notes: '',
    owner: '',
    category: 'Work',
    due: '',
    created: 1,
  };
  localStorage.setItem(MATRIX_KEY, JSON.stringify({ tasks: [base], projects: [] }));
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ authorized: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          projects: [],
          tasks: Array.from({ length: 24 }, (_, i) => ({
            ...base,
            id: `sample-${i}`,
            title: `Sample ${i}`,
            isDevSample: true,
          })),
        }),
      }),
  );
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Dev' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add 24 sample tasks' }));
  await waitFor(() => expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks).toHaveLength(25));
  fireEvent.click(screen.getByRole('button', { name: 'Remove Dev samples' }));
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks).toEqual([base]);
});

it('offers a persistent appearance switch directly in the header', () => {
  render(<App />);
  const toggle = screen.getByRole('switch', { name: 'Dark mode' });
  expect(toggle.closest('header')).not.toBeNull();
  expect(toggle).toHaveAttribute('aria-checked', 'false');
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(document.body).toHaveClass('night');
  expect(localStorage.getItem('clearspace.theme')).toBe('night');
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  expect(screen.queryByRole('button', { name: 'Toggle dark mode' })).not.toBeInTheDocument();
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(document.body).not.toHaveClass('night');
  expect(localStorage.getItem('clearspace.theme')).toBe('light');
});
