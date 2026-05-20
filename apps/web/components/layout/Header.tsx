'use client';

import { Search, Plus } from 'lucide-react';
import { useTaskUIStore } from '@/stores/taskUIStore';
import { useRef } from 'react';

const viewTitles: Record<string, string> = {
  today: 'Today',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
  all: 'All Tasks',
  completed: 'Completed',
};

export function Header() {
  const { currentView, searchQuery, setSearchQuery, setQuickAddOpen } = useTaskUIStore();
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
      <h1 className="text-sm font-semibold">{viewTitles[currentView] ?? 'Tasks'}</h1>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 w-40 rounded-md border border-border bg-muted pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:w-56 focus:ring-1 focus:ring-ring transition-all"
          />
        </div>

        {/* New task button */}
        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          New task
        </button>
      </div>
    </header>
  );
}
