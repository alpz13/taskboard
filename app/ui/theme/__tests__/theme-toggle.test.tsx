import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/app/ui/theme/theme-provider';
import { ThemeToggle } from '@/app/ui/theme/theme-toggle';

function resetDom() {
  document.documentElement.classList.remove('dark');
  window.localStorage.clear();
}

describe('ThemeToggle', () => {
  afterEach(resetDom);

  it('starts in light mode with a label to switch to dark', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    ).toBeInTheDocument();
  });

  it('switches the whole app to dark mode when clicked, and back again', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('reflects a theme already applied before mount', () => {
    document.documentElement.classList.add('dark');
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeInTheDocument();
  });
});
