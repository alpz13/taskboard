'use client';

import { memo, useState } from 'react';
import { Task, TaskStatus } from '@/app/lib/definitions';
import { VirtualTaskList } from '@/app/ui/taskboard/virtual-task-list';

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  draggedTaskId: string | null;
  pendingTaskIds: Set<string>;
  editingTaskIds: Set<string>;
  onDragStartTask: (taskId: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDragEndTask: () => void;
  onDropTask: (status: TaskStatus, event: React.DragEvent<HTMLElement>) => void;
  onCardClick: (taskId: string) => void;
}

function TaskColumnComponent({
  status,
  title,
  tasks,
  draggedTaskId,
  pendingTaskIds,
  editingTaskIds,
  onDragStartTask,
  onDragEndTask,
  onDropTask,
  onCardClick,
}: TaskColumnProps) {
  const [isOver, setIsOver] = useState(false);

  return (
    <section
      aria-label={`${title} column`}
      data-testid={`task-column-${status}`}
      className="flex min-h-[200px] w-full flex-col rounded-xl bg-gray-50 p-3 transition-colors dark:bg-gray-900 md:w-1/3"
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        setIsOver(false);
        onDropTask(status, event);
      }}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {tasks.length}
        </span>
      </header>

      {tasks.length === 0 ? (
        <div
          className={
            isOver
              ? 'flex grow items-center justify-center rounded-lg bg-blue-50 p-1 outline-dashed outline-2 outline-blue-300 dark:bg-blue-950 dark:outline-blue-700'
              : 'flex grow items-center justify-center rounded-lg p-1'
          }
        >
          <p className="px-2 py-6 text-center text-xs text-gray-400 dark:text-gray-600">
            No tasks
          </p>
        </div>
      ) : (
        <VirtualTaskList
          tasks={tasks}
          draggedTaskId={draggedTaskId}
          pendingTaskIds={pendingTaskIds}
          editingTaskIds={editingTaskIds}
          onDragStartTask={onDragStartTask}
          onDragEndTask={onDragEndTask}
          onCardClick={onCardClick}
          isHighlighted={isOver}
        />
      )}
    </section>
  );
}

// memo here is cheap insurance rather than the main win (VirtualTaskList
// below already caps actual DOM work regardless of how often this
// component's function body runs): it still avoids reconciling the other
// two columns' subtrees when only one column's `tasks`/`pendingTaskIds`
// prop changed.
export const TaskColumn = memo(TaskColumnComponent);
