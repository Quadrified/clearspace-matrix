import { useCallback, useState } from 'react';
import type { RefObject } from 'react';
import { Icon } from '../../components/Icon';
import { Popover } from '../../components/Popover';
import { categories } from '../../domain/models';
import type { Filters, Project } from '../../domain/models';
import { StatusTabs } from '../tasks/StatusTabs';

export function Toolbar({
  filters,
  projectFilter,
  projects,
  filter,
  counts,
  resultCount,
  onClearFilters,
  searchRef,
  onAddTask,
  onProjects,
}: {
  filters: Filters;
  projectFilter: string;
  projects: Project[];
  filter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  counts: { active: number; done: number; all: number };
  resultCount: number;
  onClearFilters: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
  onAddTask: () => void;
  onProjects: () => void;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const filtering = !!(filters.search || filters.category || projectFilter);
  const appliedCount =
    (filters.category ? 1 : 0) + (projectFilter ? 1 : 0) + (filters.sort !== 'manual' ? 1 : 0);
  const projectName = projects.find((p) => p.id === projectFilter)?.name;
  return (
    <div className="toolbar">
      <div className="toolbar-status">
        <StatusTabs
          counts={counts}
          value={filters.status}
          onChange={(value) => filter('status', value)}
        />
        <div className="add-control">
          <button id="newTask" className="btn primary" onClick={() => onAddTask()}>
            <Icon name="plus" />
            Add task
          </button>
          <button id="projectsButton" className="btn" onClick={() => onProjects()}>
            <Icon name="folder" />
            Projects
          </button>
        </div>
      </div>
      <div className="filters" id="filters">
        <div className="search">
          <Icon name="search" />
          <input
            ref={searchRef}
            aria-label="Find a task"
            placeholder="Find a task…"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={filters.search}
            onChange={(e) => filter('search', e.target.value)}
          />
          {filters.search && (
            <button
              type="button"
              className="iconbtn search-clear"
              aria-label="Clear search"
              onClick={() => {
                filter('search', '');
                searchRef.current?.focus();
              }}
            >
              <Icon name="close" />
            </button>
          )}
        </div>
        <div className="filters-control">
          <button
            type="button"
            id="filtersButton"
            className={`btn filters-button${appliedCount ? ' on' : ''}`}
            aria-expanded={panelOpen}
            aria-controls="filtersPanel"
            onClick={() => setPanelOpen((open) => !open)}
          >
            <Icon name="filter" />
            Filters
            {appliedCount > 0 && (
              <span className="filters-badge" aria-label={`${appliedCount} applied`}>
                {appliedCount}
              </span>
            )}
          </button>
          <Popover
            id="filtersPanel"
            open={panelOpen}
            onClose={closePanel}
            className="filters-panel"
          >
            <div className="filters-section" role="group" aria-label="Category">
              <h2>Category</h2>
              <div className="filters-options">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="opt"
                    aria-pressed={filters.category === c}
                    onClick={() => filter('category', filters.category === c ? '' : c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="filters-section" role="group" aria-label="Project">
              <h2>Project</h2>
              <div className="filters-options">
                {[{ id: '__none', name: 'No project' }, ...projects].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="opt"
                    aria-pressed={projectFilter === p.id}
                    onClick={() => filter('project', projectFilter === p.id ? '' : p.id)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="filters-section" role="group" aria-label="Sort tasks">
              <h2>Sort by</h2>
              <div className="filters-seg">
                {sorts.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={filters.sort === value}
                    onClick={() => filter('sort', value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filters-foot">
              <button type="button" className="link-button" onClick={onClearFilters}>
                Clear all
              </button>
              <button type="button" className="btn primary" onClick={closePanel}>
                Show {resultCount} {resultCount === 1 ? 'task' : 'tasks'}
              </button>
            </div>
          </Popover>
        </div>
      </div>
      {(filtering || filters.sort !== 'manual') && (
        <div className="filter-summary" role="status">
          <span>
            {resultCount} {resultCount === 1 ? 'task matches' : 'tasks match'}
          </span>
          {filters.category && (
            <AppliedChip
              label="Category"
              value={filters.category}
              onRemove={() => filter('category', '')}
            />
          )}
          {projectFilter && (
            <AppliedChip
              label="Project"
              value={projectFilter === '__none' ? 'No project' : (projectName ?? '')}
              onRemove={() => filter('project', '')}
            />
          )}
          {filters.sort !== 'manual' && (
            <AppliedChip
              label="Sort"
              value={sorts.find(([value]) => value === filters.sort)?.[1] ?? ''}
              onRemove={() => filter('sort', 'manual')}
            />
          )}
          <button type="button" className="link-button" onClick={onClearFilters}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

const sorts = [
  ['manual', 'Your order'],
  ['due', 'Due date'],
  ['new', 'Newest'],
] as const;

function AppliedChip({
  label,
  value,
  onRemove,
}: {
  label: string;
  value: string;
  onRemove: () => void;
}) {
  return (
    <span className="applied-chip">
      <b>{label}</b> {value}
      <button type="button" aria-label={`Remove ${label} filter: ${value}`} onClick={onRemove}>
        <Icon name="close" />
      </button>
    </span>
  );
}
