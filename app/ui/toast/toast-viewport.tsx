'use client';

import clsx from 'clsx';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Toast, ToastVariant } from '@/app/lib/hooks/use-toasts';

const VARIANT_STYLES: Record<ToastVariant, string> = {
  info: 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
  error: 'bg-red-600 text-white',
  success: 'bg-emerald-600 text-white',
};

interface ToastViewportProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col gap-2 sm:inset-x-auto sm:left-auto sm:right-4 sm:w-full sm:max-w-sm"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={clsx(
            'pointer-events-auto flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm shadow-lg',
            VARIANT_STYLES[toast.variant],
          )}
        >
          <p>{toast.message}</p>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 opacity-80 hover:opacity-100"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
