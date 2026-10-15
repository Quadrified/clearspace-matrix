import type { RefObject } from 'react';
import { Icon } from '../../components/Icon';
import { Popover } from '../../components/Popover';
import { Select, SelectOption } from '../../components/Select';
import { categories } from '../../domain/models';
import type { Filters, Project } from '../../domain/models';
import { StatusTabs } from '../tasks/StatusTabs';
import type { Menu } from './AppHeader';

export function Toolbar({
  filters,
  projectFilter,
  projects,
  filter,
  menu,
  setMenu,
  searchRef,
  onAddTask,
  onProjects,
}: {
  filters: Filters;
  projectFilter: string;
  projects: Project[];
  filter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  menu: Menu;
  setMenu: (menu: Menu) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  onAddTask: () => void;
  onProjects: () => void;
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-status">
        <StatusTabs value={filters.status} onChange={(value) => filter('status', value)} />
        <div className="add-control">
          <button
            id="newTask"
            className="btn primary"
            aria-expanded={menu === 'add'}
            aria-controls="addMenu"
            onClick={() => setMenu(menu === 'add' ? null : 'add')}
          >
            <Icon name="plus" />
            Add
            <Icon name="chevron" className="add-chevron" />
          </button>
          <Popover
            id="addMenu"
            open={menu === 'add'}
            onClose={() => setMenu(null)}
            className="add-menu"
          >
            <button onClick={() => onAddTask()}>
              <Icon name="plus" />
              Add task<kbd>N</kbd>
            </button>
            <button onClick={() => onProjects()}>
              <Icon name="folder" />
              Add project<kbd>P</kbd>
            </button>
          </Popover>
        </div>
      </div>
      <div className="filters">
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
    </div>
  );
}
