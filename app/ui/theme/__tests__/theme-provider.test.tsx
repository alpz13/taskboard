import { renderHook, act } from '@testing-library/react';
import {
  THEME_STORAGE_KEY,
  ThemeProvider,
  useTheme,
} from '@/app/ui/theme/theme-provider';

function resetDom() {
  document.documentElement.classList.remove('dark');
  window.localStorage.clear();
}

describe('useTheme', () => {
  afterEach(resetDom);

  it('throws when used outside a ThemeProvider', () => {
    // Silence the expected React error log for this negative test.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within a ThemeProvider',
    );
    spy.mockRestore();
  });

  it('defaults to light when the html element has no dark class', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('picks up a pre-applied dark class (as the no-flash script would set)', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current.theme).toBe('dark');
  });

  it('toggles the theme, updates the html class, and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});
