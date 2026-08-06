import { Task } from '@/app/lib/definitions';
import {
  createTaskFromInput,
  filterTasks,
  generateTasks,
  getUniqueAssignees,
  groupTasksByStatus,
  parseTagsInput,
} from '@/app/lib/taskboard-utils';

const tasks: Task[] = [
  {
    id: '1',
    title: 'Implement authentication',
    description: 'Add JWT-based auth',
    status: 'todo',
    priority: 'high',
    assignee: 'John Doe',
    tags: ['backend'],
    createdAt: '2024-11-20T10:00:00Z',
  },
  {
    id: '2',
    title: 'Design landing page',
    description: 'Create mockups for homepage',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'Jane Smith',
    tags: ['design'],
    createdAt: '2024-11-19T14:30:00Z',
  },
  {
    id: '3',
    title: 'Fix payment bug',
    description: 'Checkout is broken for authenticated users',
    status: 'done',
    priority: 'high',
    assignee: 'John Doe',
    tags: ['backend', 'urgent'],
    createdAt: '2024-11-21T09:15:00Z',
  },
];

describe('filterTasks', () => {
  it('returns all tasks when filters are default', () => {
    expect(
      filterTasks(tasks, { search: '', assignee: 'all', priority: 'all' }),
    ).toHaveLength(3);
  });

  it('filters by assignee', () => {
    const result = filterTasks(tasks, {
      search: '',
      assignee: 'John Doe',
      priority: 'all',
    });
    expect(result).toHaveLength(2);
    expect(result.every((task) => task.assignee === 'John Doe')).toBe(true);
  });

  it('filters by priority', () => {
    const result = filterTasks(tasks, {
      search: '',
      assignee: 'all',
      priority: 'medium',
    });
    expect(result).toEqual([tasks[1]]);
  });

  it('searches case-insensitively across title and description', () => {
    const byTitle = filterTasks(tasks, {
      search: 'AUTHENTICATION',
      assignee: 'all',
      priority: 'all',
    });
    expect(byTitle).toEqual([tasks[0]]);

    const byDescription = filterTasks(tasks, {
      search: 'authenticated users',
      assignee: 'all',
      priority: 'all',
    });
    expect(byDescription).toEqual([tasks[2]]);
  });

  it('combines search, assignee, and priority filters', () => {
    const result = filterTasks(tasks, {
      search: 'bug',
      assignee: 'John Doe',
      priority: 'high',
    });
    expect(result).toEqual([tasks[2]]);
  });

  it('returns an empty array when nothing matches', () => {
    const result = filterTasks(tasks, {
      search: 'nonexistent',
      assignee: 'all',
      priority: 'all',
    });
    expect(result).toEqual([]);
  });
});

describe('groupTasksByStatus', () => {
  it('buckets tasks under their status', () => {
    const grouped = groupTasksByStatus(tasks);
    expect(grouped.todo).toEqual([tasks[0]]);
    expect(grouped['in-progress']).toEqual([tasks[1]]);
    expect(grouped.done).toEqual([tasks[2]]);
  });

  it('returns empty arrays for statuses with no tasks', () => {
    const grouped = groupTasksByStatus([]);
    expect(grouped).toEqual({ todo: [], 'in-progress': [], done: [] });
  });
});

describe('getUniqueAssignees', () => {
  it('deduplicates and sorts assignee names', () => {
    expect(getUniqueAssignees(tasks)).toEqual(['Jane Smith', 'John Doe']);
  });

  it('returns an empty array for no tasks', () => {
    expect(getUniqueAssignees([])).toEqual([]);
  });
});

describe('parseTagsInput', () => {
  it('splits comma-separated tags and trims whitespace', () => {
    expect(parseTagsInput(' frontend, urgent ,design')).toEqual([
      'frontend',
      'urgent',
      'design',
    ]);
  });

  it('drops empty entries and duplicates', () => {
    expect(parseTagsInput('frontend,, frontend ,')).toEqual(['frontend']);
  });

  it('returns an empty array for blank input', () => {
    expect(parseTagsInput('')).toEqual([]);
  });
});

describe('createTaskFromInput', () => {
  it('builds a task defaulting to todo status with a generated id and timestamp', () => {
    const task = createTaskFromInput({
      title: '  New task  ',
      description: '  Do the thing  ',
      assignee: '  Amy Burns  ',
      priority: 'low',
      tags: ['ops'],
    });

    expect(task.status).toBe('todo');
    expect(task.title).toBe('New task');
    expect(task.description).toBe('Do the thing');
    expect(task.assignee).toBe('Amy Burns');
    expect(task.priority).toBe('low');
    expect(task.tags).toEqual(['ops']);
    expect(typeof task.id).toBe('string');
    expect(task.id.length).toBeGreaterThan(0);
    expect(() => new Date(task.createdAt).toISOString()).not.toThrow();
  });

  it('generates unique ids for successive tasks', () => {
    const base = {
      title: 'A',
      description: 'B',
      assignee: 'C',
      priority: 'medium' as const,
      tags: [],
    };
    const first = createTaskFromInput(base);
    const second = createTaskFromInput(base);
    expect(first.id).not.toBe(second.id);
  });
});

describe('generateTasks', () => {
  it('generates the requested number of tasks with unique ids', () => {
    const generated = generateTasks(1000);
    expect(generated).toHaveLength(1000);
    expect(new Set(generated.map((t) => t.id)).size).toBe(1000);
  });

  it('produces only valid status/priority values', () => {
    const generated = generateTasks(50);
    for (const task of generated) {
      expect(['todo', 'in-progress', 'done']).toContain(task.status);
      expect(['low', 'medium', 'high']).toContain(task.priority);
      expect(task.title.length).toBeGreaterThan(0);
      expect(task.assignee.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic for the same count (ignoring the wall-clock timestamp)', () => {
    const stripTimestamps = (tasks: Task[]) =>
      tasks.map(({ createdAt, ...rest }) => rest);
    expect(stripTimestamps(generateTasks(20))).toEqual(
      stripTimestamps(generateTasks(20)),
    );
  });

  it('returns an empty array for zero', () => {
    expect(generateTasks(0)).toEqual([]);
  });
});
