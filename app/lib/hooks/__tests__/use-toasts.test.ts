import { act, renderHook } from '@testing-library/react';
import { useToasts } from '@/app/lib/hooks/use-toasts';

describe('useToasts', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('adds a toast with a generated id', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.showToast({ message: 'Saved', variant: 'success' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Saved',
      variant: 'success',
    });
  });

  it('defaults to the info variant', () => {
    const { result } = renderHook(() => useToasts());
    act(() => {
      result.current.showToast({ message: 'Heads up' });
    });
    expect(result.current.toasts[0].variant).toBe('info');
  });

  it('auto-dismisses after the given duration', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.showToast({ message: 'Bye soon', durationMs: 3000 });
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('does not auto-dismiss when durationMs is 0', () => {
    const { result } = renderHook(() => useToasts());
    act(() => {
      result.current.showToast({ message: 'Sticky', durationMs: 0 });
    });
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(result.current.toasts).toHaveLength(1);
  });

  it('dismissToast removes a toast immediately', () => {
    const { result } = renderHook(() => useToasts());
    let id = '';
    act(() => {
      id = result.current.showToast({ message: 'Dismiss me' });
    });
    act(() => {
      result.current.dismissToast(id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('keeps multiple toasts independent', () => {
    const { result } = renderHook(() => useToasts());
    act(() => {
      result.current.showToast({ message: 'First' });
      result.current.showToast({ message: 'Second' });
    });
    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
  });
});
