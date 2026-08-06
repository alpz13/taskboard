'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Task } from '@/app/lib/definitions';
import { CARD_HEIGHT_PX, TaskCard } from '@/app/ui/taskboard/task-card';

interface VirtualTaskListProps {
  tasks: Task[];
  draggedTaskId: string | null;
  pendingTaskIds: Set<string>;
  editingTaskIds: Set<string>;
  onDragStartTask: (taskId: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDragEndTask: () => void;
  onCardClick: (taskId: string) => void;
  isHighlighted: boolean;
}

// TaskCard is a fixed CARD_HEIGHT_PX tall (see the comment there for why —
// short version: line-clamp alone doesn't guarantee a *minimum* height, so
// TaskCard pins both directions). Every row's real footprint is that fixed
// card height plus the gap below it, so the row height fed to the
// virtualizer is derived from the same constant rather than hardcoded
// separately — two independently-maintained numbers that have to stay equal
// is exactly what caused cards to overlap before this was fixed.
const CARD_GAP_PX = 8;
const ROW_HEIGHT_PX = CARD_HEIGHT_PX + CARD_GAP_PX;
const OVERSCAN = 6;

/**
 * Renders only the task cards currently within (plus a small overscan
 * around) the scrollable viewport, so a column with hundreds or thousands
 * of tasks still only mounts a few dozen DOM nodes at a time. See
 * app/ui/taskboard/task-column.tsx for how this replaces a plain `.map`.
 */
export function VirtualTaskList({
  tasks,
  draggedTaskId,
  pendingTaskIds,
  editingTaskIds,
  onDragStartTask,
  onDragEndTask,
  onCardClick,
  isHighlighted,
}: VirtualTaskListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: OVERSCAN,
  });

  return (
    <div
      ref={scrollRef}
      role="list"
      data-testid="virtual-task-list"
      className={clsx(
        'taskboard-scrollbar max-h-[65vh] grow overflow-y-auto rounded-lg p-1 transition-colors',
        isHighlighted &&
          'bg-blue-50 outline-dashed outline-2 outline-blue-300 dark:bg-blue-950 dark:outline-blue-700',
      )}
    >
      <div
        style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const task = tasks[virtualItem.index];
          return (
            <div
              key={task.id}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                paddingBottom: CARD_GAP_PX,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TaskCard
                task={task}
                isDragging={draggedTaskId === task.id}
                isPending={pendingTaskIds.has(task.id)}
                isEditing={editingTaskIds.has(task.id)}
                onDragStart={onDragStartTask}
                onDragEnd={onDragEndTask}
                onClick={onCardClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
