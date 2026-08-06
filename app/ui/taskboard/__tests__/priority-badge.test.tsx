import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '@/app/ui/taskboard/priority-badge';

describe('PriorityBadge', () => {
  it.each([
    ['low', 'Low'],
    ['medium', 'Medium'],
    ['high', 'High'],
  ] as const)('renders the %s label', (priority, label) => {
    render(<PriorityBadge priority={priority} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
