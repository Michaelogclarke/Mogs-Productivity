'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Task } from '../types';
import { formatDate, isOverdue, priorityColor } from '../utils/formatting';
import { useTaskMutations } from '../hooks/useTasks';
import { useTaskUIStore } from '@/stores/taskUIStore';
import { cn } from '@/lib/utils';

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps) {
  const [completing, setCompleting] = useState(false);
  const { completeTask, reopenTask } = useTaskMutations();
  const openDrawer = useTaskUIStore((s) => s.openDrawer);
  const isDone = task.status === 'done';

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (completing) return;
    setCompleting(true);
    try {
      if (isDone) {
        await reopenTask.mutateAsync(task.id);
      } else {
        await completeTask.mutateAsync(task.id);
      }
    } finally {
      setCompleting(false);
    }
  };

  const dateStr = task.scheduledFor ?? task.dueDate;
  const overdue = !isDone && isOverdue(task.dueDate);

  return (
    <div
      onClick={() => openDrawer(task.id)}
      className={cn(
        'group flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/50',
        completing && 'opacity-50',
      )}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
          isDone
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-muted-foreground/40 hover:border-muted-foreground',
        )}
        aria-label={isDone ? 'Reopen task' : 'Complete task'}
      >
        {isDone && <Check className="h-2.5 w-2.5" />}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm',
            isDone && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </p>

        {/* Meta row */}
        {(dateStr || task.priority !== 'none') && (
          <div className="mt-0.5 flex items-center gap-2">
            {dateStr && (
              <span
                className={cn(
                  'text-xs',
                  overdue ? 'text-red-500' : 'text-muted-foreground',
                )}
              >
                {formatDate(dateStr)}
              </span>
            )}
            {task.priority !== 'none' && (
              <span className={cn('text-xs font-medium', priorityColor[task.priority])}>
                {task.priority}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
