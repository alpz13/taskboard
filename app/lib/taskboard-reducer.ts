import { ExternalChange } from '@/app/lib/api/realtime-simulator';
import { NewTaskInput, Task, TaskPriority, TaskStatus } from '@/app/lib/definitions';

export type PendingUpdate =
  // A drag-driven optimistic status write in flight against the simulated
  // API — the only field it touches is 'status'.
  | { kind: 'status-write'; field: 'status'; previousValue: TaskStatus; nextValue: TaskStatus }
  // The task's edit modal is open. Unlike a status-write, this isn't tied
  // to one field: the user could change any of title/description/
  // assignee/priority/tags before saving, so it's treated as "editing this
  // task" as a whole rather than "editing this field".
  | { kind: 'editing' };

export type TaskBoardState = {
  tasks: Task[];
  // At most one in-flight optimistic write (or open edit session) per task
  // — the UI disables dragging, and opening a second edit modal, while one
  // is already pending.
  pendingUpdates: Record<string, PendingUpdate>;
  // An external change that arrived for a task with a conflicting pending
  // entry. Held here until the local write/edit settles, then either
  // discarded (local succeeded) or applied (local failed/cancelled).
  deferredExternalChanges: Record<string, ExternalChange>;
};

export type TaskBoardAction =
  | { type: 'status-change-requested'; taskId: string; nextStatus: TaskStatus }
  | { type: 'status-change-succeeded'; taskId: string }
  | { type: 'status-change-failed'; taskId: string }
  | { type: 'external-change-received'; change: ExternalChange }
  | { type: 'task-created'; task: Task }
  | { type: 'tasks-replaced'; tasks: Task[] }
  | { type: 'edit-started'; taskId: string }
  | { type: 'edit-cancelled'; taskId: string }
  | { type: 'edit-saved'; taskId: string; updates: NewTaskInput }
  | { type: 'task-deleted'; taskId: string };

export function createInitialTaskBoardState(tasks: Task[]): TaskBoardState {
  return { tasks, pendingUpdates: {}, deferredExternalChanges: {} };
}

export function isTaskPending(state: TaskBoardState, taskId: string): boolean {
  return taskId in state.pendingUpdates;
}

/**
 * Shared with the hook that decides *what to tell the user* about an
 * incoming external change, so the toast copy and the actual reducer
 * transition can never disagree about what counts as a conflict.
 */
export function wouldConflict(state: TaskBoardState, change: ExternalChange): boolean {
  const pending = state.pendingUpdates[change.taskId];
  if (!pending) return false;
  // Editing blocks every field, since the user could be about to change any
  // of them; a status-write only blocks its own field (an external priority
  // bump while the user drags a card's status isn't a real conflict).
  if (pending.kind === 'editing') return true;
  return pending.field === change.field;
}

function updateTask(
  tasks: Task[],
  taskId: string,
  update: (task: Task) => Task,
): Task[] {
  return tasks.map((task) => (task.id === taskId ? update(task) : task));
}

function applyExternalChange(task: Task, change: ExternalChange): Task {
  switch (change.field) {
    case 'status':
      return { ...task, status: change.nextValue as TaskStatus };
    case 'priority':
      return { ...task, priority: change.nextValue as TaskPriority };
    case 'assignee':
      return { ...task, assignee: change.nextValue };
  }
}

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) return record;
  const next = { ...record };
  delete next[key];
  return next;
}

/**
 * Clears a task's pending entry and, if an external change was deferred
 * behind it, applies that change now — used by every "the local action
 * didn't end up sticking" path (status rollback, edit cancelled) so they
 * all resolve deferred conflicts the same way.
 */
function settlePendingWithoutLocalChange(
  state: TaskBoardState,
  taskId: string,
): TaskBoardState {
  const deferred = state.deferredExternalChanges[taskId];
  const tasks = deferred
    ? updateTask(state.tasks, taskId, (t) => applyExternalChange(t, deferred))
    : state.tasks;

  return {
    ...state,
    tasks,
    pendingUpdates: withoutKey(state.pendingUpdates, taskId),
    deferredExternalChanges: withoutKey(state.deferredExternalChanges, taskId),
  };
}

/**
 * Clears a task's pending entry and discards any deferred external change
 * — used by every "the local action succeeded" path (status confirmed,
 * edit saved), where the explicit local action wins over whatever was
 * waiting behind it.
 */
function settlePendingWithLocalChange(
  state: TaskBoardState,
  taskId: string,
): TaskBoardState {
  return {
    ...state,
    pendingUpdates: withoutKey(state.pendingUpdates, taskId),
    deferredExternalChanges: withoutKey(state.deferredExternalChanges, taskId),
  };
}

/**
 * Pure state transitions for the taskboard's optimistic-update and
 * real-time-conflict logic. Kept free of API calls, timers, and toasts so
 * every transition can be asserted directly in tests without mocking I/O —
 * see app/lib/__tests__/taskboard-reducer.test.ts.
 */
export function taskBoardReducer(
  state: TaskBoardState,
  action: TaskBoardAction,
): TaskBoardState {
  switch (action.type) {
    case 'status-change-requested': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      // Ignore if the task is missing, already at that status, or already
      // has a pending write/edit in flight (the UI shouldn't allow this,
      // but the reducer stays defensive rather than clobbering an
      // in-flight rollback target).
      if (!task || task.status === action.nextStatus) return state;
      if (isTaskPending(state, action.taskId)) return state;

      return {
        ...state,
        tasks: updateTask(state.tasks, action.taskId, (t) => ({
          ...t,
          status: action.nextStatus,
        })),
        pendingUpdates: {
          ...state.pendingUpdates,
          [action.taskId]: {
            kind: 'status-write',
            field: 'status',
            previousValue: task.status,
            nextValue: action.nextStatus,
          },
        },
      };
    }

    case 'status-change-succeeded': {
      const pending = state.pendingUpdates[action.taskId];
      if (!pending || pending.kind !== 'status-write') return state;
      // Local write confirmed: it wins over anything deferred behind it.
      return settlePendingWithLocalChange(state, action.taskId);
    }

    case 'status-change-failed': {
      const pending = state.pendingUpdates[action.taskId];
      if (!pending || pending.kind !== 'status-write') return state;

      // Roll back to the pre-optimistic value first, then hand off to the
      // shared "local action didn't stick" settlement, which applies
      // whatever external change had been deferred behind it.
      const rolledBack = updateTask(state.tasks, action.taskId, (t) => ({
        ...t,
        status: pending.previousValue,
      }));
      return settlePendingWithoutLocalChange(
        { ...state, tasks: rolledBack },
        action.taskId,
      );
    }

    case 'external-change-received': {
      const { change } = action;

      if (wouldConflict(state, change)) {
        return {
          ...state,
          deferredExternalChanges: {
            ...state.deferredExternalChanges,
            [change.taskId]: change,
          },
        };
      }

      // No conflict (different field, or no local write in flight): apply
      // immediately. This also correctly layers on top of an *unrelated*
      // pending field — e.g. an external priority change while the local
      // user is mid-drag on status — since both are separate spread updates
      // on the same task object.
      return {
        ...state,
        tasks: updateTask(state.tasks, change.taskId, (t) =>
          applyExternalChange(t, change),
        ),
      };
    }

    case 'task-created': {
      return { ...state, tasks: [action.task, ...state.tasks] };
    }

    case 'tasks-replaced': {
      return createInitialTaskBoardState(action.tasks);
    }

    case 'edit-started': {
      const taskExists = state.tasks.some((t) => t.id === action.taskId);
      // Same defensiveness as status-change-requested: don't clobber an
      // existing pending entry (the UI already prevents opening the edit
      // modal for a task that's mid-drag or already being edited).
      if (!taskExists || isTaskPending(state, action.taskId)) return state;

      return {
        ...state,
        pendingUpdates: {
          ...state.pendingUpdates,
          [action.taskId]: { kind: 'editing' },
        },
      };
    }

    case 'edit-cancelled': {
      const pending = state.pendingUpdates[action.taskId];
      if (!pending || pending.kind !== 'editing') return state;
      // The edit didn't happen, so — same as a rolled-back status write —
      // apply whatever external change had been deferred behind it.
      return settlePendingWithoutLocalChange(state, action.taskId);
    }

    case 'edit-saved': {
      const pending = state.pendingUpdates[action.taskId];
      if (!pending || pending.kind !== 'editing') return state;

      const edited = updateTask(state.tasks, action.taskId, (t) => ({
        ...t,
        ...action.updates,
      }));
      // The explicit save wins over anything deferred behind it.
      return settlePendingWithLocalChange(
        { ...state, tasks: edited },
        action.taskId,
      );
    }

    case 'task-deleted': {
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.taskId),
        pendingUpdates: withoutKey(state.pendingUpdates, action.taskId),
        deferredExternalChanges: withoutKey(
          state.deferredExternalChanges,
          action.taskId,
        ),
      };
    }

    default:
      return state;
  }
}
