import { fireEvent, render, screen } from '@testing-library/react';
import { generateTasks } from '@/app/lib/taskboard-utils';
import { VirtualTaskList } from '@/app/ui/taskboard/virtual-task-list';
import { CARD_HEIGHT_PX } from '@/app/ui/taskboard/task-card';

const CARD_GAP_PX = 8;
const ROW_HEIGHT_PX = CARD_HEIGHT_PX + CARD_GAP_PX;

describe('VirtualTaskList', () => {
  it('renders a small window of DOM nodes for a 1000-task list, not all 1000', () => {
    const tasks = generateTasks(1000);
    render(
      <VirtualTaskList
        tasks={tasks}
        draggedTaskId={null}
        pendingTaskIds={new Set()}
        editingTaskIds={new Set()}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onCardClick={jest.fn()}
        isHighlighted={false}
      />,
    );

    const renderedCards = screen.getAllByRole('listitem');
    // jest.setup.ts shims a ~800px-tall viewport; at a ~200px row height
    // plus overscan that's a few dozen rows at most — nowhere near 1000.
    // This is the actual proof that virtualization is doing something: a
    // naive `.map` over 1000 tasks would put 1000 listitems in the DOM.
    expect(renderedCards.length).toBeGreaterThan(0);
    expect(renderedCards.length).toBeLessThan(100);
  });

  it('still reserves the full scroll height for all tasks', () => {
    const tasks = generateTasks(1000);
    const { container } = render(
      <VirtualTaskList
        tasks={tasks}
        draggedTaskId={null}
        pendingTaskIds={new Set()}
        editingTaskIds={new Set()}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onCardClick={jest.fn()}
        isHighlighted={false}
      />,
    );

    const spacer = container.querySelector('[style*="position: relative"]');
    expect(spacer).not.toBeNull();
    expect(spacer).toHaveStyle({ height: `${1000 * ROW_HEIGHT_PX}px` });
  });

  it('spaces consecutive cards by exactly one row height, so none overlap', () => {
    // Regression test for a real bug: the row-height estimate fed to the
    // virtualizer had drifted from TaskCard's actual rendered height,
    // so later cards' fixed offsets landed on top of earlier ones.
    const tasks = generateTasks(20);
    const { container } = render(
      <VirtualTaskList
        tasks={tasks}
        draggedTaskId={null}
        pendingTaskIds={new Set()}
        editingTaskIds={new Set()}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onCardClick={jest.fn()}
        isHighlighted={false}
      />,
    );

    const rows = Array.from(
      container.querySelectorAll<HTMLElement>('[data-index]'),
    ).sort(
      (a, b) => Number(a.dataset.index) - Number(b.dataset.index),
    );
    expect(rows.length).toBeGreaterThan(1);

    const offsets = rows.map((row) => {
      const match = row.style.transform.match(/translateY\((\d+)px\)/);
      return match ? Number(match[1]) : NaN;
    });

    for (let i = 1; i < offsets.length; i++) {
      expect(offsets[i] - offsets[i - 1]).toBe(ROW_HEIGHT_PX);
    }
  });

  it('renders the first tasks in the list at the top of the scroll position', () => {
    const tasks = generateTasks(1000);
    render(
      <VirtualTaskList
        tasks={tasks}
        draggedTaskId={null}
        pendingTaskIds={new Set()}
        editingTaskIds={new Set()}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onCardClick={jest.fn()}
        isHighlighted={false}
      />,
    );

    expect(screen.getByText(tasks[0].title)).toBeInTheDocument();
  });

  it('applies the drag-over highlight to the scroll container', () => {
    const tasks = generateTasks(5);
    render(
      <VirtualTaskList
        tasks={tasks}
        draggedTaskId={null}
        pendingTaskIds={new Set()}
        editingTaskIds={new Set()}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onCardClick={jest.fn()}
        isHighlighted
      />,
    );

    expect(screen.getByTestId('virtual-task-list')).toHaveClass(
      'outline-dashed',
    );
  });

  it('applies the theme-aware scrollbar styling to the scroll container', () => {
    // Regression test: the column's scroll container previously had no
    // scrollbar styling, so it kept the browser's default (light) scrollbar
    // even in dark mode. `.taskboard-scrollbar` (styled in global.css with a
    // `.dark` override) fixes that.
    const tasks = generateTasks(5);
    render(
      <VirtualTaskList
        tasks={tasks}
        draggedTaskId={null}
        pendingTaskIds={new Set()}
        editingTaskIds={new Set()}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onCardClick={jest.fn()}
        isHighlighted={false}
      />,
    );

    expect(screen.getByTestId('virtual-task-list')).toHaveClass(
      'taskboard-scrollbar',
    );
  });

  it('marks a task as pending when its id is in pendingTaskIds', () => {
    const tasks = generateTasks(3);
    render(
      <VirtualTaskList
        tasks={tasks}
        draggedTaskId={null}
        pendingTaskIds={new Set([tasks[0].id])}
        editingTaskIds={new Set()}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onCardClick={jest.fn()}
        isHighlighted={false}
      />,
    );

    expect(
      screen.getByTestId(`task-card-${tasks[0].id}-pending`),
    ).toBeInTheDocument();
  });

  it('marks a task as being edited when its id is in editingTaskIds', () => {
    const tasks = generateTasks(3);
    render(
      <VirtualTaskList
        tasks={tasks}
        draggedTaskId={null}
        pendingTaskIds={new Set()}
        editingTaskIds={new Set([tasks[0].id])}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onCardClick={jest.fn()}
        isHighlighted={false}
      />,
    );

    expect(
      screen.getByTestId(`task-card-${tasks[0].id}-editing`),
    ).toBeInTheDocument();
  });

  it('calls onCardClick with the clicked task id', () => {
    const tasks = generateTasks(3);
    const onCardClick = jest.fn();
    render(
      <VirtualTaskList
        tasks={tasks}
        draggedTaskId={null}
        pendingTaskIds={new Set()}
        editingTaskIds={new Set()}
        onDragStartTask={jest.fn()}
        onDragEndTask={jest.fn()}
        onCardClick={onCardClick}
        isHighlighted={false}
      />,
    );

    fireEvent.click(screen.getByTestId(`task-card-${tasks[0].id}`));
    expect(onCardClick).toHaveBeenCalledWith(tasks[0].id);
  });
});
