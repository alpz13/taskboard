import { act, renderHook } from '@testing-library/react';
import { Task, TaskStatus } from '@/app/lib/definitions';
import { useTaskBoard } from '@/app/lib/hooks/use-task-board';

const tasks: Task[] = [
  {
    id: '1',
    title: 'Implement authentication',
    description: 'Add JWT-based auth',
    status: 'todo',
    priority: 'high',
    assignee: 'John Doe',
    tags: [],
    createdAt: '2024-11-20T10:00:00Z',
  },
  {
    id: '2',
    title: 'Design landing page',
    description: 'Create mockups',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'Jane Smith',
    tags: [],
    createdAt: '2024-11-19T10:00:00Z',
  },
];

function fakeApi(outcome: 'success' | 'failure', delayMs = 2000) {
  return jest.fn((taskId: string, status: TaskStatus) => {
    return new Promise<{ taskId: string; status: TaskStatus }>(
      (resolve, reject) => {
        setTimeout(() => {
          if (outcome === 'success') resolve({ taskId, status });
          else reject(new Error('simulated failure'));
        }, delayMs);
      },
    );
  });
}

// Same fixed-sequence helper as realtime-simulator.test.ts: with these
// tasks, draws of all-0 pick task[0], field 'status', actor[0], and the
// first status option that differs from the task's *current* status.
function fakeRandom(sequence: number[]): () => number {
  let i = 0;
  return () => sequence[i++ % sequence.length];
}

describe('useTaskBoard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('optimistically updates status immediately and marks the task pending', () => {
    const api = fakeApi('success');
    const { result } = renderHook(() =>
      useTaskBoard(tasks, {
        updateTaskStatus: api,
        simulator: { enabled: false },
      }),
    );

    act(() => {
      result.current.changeTaskStatus('1', 'done');
    });

    expect(result.current.tasks.find((t) => t.id === '1')?.status).toBe(
      'done',
    );
    expect(result.current.pendingTaskIds.has('1')).toBe(true);
    expect(api).toHaveBeenCalledWith('1', 'done', undefined);
  });

  it('clears the pending state and keeps the optimistic value on success', async () => {
    const api = fakeApi('success', 2000);
    const { result } = renderHook(() =>
      useTaskBoard(tasks, {
        updateTaskStatus: api,
        simulator: { enabled: false },
      }),
    );

    act(() => {
      result.current.changeTaskStatus('1', 'done');
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.pendingTaskIds.has('1')).toBe(false);
    expect(result.current.tasks.find((t) => t.id === '1')?.status).toBe(
      'done',
    );
    expect(result.current.toasts).toHaveLength(0);
  });

  it('rolls back and shows an error toast on failure', async () => {
    const api = fakeApi('failure', 1000);
    const { result } = renderHook(() =>
      useTaskBoard(tasks, {
        updateTaskStatus: api,
        simulator: { enabled: false },
      }),
    );

    act(() => {
      result.current.changeTaskStatus('1', 'done');
    });
    expect(result.current.tasks.find((t) => t.id === '1')?.status).toBe(
      'done',
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.tasks.find((t) => t.id === '1')?.status).toBe(
      'todo',
    );
    expect(result.current.pendingTaskIds.has('1')).toBe(false);
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].variant).toBe('error');
    expect(result.current.toasts[0].message).toContain('Implement authentication');
  });

  it('ignores a second status change while one is already pending for the task', () => {
    const api = fakeApi('success', 2000);
    const { result } = renderHook(() =>
      useTaskBoard(tasks, {
        updateTaskStatus: api,
        simulator: { enabled: false },
      }),
    );

    act(() => {
      result.current.changeTaskStatus('1', 'in-progress');
      result.current.changeTaskStatus('1', 'done');
    });

    expect(api).toHaveBeenCalledTimes(1);
    expect(result.current.tasks.find((t) => t.id === '1')?.status).toBe(
      'in-progress',
    );
  });

  it('createTask prepends a new task', () => {
    const { result } = renderHook(() =>
      useTaskBoard(tasks, { simulator: { enabled: false } }),
    );

    act(() => {
      result.current.createTask({
        title: 'New task',
        description: 'Do something',
        assignee: 'Amy Burns',
        priority: 'low',
        tags: [],
      });
    });

    expect(result.current.tasks).toHaveLength(3);
    expect(result.current.tasks[0].title).toBe('New task');
  });

  it('loadTasks replaces the whole task list', () => {
    const { result } = renderHook(() =>
      useTaskBoard(tasks, { simulator: { enabled: false } }),
    );

    const replacement: Task[] = [{ ...tasks[0], id: '999' }];
    act(() => {
      result.current.loadTasks(replacement);
    });

    expect(result.current.tasks).toEqual(replacement);
    expect(result.current.pendingTaskIds.size).toBe(0);
  });

  it('applies a non-conflicting external change and shows an info toast', async () => {
    const api = fakeApi('success');
    const random = fakeRandom([0, 0, 0, 0, 0]);
    const { result } = renderHook(() =>
      useTaskBoard(tasks, {
        updateTaskStatus: api,
        simulator: { enabled: true, minDelayMs: 1000, maxDelayMs: 1000, random },
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.tasks.find((t) => t.id === tasks[0].id)?.status).toBe(
      'in-progress',
    );
    expect(
      result.current.toasts.some((t) => t.message.includes(tasks[0].title)),
    ).toBe(true);
  });

  it('defers a conflicting external change while a local write is pending, then discards it on local success', async () => {
    const api = fakeApi('success', 5000);
    const random = fakeRandom([0, 0, 0, 0, 0]);
    const { result } = renderHook(() =>
      useTaskBoard(tasks, {
        updateTaskStatus: api,
        simulator: { enabled: true, minDelayMs: 1000, maxDelayMs: 1000, random },
      }),
    );

    act(() => {
      result.current.changeTaskStatus(tasks[0].id, 'done');
    });

    // Simulator fires at 1000ms, well before the 5000ms local write settles.
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.tasks.find((t) => t.id === tasks[0].id)?.status).toBe(
      'done',
    );
    expect(
      result.current.toasts.some((t) => t.message.includes('in progress')),
    ).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    expect(result.current.tasks.find((t) => t.id === tasks[0].id)?.status).toBe(
      'done',
    );
    expect(
      result.current.toasts.some((t) => t.message.includes('discarded')),
    ).toBe(true);
  });

  it('applies the deferred external change after the local write fails', async () => {
    const api = fakeApi('failure', 5000);
    const random = fakeRandom([0, 0, 0, 0, 0]);
    const { result } = renderHook(() =>
      useTaskBoard(tasks, {
        updateTaskStatus: api,
        simulator: { enabled: true, minDelayMs: 1000, maxDelayMs: 1000, random },
      }),
    );

    act(() => {
      result.current.changeTaskStatus(tasks[0].id, 'done');
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    // Local write failed -> rolled back, then the deferred external change
    // (status -> 'todo', since the task was optimistically 'done' when the
    // simulator picked its new value) applies on top.
    expect(result.current.tasks.find((t) => t.id === tasks[0].id)?.status).toBe(
      'todo',
    );
    expect(result.current.toasts.some((t) => t.variant === 'error')).toBe(true);
    expect(
      result.current.toasts.some((t) => t.message.includes('applied instead')),
    ).toBe(true);
  });

  describe('editing and deleting tasks', () => {
    const edits = {
      title: 'Updated title',
      description: 'Updated description',
      assignee: 'Amy Burns',
      priority: 'low' as const,
      tags: ['ops'],
    };

    it('startEditingTask marks the task as editing, not pending', () => {
      const { result } = renderHook(() =>
        useTaskBoard(tasks, { simulator: { enabled: false } }),
      );

      act(() => {
        result.current.startEditingTask('1');
      });

      expect(result.current.editingTaskIds.has('1')).toBe(true);
      expect(result.current.pendingTaskIds.has('1')).toBe(false);
    });

    it('saveTaskEdits applies the changes and clears editing state', () => {
      const { result } = renderHook(() =>
        useTaskBoard(tasks, { simulator: { enabled: false } }),
      );

      act(() => {
        result.current.startEditingTask('1');
      });
      act(() => {
        result.current.saveTaskEdits('1', edits);
      });

      expect(result.current.editingTaskIds.has('1')).toBe(false);
      expect(result.current.tasks.find((t) => t.id === '1')).toMatchObject(
        edits,
      );
    });

    it('cancelEditingTask discards the in-progress edit without changing the task', () => {
      const { result } = renderHook(() =>
        useTaskBoard(tasks, { simulator: { enabled: false } }),
      );
      const original = result.current.tasks.find((t) => t.id === '1');

      act(() => {
        result.current.startEditingTask('1');
      });
      act(() => {
        result.current.cancelEditingTask('1');
      });

      expect(result.current.editingTaskIds.has('1')).toBe(false);
      expect(result.current.tasks.find((t) => t.id === '1')).toEqual(
        original,
      );
    });

    it('deleteTask removes the task and shows a success toast', () => {
      const { result } = renderHook(() =>
        useTaskBoard(tasks, { simulator: { enabled: false } }),
      );

      act(() => {
        result.current.deleteTask('1');
      });

      expect(result.current.tasks.find((t) => t.id === '1')).toBeUndefined();
      expect(result.current.tasks).toHaveLength(1);
      expect(
        result.current.toasts.some(
          (t) => t.variant === 'success' && t.message.includes('Deleted'),
        ),
      ).toBe(true);
    });

    it('a task cannot be dragged while its edit modal is open', () => {
      const api = fakeApi('success');
      const { result } = renderHook(() =>
        useTaskBoard(tasks, {
          updateTaskStatus: api,
          simulator: { enabled: false },
        }),
      );

      act(() => {
        result.current.startEditingTask('1');
        result.current.changeTaskStatus('1', 'done');
      });

      expect(api).not.toHaveBeenCalled();
      expect(result.current.tasks.find((t) => t.id === '1')?.status).toBe(
        'todo',
      );
    });

    it("a task's edit modal can't be opened while it has a pending status write", () => {
      const api = fakeApi('success', 2000);
      const { result } = renderHook(() =>
        useTaskBoard(tasks, {
          updateTaskStatus: api,
          simulator: { enabled: false },
        }),
      );

      act(() => {
        result.current.changeTaskStatus('1', 'done');
        result.current.startEditingTask('1');
      });

      expect(result.current.editingTaskIds.has('1')).toBe(false);
      expect(result.current.pendingTaskIds.has('1')).toBe(true);
    });

    it('defers a non-status external change while the task is being edited (extended conflict rule)', async () => {
      // With draws [delay, task-idx=0, field-idx=0.5, actor-idx, value-idx],
      // the simulator targets tasks[0] with a *priority* change — a field a
      // plain status-write would never have conflicted on, but an open edit
      // session blocks every field.
      const random = fakeRandom([0, 0, 0.5, 0, 0]);
      const { result } = renderHook(() =>
        useTaskBoard(tasks, {
          simulator: {
            enabled: true,
            minDelayMs: 1000,
            maxDelayMs: 1000,
            random,
          },
        }),
      );

      act(() => {
        result.current.startEditingTask(tasks[0].id);
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Deferred, not applied — the task's priority is untouched while the
      // edit session is open.
      expect(
        result.current.tasks.find((t) => t.id === tasks[0].id)?.priority,
      ).toBe(tasks[0].priority);
      expect(
        result.current.toasts.some((t) => t.message.includes('in progress')),
      ).toBe(true);

      act(() => {
        result.current.cancelEditingTask(tasks[0].id);
      });

      // Cancelling means the edit never happened, so the deferred external
      // change applies now.
      expect(
        result.current.tasks.find((t) => t.id === tasks[0].id)?.priority,
      ).not.toBe(tasks[0].priority);
    });

    it('discards a deferred external change when the edit is saved instead of cancelled', async () => {
      const random = fakeRandom([0, 0, 0.5, 0, 0]);
      const { result } = renderHook(() =>
        useTaskBoard(tasks, {
          simulator: {
            enabled: true,
            minDelayMs: 1000,
            maxDelayMs: 1000,
            random,
          },
        }),
      );

      act(() => {
        result.current.startEditingTask(tasks[0].id);
      });
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.saveTaskEdits(tasks[0].id, edits);
      });

      // The explicit save wins: priority is whatever the user set, not the
      // deferred external value.
      expect(
        result.current.tasks.find((t) => t.id === tasks[0].id)?.priority,
      ).toBe('low');
      expect(
        result.current.toasts.some((t) => t.message.includes('discarded')),
      ).toBe(true);
    });
  });
});
