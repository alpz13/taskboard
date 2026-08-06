import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastViewport } from '@/app/ui/toast/toast-viewport';
import { Toast } from '@/app/lib/hooks/use-toasts';

describe('ToastViewport', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(
      <ToastViewport toasts={[]} onDismiss={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each toast message', () => {
    const toasts: Toast[] = [
      { id: '1', message: 'Update failed', variant: 'error' },
      { id: '2', message: 'Priya updated a task', variant: 'info' },
    ];
    render(<ToastViewport toasts={toasts} onDismiss={jest.fn()} />);

    expect(screen.getByText('Update failed')).toBeInTheDocument();
    expect(screen.getByText('Priya updated a task')).toBeInTheDocument();
  });

  it('calls onDismiss with the toast id when its close button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    const toasts: Toast[] = [{ id: 'abc', message: 'Bye', variant: 'success' }];
    render(<ToastViewport toasts={toasts} onDismiss={onDismiss} />);

    await user.click(
      screen.getByRole('button', { name: /dismiss notification/i }),
    );

    expect(onDismiss).toHaveBeenCalledWith('abc');
  });

  it('constrains the viewport to the screen width on mobile instead of a fixed max-width', () => {
    const toasts: Toast[] = [{ id: '1', message: 'Hi', variant: 'info' }];
    const { container } = render(
      <ToastViewport toasts={toasts} onDismiss={jest.fn()} />,
    );

    const viewport = container.firstElementChild;
    // Below sm: inset-x-4 (with no width class) lets the box's width be
    // determined by its left/right offsets, so it can never exceed
    // `100vw - 2rem`. The old `w-full` (100% of the viewport, regardless of
    // the `right-4` offset) is what pushed it off-screen on narrow devices;
    // that fixed sizing is now scoped to `sm:` and up.
    expect(viewport).toHaveClass('inset-x-4');
    expect(viewport).not.toHaveClass('w-full');
    expect(viewport).toHaveClass('sm:w-full', 'sm:max-w-sm', 'sm:right-4');
  });
});
