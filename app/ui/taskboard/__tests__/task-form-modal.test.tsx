import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskFormModal } from '@/app/ui/taskboard/task-form-modal';
import { NewTaskInput } from '@/app/lib/definitions';

describe('TaskFormModal', () => {
  it('renders nothing when closed', () => {
    render(
      <TaskFormModal
        isOpen={false}
        mode="create"
        assignees={[]}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('create mode', () => {
    it('shows the create title and button', () => {
      render(
        <TaskFormModal
          isOpen
          mode="create"
          assignees={[]}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
        />,
      );
      expect(screen.getByText('New Task')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Create Task' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /delete/i }),
      ).not.toBeInTheDocument();
    });

    it('starts with an empty form', () => {
      render(
        <TaskFormModal
          isOpen
          mode="create"
          assignees={[]}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
        />,
      );
      expect(screen.getByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/assignee/i)).toHaveValue('');
    });

    it('shows validation errors when required fields are missing', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(
        <TaskFormModal
          isOpen
          mode="create"
          assignees={[]}
          onClose={jest.fn()}
          onSubmit={onSubmit}
        />,
      );

      await user.click(screen.getByRole('button', { name: /create task/i }));

      expect(await screen.findByText('Title is required.')).toBeInTheDocument();
      expect(screen.getByText('Description is required.')).toBeInTheDocument();
      expect(screen.getByText('Assignee is required.')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits parsed form data without calling onClose itself (the caller closes via isOpen)', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      const onClose = jest.fn();
      render(
        <TaskFormModal
          isOpen
          mode="create"
          assignees={['John Doe']}
          onClose={onClose}
          onSubmit={onSubmit}
        />,
      );

      await user.type(screen.getByLabelText(/title/i), 'Write tests');
      await user.type(
        screen.getByLabelText(/description/i),
        'Cover the taskboard components',
      );
      await user.type(screen.getByLabelText(/assignee/i), 'Amy Burns');
      await user.selectOptions(screen.getByLabelText(/priority/i), 'high');
      await user.type(screen.getByLabelText(/tags/i), 'testing, frontend');

      await user.click(screen.getByRole('button', { name: /create task/i }));

      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Write tests',
        description: 'Cover the taskboard components',
        assignee: 'Amy Burns',
        priority: 'high',
        tags: ['testing', 'frontend'],
      });
      // Regression guard: the modal must not also call onClose here — see
      // the comment in task-form-modal.tsx. A prior version did, which
      // (combined with an impure setState updater on the caller's side)
      // caused a real double-submit bug.
      expect(onClose).not.toHaveBeenCalled();
    });

    it('closes when the backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(
        <TaskFormModal
          isOpen
          mode="create"
          assignees={[]}
          onClose={onClose}
          onSubmit={jest.fn()}
        />,
      );

      await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking inside the dialog content', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(
        <TaskFormModal
          isOpen
          mode="create"
          assignees={[]}
          onClose={onClose}
          onSubmit={jest.fn()}
        />,
      );

      await user.click(screen.getByRole('dialog'));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    const initialValues: NewTaskInput = {
      title: 'Implement authentication',
      description: 'Add JWT-based auth',
      assignee: 'John Doe',
      priority: 'high',
      tags: ['backend', 'security'],
    };

    it('shows the edit title and button', () => {
      render(
        <TaskFormModal
          isOpen
          mode="edit"
          assignees={[]}
          initialValues={initialValues}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />,
      );
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Save Changes' }),
      ).toBeInTheDocument();
    });

    it('prefills the form from initialValues, including joined tags', () => {
      render(
        <TaskFormModal
          isOpen
          mode="edit"
          assignees={[]}
          initialValues={initialValues}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />,
      );

      expect(screen.getByLabelText(/title/i)).toHaveValue(
        'Implement authentication',
      );
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'Add JWT-based auth',
      );
      expect(screen.getByLabelText(/assignee/i)).toHaveValue('John Doe');
      expect(screen.getByLabelText(/priority/i)).toHaveValue('high');
      expect(screen.getByLabelText(/tags/i)).toHaveValue('backend, security');
    });

    it('submits edited values', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(
        <TaskFormModal
          isOpen
          mode="edit"
          assignees={[]}
          initialValues={initialValues}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          onDelete={jest.fn()}
        />,
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated title');

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      expect(onSubmit).toHaveBeenCalledWith({
        ...initialValues,
        title: 'Updated title',
      });
    });

    it('requires two clicks on Delete before calling onDelete', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      render(
        <TaskFormModal
          isOpen
          mode="edit"
          assignees={[]}
          initialValues={initialValues}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          onDelete={onDelete}
        />,
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(deleteButton);
      expect(onDelete).not.toHaveBeenCalled();
      expect(
        screen.getByRole('button', { name: 'Confirm delete?' }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Confirm delete?' }));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('resets the delete-confirmation state when reopened', () => {
      const { rerender } = render(
        <TaskFormModal
          isOpen
          mode="edit"
          assignees={[]}
          initialValues={initialValues}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />,
      );

      rerender(
        <TaskFormModal
          isOpen={false}
          mode="edit"
          assignees={[]}
          initialValues={initialValues}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />,
      );
      rerender(
        <TaskFormModal
          isOpen
          mode="edit"
          assignees={[]}
          initialValues={initialValues}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('does not reset an in-progress edit when the parent re-renders with a new initialValues object', async () => {
      // Regression guard: initialValues is re-derived (new object reference)
      // on every parent render via `tasks.find(...)`. The reset effect must
      // only depend on `isOpen`, not `initialValues`, or the user's
      // in-progress edit would be clobbered on any unrelated re-render.
      const user = userEvent.setup();
      const { rerender } = render(
        <TaskFormModal
          isOpen
          mode="edit"
          assignees={[]}
          initialValues={{ ...initialValues }}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />,
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'A title the user is mid-typing');

      // Re-render with a brand new (but equal-content) initialValues object,
      // simulating the parent re-rendering for an unrelated reason.
      rerender(
        <TaskFormModal
          isOpen
          mode="edit"
          assignees={[]}
          initialValues={{ ...initialValues }}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
        />,
      );

      expect(screen.getByLabelText(/title/i)).toHaveValue(
        'A title the user is mid-typing',
      );
    });
  });
});
