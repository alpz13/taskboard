import { TaskStatus } from '@/app/lib/definitions';

export const SIMULATED_LATENCY_MS = 2000;
export const SIMULATED_FAILURE_RATE = 0.1;

export class TaskApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskApiError';
  }
}

export type UpdateTaskStatusResult = {
  taskId: string;
  status: TaskStatus;
};

export type UpdateTaskStatusOptions = {
  delayMs?: number;
  failureRate?: number;
  /** Injected in tests for deterministic pass/fail outcomes. */
  random?: () => number;
};

/**
 * Stands in for a real PATCH /tasks/:id/status endpoint: a fixed network
 * delay plus a random failure rate, so the caller can exercise optimistic
 * update + rollback UI without a backend.
 */
export function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  {
    delayMs = SIMULATED_LATENCY_MS,
    failureRate = SIMULATED_FAILURE_RATE,
    random = Math.random,
  }: UpdateTaskStatusOptions = {},
): Promise<UpdateTaskStatusResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (random() < failureRate) {
        reject(
          new TaskApiError(`Failed to update task ${taskId} to "${status}"`),
        );
        return;
      }
      resolve({ taskId, status });
    }, delayMs);
  });
}
