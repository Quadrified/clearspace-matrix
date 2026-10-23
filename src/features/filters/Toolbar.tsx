import { useCallback, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Popover } from '../../components/Popover';
import { categories } from '../../domain/models';
import type { Filters, Project } from '../../domain/models';
import type { SetFilter } from './useBoardFilters';

type FilterProps = {
  filters: Filters;
  projectFilter: string;
  projects: Project[];
  filter: SetFilter;
  resultCount: number;
  onClearFilters: () => void;
};

/**
 * The top bar's tools: search, filters and projects as quiet icon buttons.
 * Search shows only its icon until it is focused or holds a query.
 */
export function ToolbarTools({
  filters,
  projectFilter,
  projects,
  filter,
  resultCount,
  onClearFilters,
  onProjects,
}: FilterProps & {
  onProjects: () => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const appliedCount =
    (filters.category ? 1 : 0) + (projectFilter ? 1 : 0) + (filters.sort !== 'manual' ? 1 : 0);
  return (
    <div className="toolbar" id="filters">
      <label className={`search${filters.search ? ' has-query' : ''}`} title="Find a task">
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
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              filter('search', '');
              e.currentTarget.blur();
            }
          }}
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
      </label>
      <div className="filters-control">
        <button
          type="button"
          id="filtersButton"
          className={`iconbtn tool-button filters-button${appliedCount ? ' on' : ''}`}
          aria-label="Filters"
          title="Filters"
          aria-expanded={panelOpen}
          aria-controls="filtersPanel"
          onClick={() => setPanelOpen((open) => !open)}
        >
          <Icon name="filter" />
          {appliedCount > 0 && (
            <span className="filters-badge" aria-label={`${appliedCount} applied`}>
              {appliedCount}
            </span>
          )}
        </button>
        <Popover id="filtersPanel" open={panelOpen} onClose={closePanel} className="filters-panel">
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
      <button
        id="projectsButton"
        className="iconbtn tool-button"
        aria-label="Projects"
        title="Projects (P)"
        onClick={() => onProjects()}
      >
        <Icon name="folder" />
      </button>
    </div>
  );
}

/** Applied filters, shown above the matrix only while something narrows the board. */
export function FilterSummary({
  filters,
  projectFilter,
  projects,
  filter,
  resultCount,
  onClearFilters,
}: FilterProps) {
  const filtering = !!(filters.search || filters.category || projectFilter);
  if (!filtering && filters.sort === 'manual') return null;
  const projectName = projects.find((p) => p.id === projectFilter)?.name;
  return (
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
