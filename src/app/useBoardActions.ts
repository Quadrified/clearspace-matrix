import { useMemo } from 'react';
import type { QuadrantId } from '../domain/models';
import {
  addExamples,
  clearCompleted,
  moveTask,
  resetBoard,
  toggleSubtask,
  toggleTask,
} from '../domain/operations';
import type { ChangeMatrix } from '../state/useMatrix';

/**
 * Board actions used across the screen, each pairing a pure domain operation with the message
 * its toast shows. The handlers are stable, so memoized task cards do not re-render.
 */
export function useBoardActions(change: ChangeMatrix) {
  return useMemo(
    () => ({
      toggleTask: (id: string) => change((m) => toggleTask(m, id, Date.now()), 'Task updated.'),
      toggleSubtask: (taskId: string, subtaskId: string) =>
        change((m) => toggleSubtask(m, taskId, subtaskId), 'Subtask updated.'),
      moveTask: (id: string, q: QuadrantId, before?: string) =>
        change((m) => moveTask(m, id, q, before), 'Task moved.'),
      addExamples: () => change(addExamples, 'Example tasks added.'),
      clearCompleted: () => change(clearCompleted, 'Completed tasks cleared.'),
      resetBoard: () => change(resetBoard, 'Board reset. All tasks and projects cleared.'),
    }),
    [change],
  );
}
