import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { TaskDrawer } from '@/features/tasks/components/TaskDrawer';
import { QuickAddModal } from '@/components/layout/QuickAddModal';

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
      <TaskDrawer />
      <QuickAddModal />
    </div>
  );
}
