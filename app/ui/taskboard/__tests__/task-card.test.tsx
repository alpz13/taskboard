import { fireEvent, render, screen } from '@testing-library/react';
import { Task } from '@/app/lib/definitions';
import { CARD_HEIGHT_PX, TaskCard } from '@/app/ui/taskboard/task-card';

const task: Task = {
  id: '42',
  title: 'Implement authentication',
  description: 'Add JWT-based auth',
  status: 'todo',
  priority: 'high',
  assignee: 'John Doe',
  tags: ['backend', 'security'],
  createdAt: '2024-11-20T10:00:00Z',
};

describe('TaskCard', () => {
  it('renders task details', () => {
    render(
      <TaskCard
        task={task}
        isDragging={false}
        isPending={false}
        isEditing={false}
        onDragStart={jest.fn()}
        onDragEnd={jest.fn()}
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByText('Implement authentication')).toBeInTheDocument();
    expect(screen.getByText('Add JWT-based auth')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('backend')).toBeInTheDocument();
    expect(screen.getByText('security')).toBeInTheDocument();
    expect(screen.getByText('Nov 20, 2024')).toBeInTheDocument();
  });

  it('is draggable and reports drag start with its id', () => {
    const onDragStart = jest.fn();
    render(
      <TaskCard
        task={task}
        isDragging={false}
        isPending={false}
        isEditing={false}
        onDragStart={onDragStart}
        onDragEnd={jest.fn()}
        onClick={jest.fn()}
      />,
    );

    const card = screen.getByTestId('task-card-42');
    expect(card).toHaveAttribute('draggable', 'true');

    fireEvent.dragStart(card);
    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart.mock.calls[0][0]).toBe('42');
  });

  it('calls onDragEnd when dragging finishes', () => {
    const onDragEnd = jest.fn();
    render(
      <TaskCard
        task={task}
        isDragging={false}
        isPending={false}
        isEditing={false}
        onDragStart={jest.fn()}
        onDragEnd={onDragEnd}
        onClick={jest.fn()}
      />,
    );

    fireEvent.dragEnd(screen.getByTestId('task-card-42'));
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('applies a reduced-opacity style while dragging', () => {
    render(
      <TaskCard
        task={task}
        isDragging
        isPending={false}
        isEditing={false}
        onDragStart={jest.fn()}
        onDragEnd={jest.fn()}
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByTestId('task-card-42')).toHaveClass('opacity-40');
  });

  it('shows a saving indicator and disables dragging while pending', () => {
    render(
      <TaskCard
        task={task}
        isDragging={false}
        isPending
        isEditing={false}
        onDragStart={jest.fn()}
        onDragEnd={jest.fn()}
        onClick={jest.fn()}
      />,
    );

    const card = screen.getByTestId('task-card-42');
    expect(card).toHaveAttribute('draggable', 'false');
    expect(card).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('task-card-42-pending')).toBeInTheDocument();
  });

  it('shows an editing indicator and disables dragging while it is being edited', () => {
    render(
      <TaskCard
        task={task}
        isDragging={false}
        isPending={false}
        isEditing
        onDragStart={jest.fn()}
        onDragEnd={jest.fn()}
        onClick={jest.fn()}
      />,
    );

    const card = screen.getByTestId('task-card-42');
    expect(card).toHaveAttribute('draggable', 'false');
    expect(screen.getByTestId('task-card-42-editing')).toBeInTheDocument();
    expect(screen.queryByTestId('task-card-42-pending')).not.toBeInTheDocument();
  });

  it('calls onClick with the task id when clicked', () => {
    const onClick = jest.fn();
    render(
      <TaskCard
        task={task}
        isDragging={false}
        isPending={false}
        isEditing={false}
        onDragStart={jest.fn()}
        onDragEnd={jest.fn()}
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByTestId('task-card-42'));
    expect(onClick).toHaveBeenCalledWith('42');
  });

  it('always renders at a fixed height, regardless of content length', () => {
    // Regression test: a real bug where cards taller than the virtual
    // list's row-height estimate (e.g. from a wrapping title, or extra
    // tags) overlapped the card below them. A fixed height + overflow
    // clipping guarantees every card occupies exactly the slot the
    // virtualizer reserves for it.
    const longTask: Task = {
      ...task,
      title:
        'A very long task title that would ordinarily wrap onto two or more lines',
      description:
        'A long description that goes on and on and on, well past three lines of wrapped text in a narrow card, to make sure it still gets clamped down to a fixed height.',
      tags: ['one', 'two', 'three', 'four', 'five'],
      assignee: 'A Very Long Assignee Name',
    };

    const { rerender } = render(
      <TaskCard
        task={task}
        isDragging={false}
        isPending={false}
        isEditing={false}
        onDragStart={jest.fn()}
        onDragEnd={jest.fn()}
        onClick={jest.fn()}
      />,
    );
    expect(screen.getByTestId('task-card-42')).toHaveStyle({
      height: `${CARD_HEIGHT_PX}px`,
    });

    rerender(
      <TaskCard
        task={longTask}
        isDragging={false}
        isPending={false}
        isEditing={false}
        onDragStart={jest.fn()}
        onDragEnd={jest.fn()}
        onClick={jest.fn()}
      />,
    );
    expect(screen.getByTestId('task-card-42')).toHaveStyle({
      height: `${CARD_HEIGHT_PX}px`,
    });
  });

  it('renders an (empty) tags row even when the task has no tags, keeping height consistent', () => {
    const untaggedTask: Task = { ...task, tags: [] };
    render(
      <TaskCard
        task={untaggedTask}
        isDragging={false}
        isPending={false}
        isEditing={false}
        onDragStart={jest.fn()}
        onDragEnd={jest.fn()}
        onClick={jest.fn()}
      />,
    );

    expect(screen.getByTestId('task-card-42')).toHaveStyle({
      height: `${CARD_HEIGHT_PX}px`,
    });
  });
});
