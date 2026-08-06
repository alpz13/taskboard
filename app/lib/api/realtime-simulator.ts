import { Task, TaskPriority, TaskStatus } from '@/app/lib/definitions';

export type ExternalChangeField = 'status' | 'priority' | 'assignee';

export type ExternalChange = {
  taskId: string;
  field: ExternalChangeField;
  previousValue: string;
  nextValue: string;
  actor: string;
};

export const SIMULATED_ACTORS = ['Priya', 'Sam', 'Jordan', 'Alex', 'Morgan'];
const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
const FIELDS: ExternalChangeField[] = ['status', 'priority', 'assignee'];

export type SimulatorOptions = {
  minDelayMs?: number;
  maxDelayMs?: number;
  /** Injected in tests for deterministic scheduling/choices. */
  random?: () => number;
};

/**
 * Stands in for a websocket/poll feed of another user's edits: on a random
 * 10-15s cadence, mutates one field of one existing task and reports the
 * change. Returns a cancel function to stop the loop (call from a `useEffect`
 * cleanup).
 */
export function scheduleExternalChanges(
  getTasks: () => Task[],
  onChange: (change: ExternalChange) => void,
  {
    minDelayMs = 10_000,
    maxDelayMs = 15_000,
    random = Math.random,
  }: SimulatorOptions = {},
): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;

  function scheduleNext() {
    const delay = minDelayMs + random() * (maxDelayMs - minDelayMs);
    timeoutId = setTimeout(tick, delay);
  }

  function tick() {
    if (cancelled) return;
    const tasks = getTasks();
    if (tasks.length > 0) {
      onChange(pickChange(tasks, random));
    }
    scheduleNext();
  }

  scheduleNext();

  return () => {
    cancelled = true;
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  };
}

function pickOne<T>(options: readonly T[], random: () => number): T {
  return options[Math.floor(random() * options.length)];
}

function pickChange(tasks: Task[], random: () => number): ExternalChange {
  const task = pickOne(tasks, random);
  const field = pickOne(FIELDS, random);
  const actor = pickOne(SIMULATED_ACTORS, random);

  if (field === 'status') {
    const nextValue = pickOne(
      STATUSES.filter((status) => status !== task.status),
      random,
    );
    return {
      taskId: task.id,
      field,
      previousValue: task.status,
      nextValue,
      actor,
    };
  }

  if (field === 'priority') {
    const nextValue = pickOne(
      PRIORITIES.filter((priority) => priority !== task.priority),
      random,
    );
    return {
      taskId: task.id,
      field,
      previousValue: task.priority,
      nextValue,
      actor,
    };
  }

  // Reassign to a simulated teammate so the change is visible even when
  // every task currently shares one assignee.
  const candidates = SIMULATED_ACTORS.filter((name) => name !== task.assignee);
  const nextValue = candidates.length > 0 ? pickOne(candidates, random) : actor;
  return {
    taskId: task.id,
    field,
    previousValue: task.assignee,
    nextValue,
    actor,
  };
}
