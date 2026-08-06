'use client';

import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { TaskPriority } from '@/app/lib/definitions';
import { TaskFilters } from '@/app/lib/taskboard-utils';

interface FilterBarProps {
  filters: TaskFilters;
  assignees: string[];
  onChange: (filters: TaskFilters) => void;
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

export function FilterBar({ filters, assignees, onChange }: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Keep the visible input in sync if filters are reset elsewhere (e.g. "Clear filters").
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    onChange({ ...filters, search: value });
  }, 250);

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm transition-colors dark:bg-gray-900 md:flex-row md:items-end">
      <label
        htmlFor="task-search"
        className="flex flex-1 flex-col text-xs font-medium text-gray-600 dark:text-gray-400"
      >
        Search
        <div className="relative mt-1">
          <input
            id="task-search"
            placeholder="Search by title or description..."
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              debouncedSearch(event.target.value);
            }}
            className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 outline-2 outline-blue-500 focus:outline dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </label>

      <div className="flex gap-3">
        <label className="flex flex-col text-xs font-medium text-gray-600 dark:text-gray-400">
          Assignee
          <select
            aria-label="Filter by assignee"
            value={filters.assignee}
            onChange={(event) =>
              onChange({ ...filters, assignee: event.target.value })
            }
            className="mt-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="all">All assignees</option>
            {assignees.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-xs font-medium text-gray-600 dark:text-gray-400">
          Priority
          <select
            aria-label="Filter by priority"
            value={filters.priority}
            onChange={(event) =>
              onChange({
                ...filters,
                priority: event.target.value as TaskFilters['priority'],
              })
            }
            className="mt-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="all">All priorities</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority[0].toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}