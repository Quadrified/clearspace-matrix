/**
 * Every change to the board is a pure function: it takes the current matrix and returns the next
 * one without mutating its input. `useMatrix` validates the result, saves it and keeps Undo.
 */
import type { Matrix, QuadrantId, Task } from './models';

/** Completes or reopens a task. A newly completed task moves to the end of the list. */
export function toggleTask(state: Matrix, id: string, now: number): Matrix {
  const task = state.tasks.find((task) => task.id === id);
  if (!task) return state;
  const updated = { ...task, done: !task.done, completedAt: task.done ? null : now };
  return {
    ...state,
    tasks: task.done
      ? state.tasks.map((task) => (task.id === id ? updated : task))
      : [...state.tasks.filter((task) => task.id !== id), updated],
  };
}

/** Checks or unchecks one subtask. The parent task's own completion is left alone. */
export function toggleSubtask(state: Matrix, taskId: string, subtaskId: string): Matrix {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task?.subtasks?.some((item) => item.id === subtaskId)) return state;
  return {
    ...state,
    tasks: state.tasks.map((item) =>
      item.id === taskId
        ? {
            ...item,
            subtasks: item.subtasks?.map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
            ),
          }
        : item,
    ),
  };
}

/** Moves a task to a quadrant, placed before `beforeId` or at the end. */
export function moveTask(state: Matrix, id: string, q: QuadrantId, beforeId?: string): Matrix {
  const task = state.tasks.find((t) => t.id === id);
  if (!task || id === beforeId) return state;
  const tasks = state.tasks.filter((t) => t.id !== id);
  const index = beforeId ? tasks.findIndex((t) => t.id === beforeId) : -1;
  tasks.splice(index < 0 ? tasks.length : index, 0, { ...task, q });
  return { ...state, tasks };
}

export function addTask(state: Matrix, task: Task): Matrix {
  return { ...state, tasks: [...state.tasks, task] };
}

/** Replaces the saved task that has the same ID. */
export function updateTask(state: Matrix, task: Task): Matrix {
  return { ...state, tasks: state.tasks.map((t) => (t.id === task.id ? task : t)) };
}

export function deleteTask(state: Matrix, id: string): Matrix {
  return { ...state, tasks: state.tasks.filter((t) => t.id !== id) };
}

export function clearCompleted(state: Matrix): Matrix {
  return { ...state, tasks: state.tasks.filter((t) => !t.done) };
}

/** Removes every task and project. Labels and appearance live elsewhere and are kept. */
export function resetBoard(): Matrix {
  return { tasks: [], projects: [] };
}

/** Deletes a project together with all of its tasks. */
export function removeProject(state: Matrix, id: string): Matrix {
  return {
    projects: state.projects.filter((p) => p.id !== id),
    tasks: state.tasks.filter((task) => task.projectId !== id),
  };
}

/** The message to show for an invalid project name, or '' when the name is fine. */
export function projectNameError(state: Matrix, name: string, id?: string) {
  if (!name.trim()) return 'Write a project name first.';
  if (name.trim().length > 80) return 'Keep project names under 81 characters.';
  if (state.projects.some((p) => p.id !== id && p.name.toLowerCase() === name.trim().toLowerCase()))
    return 'A project with that name already exists.';
  return '';
}

const EXAMPLE_NOTE = 'Example task. Edit or delete it to make this space yours.';
const EXAMPLES: Array<[string, QuadrantId, Task['category']]> = [
  ['Send the proposal before the deadline', 'do', 'Work'],
  ['Plan a workout for this week', 'schedule', 'Health'],
  ['Ask a teammate for the meeting notes', 'delegate', 'Work'],
  ['Skip the extra social media scroll', 'eliminate', 'Personal'],
];

/** Adds one editable example task per quadrant, skipping any that are already there. */
export function addExamples(state: Matrix): Matrix {
  const tasks = [...state.tasks];
  for (const [title, q, category] of EXAMPLES)
    if (
      !tasks.some(
        (t) =>
          t.id === `clearspace-example-${q}` || (t.title === title && t.notes === EXAMPLE_NOTE),
      )
    )
      tasks.push({
        id: `clearspace-example-${q}`,
        title,
        q,
        category,
        done: false,
        notes: EXAMPLE_NOTE,
        owner: '',
        due: '',
        created: Date.now(),
      });
  return { ...state, tasks };
}
