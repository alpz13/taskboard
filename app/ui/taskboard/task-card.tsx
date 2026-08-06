'use client';

import { memo } from 'react';
import clsx from 'clsx';
import { PencilIcon } from '@heroicons/react/24/outline';
import { Task } from '@/app/lib/definitions';
import { PriorityBadge } from '@/app/ui/taskboard/priority-badge';

function formatCreatedDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  /** True while an optimistic status update for this task is in flight. */
  isPending: boolean;
  /** True while this task's edit modal is open. */
  isEditing: boolean;
  onDragStart: (taskId: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onClick: (taskId: string) => void;
}

// Exported so VirtualTaskList can derive its row-height estimate from this
// single value instead of hand-syncing a second magic number: the
// virtualizer positions every card at a fixed offset computed from that
// estimate, so if the two ever drifted apart, the next card's fixed offset
// would land on top of this one's overflow — which is exactly how this
// component used to overlap its neighbor before this fix. `h-[196px]` +
// `overflow-hidden` here, plus the `min-h-*` reservations below (line-clamp
// caps *longer* content but doesn't pad *shorter* content up to the same
// height — both directions have to be pinned), are what make 196px true
// regardless of title length, tag count, or description length, instead of
// merely a best-effort estimate.
export const CARD_HEIGHT_PX = 196;

function TaskCardComponent({
  task,
  isDragging,
  isPending,
  isEditing,
  onDragStart,
  onDragEnd,
  onClick,
}: TaskCardProps) {
  const isLocked = isPending || isEditing;

  return (
    <div
      draggable={!isLocked}
      role="listitem"
      aria-roledescription="Draggable task card"
      aria-busy={isPending}
      data-testid={`task-card-${task.id}`}
      onDragStart={(event) => onDragStart(task.id, event)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task.id)}
      style={{ height: CARD_HEIGHT_PX }}
      className={clsx(
        'relative flex flex-col gap-2 overflow-hidden rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition-opacity dark:border-gray-700 dark:bg-gray-800',
        isLocked
          ? 'cursor-wait opacity-70'
          : 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      {isPending && (
        <div
          data-testid={`task-card-${task.id}-pending`}
          aria-label="Saving update…"
          className="absolute right-2 top-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400"
        />
      )}
      {isEditing && !isPending && (
        <div
          data-testid={`task-card-${task.id}-editing`}
          aria-label="Being edited"
          title="Being edited"
          className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
        >
          <PencilIcon className="h-2.5 w-2.5" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-gray-900 dark:text-gray-100">
          {task.title}
        </h3>
        <PriorityBadge priority={task.priority} />
      </div>

      <p className="line-clamp-3 min-h-[3.75rem] text-sm text-gray-600 dark:text-gray-400">
        {task.description}
      </p>

      {/* Always rendered (even with zero tags) so this row's height doesn't
          vary with tag count; `flex-nowrap` + `overflow-hidden` keep it to a
          single row instead of wrapping to a second one. */}
      <div className="flex min-h-[22px] flex-nowrap gap-1 overflow-hidden">
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex min-w-0 items-center gap-1">
          <span
            aria-hidden
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
          >
            {task.assignee
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <span className="truncate">{task.assignee}</span>
        </span>
        <time dateTime={task.createdAt} className="shrink-0">
          {formatCreatedDate(task.createdAt)}
        </time>
      </div>
    </div>
  );
}

// Render-optimization notes (verified with React DevTools Profiler by
// dragging one card and checking which components flash as "rendered"):
//
// - TaskCard is wrapped in React.memo. `task` keeps referential identity
//   for every task that didn't change (the reducer only replaces the one
//   task object it touched — see updateTask() in taskboard-reducer.ts), and
//   `isPending`/`isEditing`/`isDragging` are primitives, so React.memo's
//   shallow comparison lets every *unaffected* card bail out before
//   rendering, even though its parent TaskColumn re-rendered (new `tasks`
//   array reference).
// - onDragStart/onDragEnd/onClick are stabilized with useCallback one level
//   up in TaskBoard, so they never trigger memo to invalidate on their own.
// - Net effect: a single optimistic status change or external-change tick
//   re-renders only the one TaskCard whose task/pending state actually
//   changed, not the other 999 in a 1000-task board.
export const TaskCard = memo(TaskCardComponent);
