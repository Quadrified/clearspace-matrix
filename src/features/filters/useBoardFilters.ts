import { useCallback, useMemo, useState } from 'react';
import { initialFilters, quadrants } from '../../domain/models';
import type { Filters, Matrix } from '../../domain/models';
import { visibleTasks } from '../../domain/queries';

export type SetFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => void;

/**
 * The status tab, search, category, project and sort the board is showing. If the filtered
 * project is deleted, the board quietly falls back to all projects.
 */
export function useBoardFilters(matrix: Matrix) {
  const [filters, setFilters] = useState(initialFilters);
  const projectFilter =
    !filters.project ||
    filters.project === '__none' ||
    matrix.projects.some((project) => project.id === filters.project)
      ? filters.project
      : '';
  const boardFilters = useMemo(
    () => ({ ...filters, project: projectFilter }),
    [filters, projectFilter],
  );
  const resultCount = useMemo(
    () => quadrants.reduce((n, q) => n + visibleTasks(matrix, q.id, boardFilters).length, 0),
    [matrix, boardFilters],
  );
  const setFilter: SetFilter = useCallback(
    (key, value) => setFilters((f) => ({ ...f, [key]: value })),
    [],
  );
  /** Clears search, category, project and sort, keeping the status tab. */
  const clearFilters = useCallback(
    () => setFilters((f) => ({ ...f, search: '', category: '', project: '', sort: 'manual' })),
    [],
  );
  const resetFilters = useCallback(() => setFilters(initialFilters), []);
  return {
    filters,
    projectFilter,
    boardFilters,
    resultCount,
    setFilter,
    clearFilters,
    resetFilters,
  };
}
