import { Task } from '@/app/lib/definitions';
import {
  ExternalChange,
  SIMULATED_ACTORS,
  scheduleExternalChanges,
} from '@/app/lib/api/realtime-simulator';

const tasks: Task[] = [
  {
    id: '1',
    title: 'Implement authentication',
    description: 'Add JWT-based auth',
    status: 'todo',
    priority: 'high',
    assignee: 'John Doe',
    tags: [],
    createdAt: '2024-11-20T10:00:00Z',
  },
  {
    id: '2',
    title: 'Design landing page',
    description: 'Create mockups',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'Jane Smith',
    tags: [],
    createdAt: '2024-11-19T10:00:00Z',
  },
];

// Cycles through a fixed sequence so each call to random() is deterministic.
function fakeRandom(sequence: number[]): () => number {
  let i = 0;
  return () => sequence[i++ % sequence.length];
}

describe('scheduleExternalChanges', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fires a change after a delay within [minDelayMs, maxDelayMs]', () => {
    const onChange = jest.fn();
    // min === max removes randomness from the delay itself, isolating the
    // pick logic for this assertion.
    const cancel = scheduleExternalChanges(() => tasks, onChange, {
      minDelayMs: 1000,
      maxDelayMs: 1000,
      random: fakeRandom([0, 0, 0, 0]),
    });

    jest.advanceTimersByTime(999);
    expect(onChange).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledTimes(1);

    const change: ExternalChange = onChange.mock.calls[0][0];
    expect(change.taskId).toBe(tasks[0].id);
    expect(change.field).toBe('status');
    expect(change.previousValue).toBe('todo');
    expect(change.nextValue).toBe('in-progress');
    expect(change.actor).toBe(SIMULATED_ACTORS[0]);

    cancel();
  });

  it('stops firing once cancelled', () => {
    const onChange = jest.fn();
    const cancel = scheduleExternalChanges(() => tasks, onChange, {
      minDelayMs: 1000,
      maxDelayMs: 1000,
      random: fakeRandom([0]),
    });

    jest.advanceTimersByTime(1000);
    expect(onChange).toHaveBeenCalledTimes(1);

    cancel();
    jest.advanceTimersByTime(5000);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('keeps rescheduling without calling onChange when there are no tasks', () => {
    const onChange = jest.fn();
    const cancel = scheduleExternalChanges(() => [], onChange, {
      minDelayMs: 1000,
      maxDelayMs: 1000,
      random: fakeRandom([0]),
    });

    jest.advanceTimersByTime(3000);
    expect(onChange).not.toHaveBeenCalled();

    cancel();
  });

  it('picks a priority change when the field draw lands there', () => {
    const onChange = jest.fn();
    // Draw order per cycle: [delay, task-idx, field-idx, actor-idx, value-idx].
    // field-idx of 0.5 -> floor(0.5*3)=1 -> 'priority'.
    const cancel = scheduleExternalChanges(() => tasks, onChange, {
      minDelayMs: 1000,
      maxDelayMs: 1000,
      random: fakeRandom([0, 0, 0.5, 0, 0]),
    });

    jest.advanceTimersByTime(1000);

    const change: ExternalChange = onChange.mock.calls[0][0];
    expect(change.field).toBe('priority');
    expect(change.previousValue).toBe(tasks[0].priority);
    expect(change.nextValue).not.toBe(tasks[0].priority);

    cancel();
  });
});
