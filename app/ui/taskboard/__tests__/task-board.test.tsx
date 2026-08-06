import { StrictMode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Task, TaskStatus } from '@/app/lib/definitions';
import { TaskBoard } from '@/app/ui/taskboard/task-board';
import { ThemeProvider } from '@/app/ui/theme/theme-provider';
import { UseTaskBoardOptions } from '@/app/lib/hooks/use-task-board';

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Implement authentication',
    description: 'Add JWT-based auth',
    status: 'todo',
    priority: 'high',
    assignee: 'John Doe',
    tags: ['backend'],
    createdAt: '2024-11-20T10:00:00Z',
  },
  {
    id: '2',
    title: 'Design landing page',
    description: 'Create mockups for homepage',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'Jane Smith',
    tags: ['design'],
    createdAt: '2024-11-19T14:30:00Z',
  },
  {
    id: '3',
    title: 'Ship v1 release',
    description: 'Tag and publish the first release',
    status: 'done',
    priority: 'low',
    assignee: 'John Doe',
    tags: [],
    createdAt: '2024-11-01T09:00:00Z',
  },
];

function fakeApi(outcome: 'success' | 'failure', delayMs = 0) {
  return jest.fn((taskId: string, status: TaskStatus) => {
    return new Promise<{ taskId: string; status: TaskStatus }>(
      (resolve, reject) => {
        setTimeout(() => {
          if (outcome === 'success') resolve({ taskId, status });
          else reject(new Error('simulated failure'));
        }, delayMs);
      },
    );
  });
}

// TaskBoard renders a ThemeToggle (needs ThemeProvider context) and uses
// useTaskBoard for status changes (needs a fast/deterministic API and a
// disabled real-time simulator so tests don't wait on real timers or flake
// on real randomness) — see app/lib/hooks/use-task-board.ts.
function renderTaskBoard(
  tasks: Task[],
  taskBoardOptions: UseTaskBoardOptions = {
    updateTaskStatus: fakeApi('success'),
    simulator: { enabled: false },
  },
) {
  return render(
    <ThemeProvider>
      <TaskBoard initialTasks={tasks} taskBoardOptions={taskBoardOptions} />
    </ThemeProvider>,
  );
}

// React StrictMode (which Next.js enables by default, and which is why this
// surfaced in the real dev server rather than here) intentionally
// double-invokes setState updater *functions* to help surface impure ones.
// Plain render() doesn't opt into that, so a handler that (incorrectly)
// causes a side effect via an updater function can pass every other test in
// this file and still double-fire in the app. Only the regression test
// below needs this; the rest use the lighter renderTaskBoard.
function renderTaskBoardStrict(
  tasks: Task[],
  taskBoardOptions: UseTaskBoardOptions,
) {
  return render(
    <StrictMode>
      <ThemeProvider>
        <TaskBoard initialTasks={tasks} taskBoardOptions={taskBoardOptions} />
      </ThemeProvider>
    </StrictMode>,
  );
}

describe('TaskBoard', () => {
  it('renders each task in its status column', () => {
    renderTaskBoard(initialTasks);

    expect(
      within(screen.getByTestId('task-column-todo')).getByText(
        'Implement authentication',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('task-column-in-progress')).getByText(
        'Design landing page',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('task-column-done')).getByText(
        'Ship v1 release',
      ),
    ).toBeInTheDocument();
  });

  it('filters tasks by assignee', async () => {
    const user = userEvent.setup();
    renderTaskBoard(initialTasks);

    await user.selectOptions(
      screen.getByLabelText(/filter by assignee/i),
      'Jane Smith',
    );

    expect(screen.queryByText('Implement authentication')).not.toBeInTheDocument();
    expect(screen.queryByText('Ship v1 release')).not.toBeInTheDocument();
    expect(screen.getByText('Design landing page')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 tasks shown')).toBeInTheDocument();
  });

  it('filters tasks by priority', async () => {
    const user = userEvent.setup();
    renderTaskBoard(initialTasks);

    await user.selectOptions(
      screen.getByLabelText(/filter by priority/i),
      'high',
    );

    expect(screen.getByText('Implement authentication')).toBeInTheDocument();
    expect(screen.queryByText('Design landing page')).not.toBeInTheDocument();
    expect(screen.queryByText('Ship v1 release')).not.toBeInTheDocument();
  });

  it('opens the create task modal, submits a new task, and shows it in the Todo column', async () => {
    const user = userEvent.setup();
    renderTaskBoard(initialTasks);

    await user.click(screen.getByRole('button', { name: /new task/i }));
    const dialog = screen.getByRole('dialog');

    await user.type(
      within(dialog).getByLabelText(/title/i),
      'Write onboarding docs',
    );
    await user.type(
      within(dialog).getByLabelText(/description/i),
      'Document the setup process for new hires',
    );
    await user.type(
      within(dialog).getByLabelText(/assignee/i),
      'Amy Burns',
    );

    await user.click(within(dialog).getByRole('button', { name: /create task/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('task-column-todo')).getByText(
        'Write onboarding docs',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('4 of 4 tasks shown')).toBeInTheDocument();
  });

  describe('drag and drop status changes (optimistic update)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    function drag(taskId: string, toColumnTestId: string) {
      const card = screen.getByTestId(`task-card-${taskId}`);
      const column = screen.getByTestId(toColumnTestId);
      fireEvent.dragStart(card, {
        dataTransfer: { setData: jest.fn(), getData: () => taskId },
      });
      fireEvent.dragOver(column);
      fireEvent.drop(column, { dataTransfer: { getData: () => taskId } });
    }

    it('moves the card immediately (optimistic) and keeps it after the simulated API succeeds', async () => {
      renderTaskBoard(initialTasks, {
        updateTaskStatus: fakeApi('success', 2000),
        simulator: { enabled: false },
      });

      drag('1', 'task-column-done');

      // Optimistic: moved before the fake API has resolved.
      expect(
        within(screen.getByTestId('task-column-done')).getByText(
          'Implement authentication',
        ),
      ).toBeInTheDocument();
      expect(screen.getByTestId('task-card-1-pending')).toBeInTheDocument();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000);
      });

      expect(screen.queryByTestId('task-card-1-pending')).not.toBeInTheDocument();
      expect(
        within(screen.getByTestId('task-column-done')).getByText(
          'Implement authentication',
        ),
      ).toBeInTheDocument();
    });

    it('rolls back and shows an error toast when the simulated API fails', async () => {
      renderTaskBoard(initialTasks, {
        updateTaskStatus: fakeApi('failure', 2000),
        simulator: { enabled: false },
      });

      drag('1', 'task-column-done');
      expect(
        within(screen.getByTestId('task-column-done')).getByText(
          'Implement authentication',
        ),
      ).toBeInTheDocument();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000);
      });

      expect(
        within(screen.getByTestId('task-column-todo')).getByText(
          'Implement authentication',
        ),
      ).toBeInTheDocument();
      expect(
        within(screen.getByTestId('task-column-done')).queryByText(
          'Implement authentication',
        ),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(/failed to update/i);
    });
  });

  describe('editing and deleting tasks', () => {
    it('opens a prefilled edit modal when a task card is clicked', async () => {
      const user = userEvent.setup();
      renderTaskBoard(initialTasks);

      await user.click(screen.getByTestId('task-card-1'));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Edit Task')).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/title/i)).toHaveValue(
        'Implement authentication',
      );
      expect(within(dialog).getByLabelText(/assignee/i)).toHaveValue(
        'John Doe',
      );
    });

    it('saves edits and reflects them on the card', async () => {
      const user = userEvent.setup();
      renderTaskBoard(initialTasks);

      await user.click(screen.getByTestId('task-card-1'));
      const dialog = screen.getByRole('dialog');
      const titleInput = within(dialog).getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Implement OAuth');
      await user.click(
        within(dialog).getByRole('button', { name: 'Save Changes' }),
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        within(screen.getByTestId('task-column-todo')).getByText(
          'Implement OAuth',
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Implement authentication'),
      ).not.toBeInTheDocument();
    });

    it('discards edits when the modal is cancelled', async () => {
      const user = userEvent.setup();
      renderTaskBoard(initialTasks);

      await user.click(screen.getByTestId('task-card-1'));
      const dialog = screen.getByRole('dialog');
      const titleInput = within(dialog).getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'This should not be saved');
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.getByText('Implement authentication'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('This should not be saved'),
      ).not.toBeInTheDocument();
    });

    it('deletes the task after confirming', async () => {
      const user = userEvent.setup();
      renderTaskBoard(initialTasks);

      await user.click(screen.getByTestId('task-card-1'));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
      await user.click(
        within(dialog).getByRole('button', { name: 'Confirm delete?' }),
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Implement authentication'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('2 of 2 tasks shown')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(/deleted/i);
    });

    it('deletes exactly once under StrictMode (regression: an impure setState updater previously deleted/toasted twice)', async () => {
      const user = userEvent.setup();
      renderTaskBoardStrict(initialTasks, {
        updateTaskStatus: fakeApi('success'),
        simulator: { enabled: false },
      });

      await user.click(screen.getByTestId('task-card-1'));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
      await user.click(
        within(dialog).getByRole('button', { name: 'Confirm delete?' }),
      );

      // getByRole throws if more than one match exists, so this alone
      // proves a single toast — i.e. a single deleteTask() call.
      expect(screen.getByRole('status')).toHaveTextContent(/deleted/i);
      expect(screen.getByText('2 of 2 tasks shown')).toBeInTheDocument();
    });

    it('saves an edit exactly once under StrictMode', async () => {
      const user = userEvent.setup();
      renderTaskBoardStrict(initialTasks, {
        updateTaskStatus: fakeApi('success'),
        simulator: { enabled: false },
      });

      await user.click(screen.getByTestId('task-card-1'));
      const dialog = screen.getByRole('dialog');
      const titleInput = within(dialog).getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Implement OAuth');
      await user.click(
        within(dialog).getByRole('button', { name: 'Save Changes' }),
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getAllByText('Implement OAuth')).toHaveLength(1);
      expect(screen.getByText('3 of 3 tasks shown')).toBeInTheDocument();
    });

    it('disables dragging a card while its edit modal is open', async () => {
      const user = userEvent.setup();
      renderTaskBoard(initialTasks);

      await user.click(screen.getByTestId('task-card-1'));

      expect(screen.getByTestId('task-card-1')).toHaveAttribute(
        'draggable',
        'false',
      );
    });

    it('extends the conflict-deferral mechanism to an open edit session: a live external change is deferred, then applied on cancel', async () => {
      jest.useFakeTimers();
      // user-event's own internal delays are real-timer-based; without
      // this, awaiting user.click()/user.type() under fake timers hangs.
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      // Draw order [delay, task-idx, field-idx, actor-idx, value-idx]; 0.5
      // for field-idx lands on 'priority' (index 1 of 3) — a field a plain
      // status-write would never conflict on, proving this is the extended
      // (whole-task) rule, not the original (single-field) one.
      let i = 0;
      const sequence = [0, 0, 0.5, 0, 0];
      const random = () => sequence[i++ % sequence.length];

      renderTaskBoard(initialTasks, {
        updateTaskStatus: fakeApi('success'),
        simulator: {
          enabled: true,
          minDelayMs: 1000,
          maxDelayMs: 1000,
          random,
        },
      });

      await user.click(screen.getByTestId('task-card-1'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(1000);
      });

      // Deferred: the toast says a conflicting change is waiting, and the
      // task's priority (visible on the card behind the modal) is
      // untouched while the edit session is still open.
      expect(screen.getByRole('status')).toHaveTextContent(/in progress/i);
      expect(
        within(screen.getByTestId('task-card-1')).getByText('High'),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      // Cancelling means the edit never happened, so the deferred external
      // priority change applies now.
      expect(
        within(screen.getByTestId('task-card-1')).queryByText('High'),
      ).not.toBeInTheDocument();

      jest.useRealTimers();
    });
  });
});
