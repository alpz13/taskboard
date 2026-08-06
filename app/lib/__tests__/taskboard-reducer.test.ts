import { ExternalChange } from '@/app/lib/api/realtime-simulator';
import { Task } from '@/app/lib/definitions';
import {
  createInitialTaskBoardState,
  isTaskPending,
  taskBoardReducer,
  TaskBoardState,
} from '@/app/lib/taskboard-reducer';

const baseTask: Task = {
  id: '1',
  title: 'Implement authentication',
  description: 'Add JWT-based auth',
  status: 'todo',
  priority: 'high',
  assignee: 'John Doe',
  tags: ['backend'],
  createdAt: '2024-11-20T10:00:00Z',
};

const otherTask: Task = {
  id: '2',
  title: 'Design landing page',
  description: 'Create mockups',
  status: 'in-progress',
  priority: 'medium',
  assignee: 'Jane Smith',
  tags: [],
  createdAt: '2024-11-19T10:00:00Z',
};

function initState(): TaskBoardState {
  return createInitialTaskBoardState([baseTask, otherTask]);
}

describe('status-change-requested', () => {
  it('optimistically updates the task and records a pending update', () => {
    const state = taskBoardReducer(initState(), {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'in-progress',
    });

    expect(state.tasks.find((t) => t.id === '1')?.status).toBe('in-progress');
    expect(state.pendingUpdates['1']).toEqual({
      kind: 'status-write',
      field: 'status',
      previousValue: 'todo',
      nextValue: 'in-progress',
    });
    expect(isTaskPending(state, '1')).toBe(true);
  });

  it('leaves other tasks untouched (same array reference)', () => {
    const before = initState();
    const after = taskBoardReducer(before, {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'done',
    });

    const untouched = after.tasks.find((t) => t.id === '2');
    expect(untouched).toBe(before.tasks.find((t) => t.id === '2'));
  });

  it('is a no-op for an unknown task id', () => {
    const state = initState();
    const next = taskBoardReducer(state, {
      type: 'status-change-requested',
      taskId: 'missing',
      nextStatus: 'done',
    });
    expect(next).toBe(state);
  });

  it('is a no-op if the task already has a pending write', () => {
    const state = taskBoardReducer(initState(), {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'in-progress',
    });
    const next = taskBoardReducer(state, {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'done',
    });
    expect(next).toBe(state);
  });

  it('is a no-op if the task is currently being edited', () => {
    const state = taskBoardReducer(initState(), {
      type: 'edit-started',
      taskId: '1',
    });
    const next = taskBoardReducer(state, {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'done',
    });
    expect(next).toBe(state);
  });
});

describe('status-change-succeeded', () => {
  it('clears the pending update and keeps the optimistic value', () => {
    const pending = taskBoardReducer(initState(), {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'done',
    });
    const settled = taskBoardReducer(pending, {
      type: 'status-change-succeeded',
      taskId: '1',
    });

    expect(isTaskPending(settled, '1')).toBe(false);
    expect(settled.tasks.find((t) => t.id === '1')?.status).toBe('done');
  });

  it('discards a deferred conflicting external change (local wins)', () => {
    let state = taskBoardReducer(initState(), {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'done',
    });
    const conflictingChange: ExternalChange = {
      taskId: '1',
      field: 'status',
      previousValue: 'todo',
      nextValue: 'in-progress',
      actor: 'Priya',
    };
    state = taskBoardReducer(state, {
      type: 'external-change-received',
      change: conflictingChange,
    });
    expect(state.deferredExternalChanges['1']).toEqual(conflictingChange);

    state = taskBoardReducer(state, {
      type: 'status-change-succeeded',
      taskId: '1',
    });

    expect(state.deferredExternalChanges['1']).toBeUndefined();
    // Local's explicit "done" wins, not the deferred "in-progress".
    expect(state.tasks.find((t) => t.id === '1')?.status).toBe('done');
  });
});

describe('status-change-failed', () => {
  it('rolls back to the previous value and clears the pending update', () => {
    const pending = taskBoardReducer(initState(), {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'done',
    });
    const rolledBack = taskBoardReducer(pending, {
      type: 'status-change-failed',
      taskId: '1',
    });

    expect(isTaskPending(rolledBack, '1')).toBe(false);
    expect(rolledBack.tasks.find((t) => t.id === '1')?.status).toBe('todo');
  });

  it('applies a deferred conflicting external change after rollback', () => {
    let state = taskBoardReducer(initState(), {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'done',
    });
    const conflictingChange: ExternalChange = {
      taskId: '1',
      field: 'status',
      previousValue: 'todo',
      nextValue: 'in-progress',
      actor: 'Priya',
    };
    state = taskBoardReducer(state, {
      type: 'external-change-received',
      change: conflictingChange,
    });

    state = taskBoardReducer(state, {
      type: 'status-change-failed',
      taskId: '1',
    });

    expect(state.deferredExternalChanges['1']).toBeUndefined();
    // Local write failed, so the deferred external change applies instead
    // of the pre-optimistic original value.
    expect(state.tasks.find((t) => t.id === '1')?.status).toBe('in-progress');
  });

  it('is a no-op when there is no pending update for the task', () => {
    const state = initState();
    const next = taskBoardReducer(state, {
      type: 'status-change-failed',
      taskId: '1',
    });
    expect(next).toBe(state);
  });
});

describe('external-change-received', () => {
  it('applies immediately when there is no conflicting pending write', () => {
    const change: ExternalChange = {
      taskId: '2',
      field: 'priority',
      previousValue: 'medium',
      nextValue: 'high',
      actor: 'Sam',
    };
    const state = taskBoardReducer(initState(), {
      type: 'external-change-received',
      change,
    });

    expect(state.tasks.find((t) => t.id === '2')?.priority).toBe('high');
    expect(state.deferredExternalChanges['2']).toBeUndefined();
  });

  it('defers instead of applying when the field matches an in-flight local write', () => {
    let state = taskBoardReducer(initState(), {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'done',
    });
    const change: ExternalChange = {
      taskId: '1',
      field: 'status',
      previousValue: 'todo',
      nextValue: 'in-progress',
      actor: 'Priya',
    };
    state = taskBoardReducer(state, {
      type: 'external-change-received',
      change,
    });

    // The optimistic "done" is untouched while the local write is pending.
    expect(state.tasks.find((t) => t.id === '1')?.status).toBe('done');
    expect(state.deferredExternalChanges['1']).toEqual(change);
  });

  it('applies a different field even while another field has a pending local write', () => {
    let state = taskBoardReducer(initState(), {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'done',
    });
    const change: ExternalChange = {
      taskId: '1',
      field: 'priority',
      previousValue: 'high',
      nextValue: 'low',
      actor: 'Sam',
    };
    state = taskBoardReducer(state, {
      type: 'external-change-received',
      change,
    });

    const task = state.tasks.find((t) => t.id === '1');
    expect(task?.priority).toBe('low');
    // The pending status write is untouched by the unrelated-field change.
    expect(task?.status).toBe('done');
    expect(state.deferredExternalChanges['1']).toBeUndefined();
  });

  it('reassigns the assignee field', () => {
    const change: ExternalChange = {
      taskId: '2',
      field: 'assignee',
      previousValue: 'Jane Smith',
      nextValue: 'Morgan',
      actor: 'Alex',
    };
    const state = taskBoardReducer(initState(), {
      type: 'external-change-received',
      change,
    });
    expect(state.tasks.find((t) => t.id === '2')?.assignee).toBe('Morgan');
  });

  it('defers a change to ANY field while the task is being edited (not just a matching field)', () => {
    let state = taskBoardReducer(initState(), {
      type: 'edit-started',
      taskId: '1',
    });
    const change: ExternalChange = {
      taskId: '1',
      field: 'priority',
      previousValue: 'high',
      nextValue: 'low',
      actor: 'Sam',
    };
    state = taskBoardReducer(state, {
      type: 'external-change-received',
      change,
    });

    // Unlike a status-write (which only blocks the 'status' field), an open
    // edit session blocks every field since the user could change any of
    // them before saving.
    expect(state.tasks.find((t) => t.id === '1')?.priority).toBe('high');
    expect(state.deferredExternalChanges['1']).toEqual(change);
  });
});

describe('task-created', () => {
  it('prepends the new task', () => {
    const newTask: Task = { ...baseTask, id: '3', title: 'New task' };
    const state = taskBoardReducer(initState(), {
      type: 'task-created',
      task: newTask,
    });
    expect(state.tasks[0]).toBe(newTask);
    expect(state.tasks).toHaveLength(3);
  });
});

describe('tasks-replaced', () => {
  it('replaces the task list and clears pending/deferred state', () => {
    let state = taskBoardReducer(initState(), {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'done',
    });
    const replacement: Task[] = [{ ...baseTask, id: '99' }];
    state = taskBoardReducer(state, {
      type: 'tasks-replaced',
      tasks: replacement,
    });

    expect(state.tasks).toBe(replacement);
    expect(state.pendingUpdates).toEqual({});
    expect(state.deferredExternalChanges).toEqual({});
  });
});

describe('edit-started', () => {
  it('marks the task as pending with kind "editing"', () => {
    const state = taskBoardReducer(initState(), {
      type: 'edit-started',
      taskId: '1',
    });
    expect(state.pendingUpdates['1']).toEqual({ kind: 'editing' });
    expect(isTaskPending(state, '1')).toBe(true);
    // Unlike a status-write, opening the edit modal doesn't touch the task
    // itself until the user saves.
    expect(state.tasks.find((t) => t.id === '1')).toBe(baseTask);
  });

  it('is a no-op for an unknown task id', () => {
    const state = initState();
    const next = taskBoardReducer(state, {
      type: 'edit-started',
      taskId: 'missing',
    });
    expect(next).toBe(state);
  });

  it('is a no-op if the task already has a pending status write', () => {
    const state = taskBoardReducer(initState(), {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'done',
    });
    const next = taskBoardReducer(state, {
      type: 'edit-started',
      taskId: '1',
    });
    expect(next).toBe(state);
  });
});

describe('edit-cancelled', () => {
  it('clears the pending "editing" entry without changing the task', () => {
    const editing = taskBoardReducer(initState(), {
      type: 'edit-started',
      taskId: '1',
    });
    const cancelled = taskBoardReducer(editing, {
      type: 'edit-cancelled',
      taskId: '1',
    });

    expect(isTaskPending(cancelled, '1')).toBe(false);
    expect(cancelled.tasks.find((t) => t.id === '1')).toEqual(baseTask);
  });

  it('applies a deferred external change once the edit is cancelled', () => {
    let state = taskBoardReducer(initState(), {
      type: 'edit-started',
      taskId: '1',
    });
    const change: ExternalChange = {
      taskId: '1',
      field: 'priority',
      previousValue: 'high',
      nextValue: 'low',
      actor: 'Sam',
    };
    state = taskBoardReducer(state, {
      type: 'external-change-received',
      change,
    });
    expect(state.deferredExternalChanges['1']).toEqual(change);

    state = taskBoardReducer(state, {
      type: 'edit-cancelled',
      taskId: '1',
    });

    expect(state.deferredExternalChanges['1']).toBeUndefined();
    // Cancelling means the local edit never happened, so the deferred
    // external change applies — same "didn't stick" rule as a failed
    // status write.
    expect(state.tasks.find((t) => t.id === '1')?.priority).toBe('low');
  });

  it('is a no-op when the task has no pending edit', () => {
    const state = initState();
    const next = taskBoardReducer(state, {
      type: 'edit-cancelled',
      taskId: '1',
    });
    expect(next).toBe(state);
  });

  it('is a no-op for a pending status-write (not an edit)', () => {
    const state = taskBoardReducer(initState(), {
      type: 'status-change-requested',
      taskId: '1',
      nextStatus: 'done',
    });
    const next = taskBoardReducer(state, {
      type: 'edit-cancelled',
      taskId: '1',
    });
    expect(next).toBe(state);
  });
});

describe('edit-saved', () => {
  const edits = {
    title: 'Updated title',
    description: 'Updated description',
    assignee: 'Amy Burns',
    priority: 'low' as const,
    tags: ['ops'],
  };

  it('applies the edited fields and clears the pending entry', () => {
    const editing = taskBoardReducer(initState(), {
      type: 'edit-started',
      taskId: '1',
    });
    const saved = taskBoardReducer(editing, {
      type: 'edit-saved',
      taskId: '1',
      updates: edits,
    });

    expect(isTaskPending(saved, '1')).toBe(false);
    const task = saved.tasks.find((t) => t.id === '1');
    expect(task).toMatchObject(edits);
    // id/status/createdAt are untouched by an edit.
    expect(task?.id).toBe('1');
    expect(task?.status).toBe('todo');
    expect(task?.createdAt).toBe(baseTask.createdAt);
  });

  it('discards a deferred conflicting external change (the save wins)', () => {
    let state = taskBoardReducer(initState(), {
      type: 'edit-started',
      taskId: '1',
    });
    const change: ExternalChange = {
      taskId: '1',
      field: 'priority',
      previousValue: 'high',
      nextValue: 'medium',
      actor: 'Sam',
    };
    state = taskBoardReducer(state, {
      type: 'external-change-received',
      change,
    });

    state = taskBoardReducer(state, {
      type: 'edit-saved',
      taskId: '1',
      updates: edits,
    });

    expect(state.deferredExternalChanges['1']).toBeUndefined();
    expect(state.tasks.find((t) => t.id === '1')?.priority).toBe('low');
  });

  it('is a no-op when the task has no pending edit', () => {
    const state = initState();
    const next = taskBoardReducer(state, {
      type: 'edit-saved',
      taskId: '1',
      updates: edits,
    });
    expect(next).toBe(state);
  });
});

describe('task-deleted', () => {
  it('removes the task from the list', () => {
    const state = taskBoardReducer(initState(), {
      type: 'task-deleted',
      taskId: '1',
    });
    expect(state.tasks.find((t) => t.id === '1')).toBeUndefined();
    expect(state.tasks).toHaveLength(1);
  });

  it('clears any pending update and deferred change for the deleted task', () => {
    let state = taskBoardReducer(initState(), {
      type: 'edit-started',
      taskId: '1',
    });
    state = taskBoardReducer(state, {
      type: 'external-change-received',
      change: {
        taskId: '1',
        field: 'priority',
        previousValue: 'high',
        nextValue: 'low',
        actor: 'Sam',
      },
    });

    state = taskBoardReducer(state, { type: 'task-deleted', taskId: '1' });

    expect(state.pendingUpdates['1']).toBeUndefined();
    expect(state.deferredExternalChanges['1']).toBeUndefined();
    expect(state.tasks.find((t) => t.id === '1')).toBeUndefined();
  });

  it('is a no-op for an unknown task id (returns an equivalent, filtered list)', () => {
    const state = initState();
    const next = taskBoardReducer(state, {
      type: 'task-deleted',
      taskId: 'missing',
    });
    expect(next.tasks).toEqual(state.tasks);
    expect(next.tasks).not.toBe(state.tasks);
  });
});
