'use client';

import { useEffect, useRef } from 'react';
import { X, Archive, RotateCcw, Check } from 'lucide-react';
import { useTask, useTaskMutations } from '../hooks/useTasks';
import { useTaskUIStore } from '@/stores/taskUIStore';
import { formatDate, isOverdue, priorityLabel, priorityColor } from '../utils/formatting';
import { cn } from '@/lib/utils';

export function TaskDrawer() {
  const { drawerOpen, selectedTaskId, closeDrawer } = useTaskUIStore();
  const { data: task } = useTask(selectedTaskId ?? '');
  const { completeTask, reopenTask, archiveTask } = useTaskMutations();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeDrawer]);

  if (!drawerOpen || !selectedTaskId) return null;

  const isDone = task?.status === 'done';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={closeDrawer}
        aria-hidden
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-background shadow-xl"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">Task detail</span>
            <button onClick={closeDrawer} className="rounded p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!task ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-y-auto p-4">
              {/* Title */}
              <h2
                className={cn(
                  'text-lg font-semibold leading-snug',
                  isDone && 'text-muted-foreground line-through',
                )}
              >
                {task.title}
              </h2>

              {/* Description */}
              {task.description && (
                <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
              )}

              {/* Metadata grid */}
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {task.status && (
                  <>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="capitalize">{task.status}</dd>
                  </>
                )}
                {task.priority && task.priority !== 'none' && (
                  <>
                    <dt className="text-muted-foreground">Priority</dt>
                    <dd className={cn('font-medium', priorityColor[task.priority])}>
                      {priorityLabel[task.priority]}
                    </dd>
                  </>
                )}
                {task.dueDate && (
                  <>
                    <dt className="text-muted-foreground">Due date</dt>
                    <dd className={cn(isOverdue(task.dueDate) && !isDone ? 'text-red-500' : '')}>
                      {formatDate(task.dueDate)}
                    </dd>
                  </>
                )}
                {task.scheduledFor && (
                  <>
                    <dt className="text-muted-foreground">Scheduled for</dt>
                    <dd>{formatDate(task.scheduledFor)}</dd>
                  </>
                )}
                {task.completedAt && (
                  <>
                    <dt className="text-muted-foreground">Completed</dt>
                    <dd>{formatDate(task.completedAt)}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatDate(task.createdAt)}</dd>
                {task.rawInput && (
                  <>
                    <dt className="col-span-2 mt-1 text-muted-foreground">Quick add input</dt>
                    <dd className="col-span-2 rounded bg-muted px-2 py-1 font-mono text-xs">
                      {task.rawInput}
                    </dd>
                  </>
                )}
              </dl>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-2">
                {isDone ? (
                  <button
                    onClick={() => reopenTask.mutate(task.id)}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reopen
                  </button>
                ) : (
                  <button
                    onClick={() => { completeTask.mutate(task.id); closeDrawer(); }}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Complete
                  </button>
                )}

                <button
                  onClick={() => { archiveTask.mutate(task.id); closeDrawer(); }}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
