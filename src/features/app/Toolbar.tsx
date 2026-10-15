import { useState } from 'react';
import type { RefObject } from 'react';
import { Icon } from '../../components/Icon';
import { Select, SelectOption } from '../../components/Select';
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtering = !!(filters.search || filters.category || projectFilter);
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
      <button
        type="button"
        className="btn filters-toggle"
        aria-expanded={filtersOpen}
        aria-controls="filters"
        onClick={() => setFiltersOpen((open) => !open)}
      >
        <Icon name="search" />
        {filtersOpen
          ? 'Hide search and filters'
          : filtering
            ? 'Search and filters (on)'
            : 'Search and filters'}
      </button>
      <div className={`filters${filtersOpen ? ' is-open' : ''}`} id="filters">
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
        <Select
          aria-label="Filter by category"
          value={filters.category}
          onValueChange={(value) => filter('category', value)}
        >
          <SelectOption value="">All categories</SelectOption>
          {categories.map((c) => (
            <SelectOption key={c}>{c}</SelectOption>
          ))}
        </Select>
        <Select
          aria-label="Filter by project"
          value={projectFilter}
          onValueChange={(value) => filter('project', value)}
        >
          <SelectOption value="">All projects</SelectOption>
          <SelectOption value="__none">No project</SelectOption>
          {projects.map((p) => (
            <SelectOption key={p.id} value={p.id}>
              {p.name}
            </SelectOption>
          ))}
        </Select>
        <Select
          id="sort"
          aria-label="Sort tasks"
          value={filters.sort}
          onValueChange={(value) => filter('sort', value as Filters['sort'])}
        >
          <SelectOption value="manual">Your order</SelectOption>
          <SelectOption value="due">Due date</SelectOption>
          <SelectOption value="new">Newest first</SelectOption>
        </Select>
      </div>
      {filtering && (
        <p className="filter-summary" role="status">
          {resultCount} {resultCount === 1 ? 'task matches' : 'tasks match'}
          <button type="button" className="iconbtn" onClick={onClearFilters}>
            Clear filters
          </button>
        </p>
      )}
    </div>
  );
}
