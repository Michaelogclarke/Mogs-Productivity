'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useTaskUIStore } from '@/stores/taskUIStore';
import { TaskRow } from './TaskRow';
import { QuickAddInput } from './QuickAddInput';

export function TaskList() {
  const { currentView, filterProjectId, filterAreaId, searchQuery } = useTaskUIStore();
  const [inlineAddOpen, setInlineAddOpen] = useState(false);

  const { data: tasks, isLoading } = useTasks({
    view: currentView,
    search: searchQuery || undefined,
    projectId: filterProjectId,
    areaId: filterAreaId,
  });

  return (
    <div className="flex flex-col gap-1">
      {isLoading && (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">Loading…</div>
      )}

      {!isLoading && tasks?.length === 0 && (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
          {currentView === 'today' ? 'Nothing on the schedule — clear day.' : 'No tasks.'}
        </div>
      )}

      {tasks?.map((task) => <TaskRow key={task.id} task={task} />)}

      {/* Inline add */}
      <div className="mt-2 px-3">
        {inlineAddOpen ? (
          <QuickAddInput onClose={() => setInlineAddOpen(false)} />
        ) : (
          <button
            onClick={() => setInlineAddOpen(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
