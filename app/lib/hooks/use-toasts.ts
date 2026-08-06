'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastVariant = 'info' | 'error' | 'success';

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

export type ShowToastInput = {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

const DEFAULT_DURATION_MS = 5000;

/**
 * Small self-contained toast queue: no global provider, since only the
 * taskboard currently triggers notifications. Auto-dismiss timers are
 * tracked and cleared on unmount to avoid setting state on an unmounted
 * component.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const handles = timeouts.current;
    return () => {
      handles.forEach((handle) => clearTimeout(handle));
      handles.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const handle = timeouts.current.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      timeouts.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({
      message,
      variant = 'info',
      durationMs = DEFAULT_DURATION_MS,
    }: ShowToastInput) => {
      const id = `toast-${nextId.current++}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      if (durationMs > 0) {
        timeouts.current.set(id, setTimeout(() => dismissToast(id), durationMs));
      }
      return id;
    },
    [dismissToast],
  );

  return { toasts, showToast, dismissToast };
}
