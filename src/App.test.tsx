import { createSamples } from './features/dev/samples';
import userEvent from '@testing-library/user-event';
import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { vi, it, expect, beforeEach } from 'vitest';
import App from './App';
import { MATRIX_KEY } from './domain/matrix';
beforeEach(() => {
  localStorage.setItem('clearspace.tutorial.v1', 'seen');
  vi.stubGlobal('fetch', vi.fn());
});
it('adds a Work task, saves it in the existing storage format, and undoes it', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Add a task to Do first' }));
  expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Work');
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
  expect(screen.getByRole('combobox', { name: 'Project' })).toHaveTextContent('Clearspace');
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
  act(() => {
    vi.advanceTimersByTime(9999);
  });
  expect(screen.getByRole('status')).toBeInTheDocument();
  act(() => {
    vi.advanceTimersByTime(1);
  });
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
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).projects[0].name).toBe('Keep me');
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks[0].projectId).toBe('p');
});
it('shows Dev tools during local development without making an authorization request', async () => {
  render(<App />);
  expect(await screen.findByRole('button', { name: 'Dev' })).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
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
it('local Dev generates samples without API calls and removes only marked tasks', async () => {
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
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Dev' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add 24 sample tasks' }));
  await waitFor(() => expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks).toHaveLength(25));
  expect(screen.queryByRole('dialog', { name: 'Local development tools' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Dev' }));
  fireEvent.click(screen.getByRole('button', { name: 'Remove Dev samples' }));
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks).toEqual([base]);
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(JSON.parse(localStorage.getItem(MATRIX_KEY)!).tasks).toHaveLength(25);
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

it('lets dropdown typeahead use shortcut letters without opening another feature', async () => {
  const user = userEvent.setup();
  render(<App />);
  screen.getByRole('combobox', { name: 'Filter by category' }).focus();
  await user.keyboard('{ArrowDown}');
  await screen.findByRole('listbox');
  await user.keyboard('p');
  await waitFor(() =>
    expect(screen.getByRole('option', { name: 'Personal' })).toHaveAttribute('data-highlighted'),
  );
  await user.keyboard('{Enter}');
  expect(screen.getByRole('combobox', { name: 'Filter by category' })).toHaveTextContent(
    'Personal',
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('keeps browser chrome and native controls aligned with the app theme rather than the OS', () => {
  const tags = ['light', 'dark'].map((scheme) => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.media = `(prefers-color-scheme: ${scheme})`;
    meta.content = scheme === 'light' ? '#f4f6ef' : '#12271e';
    document.head.append(meta);
    return meta;
  });
  try {
    render(<App />);
    expect(tags.map((meta) => meta.content)).toEqual(['#f4f6ef', '#f4f6ef']);
    expect(document.documentElement.style.colorScheme).toBe('light');
    fireEvent.click(screen.getByRole('switch', { name: 'Dark mode' }));
    expect(tags.map((meta) => meta.content)).toEqual(['#12271e', '#12271e']);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  } finally {
    tags.forEach((meta) => meta.remove());
  }
});

it('moves a checked task to the bottom of its quadrant in All tasks and restores order on Undo', () => {
  const matrix = createSamples('2026-10-15');
  const tasks = matrix.tasks.filter((task) => task.q === 'do');
  tasks[5].done = true;
  localStorage.setItem(MATRIX_KEY, JSON.stringify({ version: 2, ...matrix }));
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'All tasks' }));
  const quadrant = screen.getByRole('region', { name: 'Do first, Urgent and important' });
  const order = () =>
    Array.from(quadrant.querySelectorAll<HTMLElement>('[data-task-id]')).map(
      (card) => card.dataset.taskId,
    );
  const original = tasks.map((task) => task.id);
  expect(order()).toEqual(original);
  fireEvent.click(within(quadrant).getByRole('checkbox', { name: `Complete ${tasks[0].title}` }));
  expect(order()).toEqual([...original.slice(1), original[0]]);
  expect(
    within(quadrant).getByRole('checkbox', { name: `Reopen ${tasks[0].title}` }),
  ).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(order()).toEqual(original);
});
