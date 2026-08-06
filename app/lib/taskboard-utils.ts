import { NewTaskInput, Task, TaskPriority, TaskStatus } from './definitions';

export type TaskFilters = {
  search: string;
  assignee: string;
  priority: TaskPriority | 'all';
};

export const defaultTaskFilters: TaskFilters = {
  search: '',
  assignee: 'all',
  priority: 'all',
};

export const TASK_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const query = filters.search.trim().toLowerCase();

  return tasks.filter((task) => {
    if (filters.assignee !== 'all' && task.assignee !== filters.assignee) {
      return false;
    }

    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }

    if (
      query &&
      !task.title.toLowerCase().includes(query) &&
      !task.description.toLowerCase().includes(query)
    ) {
      return false;
    }

    return true;
  });
}

export function groupTasksByStatus(
  tasks: Task[],
): Record<TaskStatus, Task[]> {
  return {
    todo: tasks.filter((task) => task.status === 'todo'),
    'in-progress': tasks.filter((task) => task.status === 'in-progress'),
    done: tasks.filter((task) => task.status === 'done'),
  };
}

export function getUniqueAssignees(tasks: Task[]): string[] {
  return Array.from(new Set(tasks.map((task) => task.assignee))).sort(
    (a, b) => a.localeCompare(b),
  );
}

export function createTaskFromInput(input: NewTaskInput): Task {
  return {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description.trim(),
    assignee: input.assignee.trim(),
    priority: input.priority,
    tags: input.tags,
    status: 'todo',
    createdAt: new Date().toISOString(),
  };
}

export function parseTagsInput(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

const GENERATED_ASSIGNEES = [
  'John Doe',
  'Jane Smith',
  'Amy Burns',
  'Michael Novotny',
  'Delba de Oliveira',
  'Lee Robinson',
  'Balazs Orban',
];
const GENERATED_TAGS = [
  'backend',
  'frontend',
  'design',
  'devops',
  'testing',
  'security',
  'performance',
  'docs',
];
const GENERATED_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];
const GENERATED_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

/**
 * Deterministically generates a large, varied task list for exercising
 * virtualization and render performance at scale (see the "load 1000 tasks"
 * dev action in TaskBoard) — no randomness, so output is reproducible and
 * trivially assertable in tests.
 */
export function generateTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, i) => {
    const tagCount = i % 3;
    return {
      id: `generated-${i}`,
      title: `Generated task #${i + 1}`,
      description: `Auto-generated task #${i + 1} for performance/virtualization testing.`,
      status: GENERATED_STATUSES[i % GENERATED_STATUSES.length],
      priority: GENERATED_PRIORITIES[i % GENERATED_PRIORITIES.length],
      assignee: GENERATED_ASSIGNEES[i % GENERATED_ASSIGNEES.length],
      tags: Array.from(
        { length: tagCount },
        (_, t) => GENERATED_TAGS[(i + t) % GENERATED_TAGS.length],
      ),
      createdAt: new Date(Date.now() - i * 60_000).toISOString(),
    };
  });
}
