'use client';

import { useCallback, useMemo, useState } from 'react';
import { BoltIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { NewTaskInput, Task, TaskStatus } from '@/app/lib/definitions';
import {
  TASK_STATUSES,
  defaultTaskFilters,
  filterTasks,
  generateTasks,
  getUniqueAssignees,
  groupTasksByStatus,
} from '@/app/lib/taskboard-utils';
import { UseTaskBoardOptions, useTaskBoard } from '@/app/lib/hooks/use-task-board';
import { TaskColumn } from '@/app/ui/taskboard/task-column';
import { FilterBar } from '@/app/ui/taskboard/filter-bar';
import { TaskFormModal } from '@/app/ui/taskboard/task-form-modal';
import { ThemeToggle } from '@/app/ui/theme/theme-toggle';
import { ToastViewport } from '@/app/ui/toast/toast-viewport';

const DRAG_DATA_FORMAT = 'text/plain';
const STRESS_TEST_TASK_COUNT = 1000;

interface TaskBoardProps {
  initialTasks: Task[];
  /**
   * Escape hatch for injecting a fake API/simulator in tests (see
   * app/lib/hooks/use-task-board.ts). Left unset in production, so the real
   * route always gets the real simulated API and real-time simulator.
   */
  taskBoardOptions?: UseTaskBoardOptions;
}

// A single piece of state instead of separate `isModalOpen`/`editingTaskId`
// booleans+ids, so "which task (if any) is being edited" and "is the modal
// open at all" can never disagree with each other.
type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; taskId: string };

function toEditableInput(task: Task): NewTaskInput {
  return {
    title: task.title,
    description: task.description,
    assignee: task.assignee,
    priority: task.priority,
    tags: task.tags,
  };
}

export function TaskBoard({ initialTasks, taskBoardOptions }: TaskBoardProps) {
  const {
    tasks,
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
  } = useTaskBoard(initialTasks, taskBoardOptions);

  const [filters, setFilters] = useState(defaultTaskFilters);
  const [modalState, setModalState] = useState<ModalState>({ mode: 'closed' });
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Render-optimization notes (also see the memo comment at the bottom of
  // task-card.tsx for the leaf-level story). Verified with React DevTools
  // Profiler: record a session, drag one card between columns, and check
  // the flamegraph — only the moved TaskCard, its two TaskColumns, and
  // TaskBoard itself light up; the ~998 other cards in a 1000-task board
  // don't re-render.
  //
  // - filterTasks/groupTasksByStatus are pure O(n) functions; useMemo skips
  //   rerunning them unless `tasks` or `filters` actually changed (an
  //   optimistic status update, an external-change tick, or a create — not
  //   e.g. a ThemeToggle click, which only touches unrelated state).
  // - tasksByStatus is kept as its own memo (rather than inlined into the
  //   filteredTasks one) purely for separation of concerns: filtering and
  //   bucketing are independently testable pure functions in
  //   taskboard-utils.ts. They do sit in the same dependency chain, so in
  //   practice a filter change recomputes both.
  // - handleDragStartTask/handleDragEndTask/handleDropTask/handleCardClick
  //   are wrapped in useCallback so TaskColumn (React.memo'd) doesn't see a
  //   new function prop — and therefore doesn't re-render — on every
  //   TaskBoard render that isn't actually relevant to it.
  const assignees = useMemo(() => getUniqueAssignees(tasks), [tasks]);
  const filteredTasks = useMemo(
    () => filterTasks(tasks, filters),
    [tasks, filters],
  );
  const tasksByStatus = useMemo(
    () => groupTasksByStatus(filteredTasks),
    [filteredTasks],
  );

  const handleDragStartTask = useCallback(
    (taskId: string, event: React.DragEvent<HTMLDivElement>) => {
      event.dataTransfer.setData(DRAG_DATA_FORMAT, taskId);
      event.dataTransfer.effectAllowed = 'move';
      setDraggedTaskId(taskId);
    },
    [],
  );

  const handleDragEndTask = useCallback(() => {
    setDraggedTaskId(null);
  }, []);

  const handleDropTask = useCallback(
    (status: TaskStatus, event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      const taskId = event.dataTransfer.getData(DRAG_DATA_FORMAT) || draggedTaskId;
      setDraggedTaskId(null);
      if (!taskId) return;
      // changeTaskStatus applies the new status optimistically, kicks off
      // the simulated API call, and rolls back with a toast if it fails —
      // see app/lib/hooks/use-task-board.ts.
      changeTaskStatus(taskId, status);
    },
    [draggedTaskId, changeTaskStatus],
  );

  const handleLoadStressTestTasks = useCallback(() => {
    loadTasks(generateTasks(STRESS_TEST_TASK_COUNT));
  }, [loadTasks]);

  const handleCardClick = useCallback(
    (taskId: string) => {
      // Guards against opening a second modal, or opening one for a task
      // that's mid-drag: useTaskBoard's own lock (pendingTaskIds/
      // editingTaskIds) already no-ops startEditingTask in that case, but
      // checking here too avoids flipping modalState to 'edit' for a task
      // whose edit session never actually started.
      if (pendingTaskIds.has(taskId) || editingTaskIds.has(taskId)) return;
      startEditingTask(taskId);
      setModalState({ mode: 'edit', taskId });
    },
    [pendingTaskIds, editingTaskIds, startEditingTask],
  );

  const handleOpenCreateModal = useCallback(() => {
    setModalState({ mode: 'create' });
  }, []);

  // TaskFormModal only calls onClose for an explicit user dismissal
  // (Cancel/backdrop/Escape/X) — never automatically after onSubmit/delete
  // (see the comment in task-form-modal.tsx). So this is the *only* path
  // that can mean "the edit didn't get saved", and is the one place that
  // needs to resolve a deferred conflict via cancelEditingTask, extending
  // the same optimistic-write conflict-deferral mechanism used for drag
  // status changes: if a real-time change was deferred behind this edit
  // session, it applies now instead of being lost.
  //
  // Note: these handlers call useTaskBoard's dispatch-triggering functions
  // (cancelEditingTask/saveTaskEdits/createTask/deleteTask) directly in the
  // event-handler body, then set modalState as a separate, plain
  // (non-functional) update — deliberately not inside a setState updater.
  // Updater functions must be pure; React (in StrictMode, at least) can and
  // does invoke them twice, which previously fired these side effects
  // twice too (visible as a duplicated "Deleted" toast).
  const handleCloseModal = useCallback(() => {
    if (modalState.mode === 'edit') {
      cancelEditingTask(modalState.taskId);
    }
    setModalState({ mode: 'closed' });
  }, [modalState, cancelEditingTask]);

  const handleSubmitTask = useCallback(
    (input: NewTaskInput) => {
      if (modalState.mode === 'edit') {
        saveTaskEdits(modalState.taskId, input);
      } else {
        createTask(input);
      }
      setModalState({ mode: 'closed' });
    },
    [modalState, createTask, saveTaskEdits],
  );

  const handleDeleteTask = useCallback(() => {
    if (modalState.mode === 'edit') {
      deleteTask(modalState.taskId);
    }
    setModalState({ mode: 'closed' });
  }, [modalState, deleteTask]);

  const editingTask =
    modalState.mode === 'edit'
      ? tasks.find((t) => t.id === modalState.taskId)
      : undefined;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 md:text-2xl">
            Taskboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredTasks.length} of {tasks.length} tasks shown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLoadStressTestTasks}
            title={`Load ${STRESS_TEST_TASK_COUNT} generated tasks to demo virtualization/performance`}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <BoltIcon className="h-4 w-4" />
            Load {STRESS_TEST_TASK_COUNT} tasks
          </button>
          <ThemeToggle />
          <Button onClick={handleOpenCreateModal}>
            <PlusIcon className="mr-1 h-4 w-4" />
            New Task
          </Button>
        </div>
      </header>

      <FilterBar filters={filters} assignees={assignees} onChange={setFilters} />

      <div className="flex flex-col gap-4 md:flex-row">
        {TASK_STATUSES.map(({ id, label }) => (
          <TaskColumn
            key={id}
            status={id}
            title={label}
            tasks={tasksByStatus[id]}
            draggedTaskId={draggedTaskId}
            pendingTaskIds={pendingTaskIds}
            editingTaskIds={editingTaskIds}
            onDragStartTask={handleDragStartTask}
            onDragEndTask={handleDragEndTask}
            onDropTask={handleDropTask}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      <TaskFormModal
        isOpen={modalState.mode !== 'closed'}
        mode={modalState.mode === 'edit' ? 'edit' : 'create'}
        assignees={assignees}
        initialValues={editingTask ? toEditableInput(editingTask) : undefined}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTask}
        onDelete={modalState.mode === 'edit' ? handleDeleteTask : undefined}
      />

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
