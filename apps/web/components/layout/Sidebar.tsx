'use client';

import { CalendarDays, CheckSquare, Clock, Inbox, List, LayoutDashboard } from 'lucide-react';
import { useTaskUIStore } from '@/stores/taskUIStore';
import { cn } from '@/lib/utils';

const views = [
  { id: 'today', label: 'Today', icon: CalendarDays },
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
  { id: 'overdue', label: 'Overdue', icon: LayoutDashboard },
  { id: 'all', label: 'All Tasks', icon: List },
  { id: 'completed', label: 'Completed', icon: CheckSquare },
] as const;

export function Sidebar() {
  const { currentView, setView } = useTaskUIStore();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-muted/30 px-2 py-4">
      <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Tasks
      </div>

      <nav className="flex flex-col gap-0.5">
        {views.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
              currentView === id
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-4 border-t border-border pt-4">
        <button
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Inbox className="h-4 w-4" />
          Inbox
        </button>
      </div>
    </aside>
  );
}
