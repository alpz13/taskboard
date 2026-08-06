import { mockTasks } from '@/app/lib/placeholder-data';
import { TaskBoard } from '@/app/ui/taskboard/task-board';

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-100 p-4 transition-colors dark:bg-gray-950 md:p-8">
      <TaskBoard initialTasks={mockTasks} />
    </main>
  );
}
