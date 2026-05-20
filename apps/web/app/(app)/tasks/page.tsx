'use client';

import { useTaskUIStore } from '@/stores/taskUIStore';
import { TaskList } from '@/features/tasks/components/TaskList';
import { TodayView } from '@/features/tasks/components/TodayView';

export default function TasksPage() {
  const currentView = useTaskUIStore((s) => s.currentView);
  return currentView === 'today' ? <TodayView /> : <TaskList />;
}
