import { fireEvent, render, screen } from '@testing-library/react';
import { Task } from '@/app/lib/definitions';
import { TaskColumn } from '@/app/ui/taskboard/task-column';

const tasks: Task[] = [
  {
    id: '1',
    title: 'Task one',
    description: 'First task',
    status: 'todo',
    priority: 'low',
    assignee: 'John Doe',
    tags: [],
    createdAt: '2024-11-20T10:00:00Z',
  },
  {
    id: '2',
    title: 'Task two',
    description: 'Second task',
    status: 'todo',
    priority: 'medium',
    assignee: 'Jane Smith',
    tags: [],
    createdAt: '2024-11-21T10:00:00Z',
  },
];

describe('TaskColumn', () => {
  it('renders the column title and task count', () => {
    render(
      <TaskColumn
        status="todo"
        title="Todo"
        tasks={tasks}
        draggedTaskId={null}
        pendingTaskIds={new Set()}
        editingTaskIds={new Set()}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onDropTask={jest.fn()}
        onCardClick={jest.fn()}
      />,
    );

    expect(screen.getByText('Todo')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Task one')).toBeInTheDocument();
    expect(screen.getByText('Task two')).toBeInTheDocument();
  });

  it('shows an empty state when there are no tasks', () => {
    render(
      <TaskColumn
        status="done"
        title="Done"
        tasks={[]}
        draggedTaskId={null}
        pendingTaskIds={new Set()}
        editingTaskIds={new Set()}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onDropTask={jest.fn()}
        onCardClick={jest.fn()}
      />,
    );

    expect(screen.getByText('No tasks')).toBeInTheDocument();
  });

  it('invokes onDropTask with its status when a task is dropped', () => {
    const onDropTask = jest.fn();
    render(
      <TaskColumn
        status="in-progress"
        title="In Progress"
        tasks={[]}
        draggedTaskId="1"
        pendingTaskIds={new Set()}
        editingTaskIds={new Set()}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onDropTask={onDropTask}
        onCardClick={jest.fn()}
      />,
    );

    const column = screen.getByTestId('task-column-in-progress');
    fireEvent.dragOver(column);
    fireEvent.drop(column, {
      dataTransfer: { getData: () => '1' },
    });

    expect(onDropTask).toHaveBeenCalledTimes(1);
    expect(onDropTask.mock.calls[0][0]).toBe('in-progress');
  });

  it('calls onCardClick with the clicked task id', () => {
    const onCardClick = jest.fn();
    render(
      <TaskColumn
        status="todo"
        title="Todo"
        tasks={tasks}
        draggedTaskId={null}
        pendingTaskIds={new Set()}
        editingTaskIds={new Set()}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onDropTask={jest.fn()}
        onCardClick={onCardClick}
      />,
    );

    fireEvent.click(screen.getByTestId('task-card-1'));
    expect(onCardClick).toHaveBeenCalledWith('1');
  });
});
