'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  UpdateTaskStatusOptions,
  updateTaskStatus as defaultUpdateTaskStatus,
} from '@/app/lib/api/tasks-api';
import {
  ExternalChange,
  SimulatorOptions,
  scheduleExternalChanges,
} from '@/app/lib/api/realtime-simulator';
import { NewTaskInput, Task, TaskStatus } from '@/app/lib/definitions';
import {
  createInitialTaskBoardState,
  taskBoardReducer,
  wouldConflict,
} from '@/app/lib/taskboard-reducer';
import { createTaskFromInput } from '@/app/lib/taskboard-utils';
import { useToasts } from '@/app/lib/hooks/use-toasts';

const FIELD_LABELS: Record<ExternalChange['field'], string> = {
  status: 'status',
  priority: 'priority',
  assignee: 'assignee',
};

export type UseTaskBoardOptions = {
  /** Injectable for tests; defaults to the simulated fetch in tasks-api.ts. */
  updateTaskStatus?: (
    taskId: string,
    status: TaskStatus,
    options?: UpdateTaskStatusOptions,
  ) => Promise<{ taskId: string; status: TaskStatus }>;
  apiOptions?: UpdateTaskStatusOptions;
  /** Set enabled: false in tests to avoid an unawaited background timer loop. */
  simulator?: SimulatorOptions & { enabled?: boolean };
};

export function useTaskBoard(
  initialTasks: Task[],
  {
    updateTaskStatus = defaultUpdateTaskStatus,
    apiOptions,
    simulator,
  }: UseTaskBoardOptions = {},
) {
  const [state, dispatch] = useReducer(
    taskBoardReducer,
    initialTasks,
    createInitialTaskBoardState,
  );
  const { toasts, showToast, dismissToast } = useToasts();

  // Always-fresh snapshot for callbacks (API resolution, simulator ticks)
  // that fire after the render that created them — reading `state` directly
  // there would close over a stale value.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // A task with a pending status-write (in-flight drag) shows a spinner;
  // one with an open edit session shows a "being edited" indicator instead.
  // Split for display purposes even though both share the same underlying
  // pendingUpdates lock.
  const pendingTaskIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [id, update] of Object.entries(state.pendingUpdates)) {
      if (update.kind === 'status-write') ids.add(id);
    }
    return ids;
  }, [state.pendingUpdates]);

  const editingTaskIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [id, update] of Object.entries(state.pendingUpdates)) {
      if (update.kind === 'editing') ids.add(id);
    }
    return ids;
  }, [state.pendingUpdates]);

  // useReducer's `state` (and thus stateRef, which only refreshes in an
  // effect after commit) doesn't update synchronously between two calls in
  // the same tick — e.g. a fast double-drag, or a drag started right after
  // opening the edit modal. This ref tracks "locked for any reason"
  // (in-flight status write OR open edit session) and is mutated
  // immediately, so every guard below is race-free regardless of render
  // timing.
  const lockedTaskIdsRef = useRef<Set<string>>(new Set());

  const changeTaskStatus = useCallback(
    (taskId: string, nextStatus: TaskStatus) => {
      const task = stateRef.current.tasks.find((t) => t.id === taskId);
      if (!task || task.status === nextStatus) return;
      if (lockedTaskIdsRef.current.has(taskId)) return;

      lockedTaskIdsRef.current.add(taskId);
      dispatch({ type: 'status-change-requested', taskId, nextStatus });

      updateTaskStatus(taskId, nextStatus, apiOptions).then(
        () => {
          lockedTaskIdsRef.current.delete(taskId);
          const deferred = stateRef.current.deferredExternalChanges[taskId];
          dispatch({ type: 'status-change-succeeded', taskId });
          if (deferred) {
            showToast({
              message: `Your update to "${task.title}" was saved. A conflicting change from ${deferred.actor} was discarded.`,
              variant: 'info',
            });
          }
        },
        () => {
          lockedTaskIdsRef.current.delete(taskId);
          const deferred = stateRef.current.deferredExternalChanges[taskId];
          dispatch({ type: 'status-change-failed', taskId });
          showToast({
            message: `Failed to update "${task.title}". Reverted to its previous status.`,
            variant: 'error',
          });
          if (deferred) {
            showToast({
              message: `${deferred.actor}'s update to "${task.title}" was applied instead.`,
              variant: 'info',
            });
          }
        },
      );
    },
    [apiOptions, showToast, updateTaskStatus],
  );

  const createTask = useCallback((input: NewTaskInput) => {
    dispatch({ type: 'task-created', task: createTaskFromInput(input) });
  }, []);

  const loadTasks = useCallback((tasks: Task[]) => {
    lockedTaskIdsRef.current.clear();
    dispatch({ type: 'tasks-replaced', tasks });
  }, []);

  const startEditingTask = useCallback((taskId: string) => {
    if (lockedTaskIdsRef.current.has(taskId)) return;
    if (!stateRef.current.tasks.some((t) => t.id === taskId)) return;

    lockedTaskIdsRef.current.add(taskId);
    dispatch({ type: 'edit-started', taskId });
  }, []);

  const cancelEditingTask = useCallback(
    (taskId: string) => {
      lockedTaskIdsRef.current.delete(taskId);
      const task = stateRef.current.tasks.find((t) => t.id === taskId);
      const deferred = stateRef.current.deferredExternalChanges[taskId];
      dispatch({ type: 'edit-cancelled', taskId });
      if (deferred && task) {
        showToast({
          message: `${deferred.actor}'s update to "${task.title}" was applied.`,
          variant: 'info',
        });
      }
    },
    [showToast],
  );

  const saveTaskEdits = useCallback(
    (taskId: string, updates: NewTaskInput) => {
      lockedTaskIdsRef.current.delete(taskId);
      const deferred = stateRef.current.deferredExternalChanges[taskId];
      dispatch({ type: 'edit-saved', taskId, updates });
      if (deferred) {
        showToast({
          message: `Your changes to "${updates.title}" were saved. A conflicting update from ${deferred.actor} was discarded.`,
          variant: 'info',
        });
      }
    },
    [showToast],
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      lockedTaskIdsRef.current.delete(taskId);
      const task = stateRef.current.tasks.find((t) => t.id === taskId);
      dispatch({ type: 'task-deleted', taskId });
      showToast({
        message: `Deleted "${task?.title ?? 'the task'}".`,
        variant: 'success',
      });
    },
    [showToast],
  );

  useEffect(() => {
    if (simulator?.enabled === false) return;

    const handleExternalChange = (change: ExternalChange) => {
      const task = stateRef.current.tasks.find((t) => t.id === change.taskId);
      if (!task) return;

      const conflict = wouldConflict(stateRef.current, change);
      dispatch({ type: 'external-change-received', change });

      if (conflict) {
        showToast({
          message: `${change.actor} tried to update "${task.title}"'s ${FIELD_LABELS[change.field]} while your change was in progress. It'll resolve once yours completes.`,
          variant: 'info',
        });
      } else {
        showToast({
          message: `${change.actor} changed "${task.title}"'s ${FIELD_LABELS[change.field]} to "${change.nextValue}".`,
          variant: 'info',
        });
      }
    };

    return scheduleExternalChanges(
      () => stateRef.current.tasks,
      handleExternalChange,
      simulator,
    );
    // Intentionally run once per mount: the simulator reads live state via
    // stateRef rather than needing to be re-created on every task change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulator?.enabled]);

  return {
    tasks: state.tasks,
    pendingTaskIds,
    editingTaskIds,
    toasts,
    dismissToast,
    changeTaskStatus,
    createTask,
    loadTasks,
    startEditingTask,
    cancelEditingTask,
    saveTaskEdits,
    deleteTask,
  };
}
