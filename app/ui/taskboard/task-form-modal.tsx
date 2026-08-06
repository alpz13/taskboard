'use client';

import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { NewTaskInput, TaskPriority } from '@/app/lib/definitions';
import { parseTagsInput } from '@/app/lib/taskboard-utils';

export type TaskFormMode = 'create' | 'edit';

interface TaskFormModalProps {
  isOpen: boolean;
  mode: TaskFormMode;
  assignees: string[];
  /** Prefills the form in edit mode; ignored in create mode. */
  initialValues?: NewTaskInput;
  onClose: () => void;
  onSubmit: (input: NewTaskInput) => void;
  /** Only rendered (and required) in edit mode. */
  onDelete?: () => void;
}

type FormErrors = Partial<Record<'title' | 'description' | 'assignee', string>>;

const EMPTY_FORM = {
  title: '',
  description: '',
  assignee: '',
  priority: 'medium' as TaskPriority,
  tags: '',
};

function toFormState(values: NewTaskInput | undefined) {
  if (!values) return EMPTY_FORM;
  return {
    title: values.title,
    description: values.description,
    assignee: values.assignee,
    priority: values.priority,
    tags: values.tags.join(', '),
  };
}

export function TaskFormModal({
  isOpen,
  mode,
  assignees,
  initialValues,
  onClose,
  onSubmit,
  onDelete,
}: TaskFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const titleId = useId();
  const assigneeListId = useId();

  // Read via a ref (updated unconditionally every render, not as an effect
  // dependency) so the reset effect below can seed from the *latest*
  // initialValues at the moment the modal opens without re-running — and
  // resetting the user's in-progress edits — on every unrelated parent
  // re-render while it's open (initialValues is a freshly-derived object
  // each render in the caller).
  const initialValuesRef = useRef(initialValues);
  initialValuesRef.current = initialValues;

  // Reset form state whenever the modal is (re)opened.
  useEffect(() => {
    if (isOpen) {
      setForm(toFormState(initialValuesRef.current));
      setErrors({});
      setConfirmingDelete(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required.';
    if (!form.description.trim())
      nextErrors.description = 'Description is required.';
    if (!form.assignee.trim()) nextErrors.assignee = 'Assignee is required.';
    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      title: form.title,
      description: form.description,
      assignee: form.assignee,
      priority: form.priority,
      tags: parseTagsInput(form.tags),
    });
    // Deliberately not calling onClose() here: the caller is expected to
    // flip `isOpen` to false itself after handling the submit (see
    // TaskBoard's handleSubmitTask). onClose is reserved for the user
    // explicitly dismissing the form (Cancel/backdrop/Escape/X) — in edit
    // mode that path also discards the edit, which a successful save must
    // never trigger.
  }

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    onDelete?.();
  }

  const isEdit = mode === 'edit';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="task-title"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-2 outline-blue-500 focus:outline dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'task-title-error' : undefined}
            />
            {errors.title && (
              <p id="task-title-error" className="mt-1 text-xs text-red-600">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="task-description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-2 outline-blue-500 focus:outline dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? 'task-description-error' : undefined
              }
            />
            {errors.description && (
              <p
                id="task-description-error"
                className="mt-1 text-xs text-red-600"
              >
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="task-assignee"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Assignee <span className="text-red-500">*</span>
            </label>
            <input
              id="task-assignee"
              list={assigneeListId}
              value={form.assignee}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, assignee: event.target.value }))
              }
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-2 outline-blue-500 focus:outline dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              aria-invalid={Boolean(errors.assignee)}
              aria-describedby={
                errors.assignee ? 'task-assignee-error' : undefined
              }
            />
            <datalist id={assigneeListId}>
              {assignees.map((assignee) => (
                <option key={assignee} value={assignee} />
              ))}
            </datalist>
            {errors.assignee && (
              <p id="task-assignee-error" className="mt-1 text-xs text-red-600">
                {errors.assignee}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label
                htmlFor="task-priority"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={form.priority}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: event.target.value as TaskPriority,
                  }))
                }
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-2 outline-blue-500 focus:outline dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="task-tags"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Tags
              </label>
              <input
                id="task-tags"
                placeholder="frontend, urgent"
                value={form.tags}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, tags: event.target.value }))
                }
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-2 outline-blue-500 focus:outline dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDeleteClick}
                className={
                  confirmingDelete
                    ? 'rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500'
                    : 'rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
                }
              >
                {confirmingDelete ? 'Confirm delete?' : 'Delete'}
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <Button type="submit">{isEdit ? 'Save Changes' : 'Create Task'}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
