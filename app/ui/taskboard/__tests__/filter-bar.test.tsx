import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '@/app/ui/taskboard/filter-bar';
import { defaultTaskFilters } from '@/app/lib/taskboard-utils';

describe('FilterBar', () => {
  it('debounces search input before calling onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <FilterBar
        filters={defaultTaskFilters}
        assignees={['John Doe', 'Jane Smith']}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByLabelText(/^search$/i), 'auth');
    expect(onChange).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        ...defaultTaskFilters,
        search: 'auth',
      }),
    );
  });

  it('applies assignee filter immediately', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <FilterBar
        filters={defaultTaskFilters}
        assignees={['John Doe', 'Jane Smith']}
        onChange={onChange}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText(/filter by assignee/i),
      'Jane Smith',
    );

    expect(onChange).toHaveBeenCalledWith({
      ...defaultTaskFilters,
      assignee: 'Jane Smith',
    });
  });

  it('applies priority filter immediately', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <FilterBar
        filters={defaultTaskFilters}
        assignees={[]}
        onChange={onChange}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText(/filter by priority/i),
      'high',
    );

    expect(onChange).toHaveBeenCalledWith({
      ...defaultTaskFilters,
      priority: 'high',
    });
  });
});
