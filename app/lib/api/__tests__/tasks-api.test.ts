import { TaskApiError, updateTaskStatus } from '@/app/lib/api/tasks-api';

describe('updateTaskStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves with the new status after the configured delay', async () => {
    const promise = updateTaskStatus('1', 'done', {
      delayMs: 2000,
      random: () => 0.99, // above any reasonable failure rate
    });

    jest.advanceTimersByTime(1999);
    await Promise.resolve();
    jest.advanceTimersByTime(1);

    await expect(promise).resolves.toEqual({ taskId: '1', status: 'done' });
  });

  it('rejects with a TaskApiError when the injected random falls under the failure rate', async () => {
    const promise = updateTaskStatus('1', 'done', {
      delayMs: 0,
      failureRate: 0.1,
      random: () => 0.05,
    });
    jest.advanceTimersByTime(0);

    await expect(promise).rejects.toBeInstanceOf(TaskApiError);
  });

  it('resolves when the injected random is above the failure rate', async () => {
    const promise = updateTaskStatus('1', 'todo', {
      delayMs: 0,
      failureRate: 0.1,
      random: () => 0.5,
    });
    jest.advanceTimersByTime(0);

    await expect(promise).resolves.toEqual({ taskId: '1', status: 'todo' });
  });
});
