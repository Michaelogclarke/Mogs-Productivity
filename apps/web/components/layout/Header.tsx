'use client';

import { Search, Plus, Sun, Moon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTaskUIStore } from '@/stores/taskUIStore';
import { useTheme } from '@/components/ThemeProvider';
import { useRef } from 'react';

const taskViewTitles: Record<string, string> = {
  today: 'Today',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
  all: 'All Tasks',
  completed: 'Completed',
};

function usePageTitle() {
  const pathname = usePathname();
  const currentView = useTaskUIStore((s) => s.currentView);

  if (pathname === '/inbox') return 'Inbox';
  if (pathname === '/notes') return 'Notes';
  if (pathname.startsWith('/notes/daily')) return 'Daily Notes';
  if (pathname.startsWith('/notes/templates')) return 'Templates';
  if (pathname.startsWith('/notes/')) return 'Note';
  if (pathname === '/tasks' || pathname.startsWith('/tasks')) {
    return taskViewTitles[currentView] ?? 'Tasks';
  }
  return 'Mogs';
}

export function Header() {
  const title = usePageTitle();
  const pathname = usePathname();
  const { searchQuery, setSearchQuery, setQuickAddOpen } = useTaskUIStore();
  const { resolvedTheme, setTheme } = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const isTaskView = pathname === '/tasks' || pathname.startsWith('/tasks');

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-sm">
      <h1 className="text-sm font-semibold">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Task search — only on tasks views */}
        {isTaskView && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-36 rounded-md border border-border bg-muted/60 pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground/60 focus:w-52 focus:ring-1 focus:ring-ring transition-all duration-200"
            />
          </div>
        )}

        {/* New task shortcut — only on task views */}
        {isTaskView && (
          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New task
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </header>
  );
}
