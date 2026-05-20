'use client';

import { useEffect, useState } from 'react';
import { X, Archive, RotateCcw, Check, Pencil } from 'lucide-react';
import { useTask, useTaskMutations } from '../hooks/useTasks';
import { useTaskUIStore } from '@/stores/taskUIStore';
import { formatDate, isOverdue, priorityColor } from '../utils/formatting';
import { cn } from '@/lib/utils';
import type { TaskPriority } from '../types';

export function TaskDrawer() {
  const { drawerOpen, selectedTaskId, closeDrawer } = useTaskUIStore();
  const { data: task, isLoading } = useTask(selectedTaskId ?? '');
  const { completeTask, reopenTask, archiveTask, updateTask } = useTaskMutations();
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('none');
  const [dueDate, setDueDate] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editing) setEditing(false);
        else closeDrawer();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeDrawer, editing]);

  // Sync edit fields when task loads
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setDueDate(task.dueDate ? toDateInputValue(task.dueDate) : '');
      setScheduledFor(task.scheduledFor ? toDatetimeInputValue(task.scheduledFor) : '');
    }
  }, [task]);

  // Reset edit state when drawer closes or task changes
  useEffect(() => {
    setEditing(false);
  }, [selectedTaskId, drawerOpen]);

  if (!drawerOpen || !selectedTaskId) return null;

  const isDone = task?.status === 'done';

  const handleSave = async () => {
    if (!task) return;
    await updateTask.mutateAsync({
      taskId: task.id,
      title: title.trim() || task.title,
      description: description || null,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
    });
    setEditing(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={closeDrawer} aria-hidden />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-background shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Edit task"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <span className="text-sm font-medium text-muted-foreground">
              {editing ? 'Edit task' : 'Task detail'}
            </span>
          </div>
          <button onClick={closeDrawer} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading || !task ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : editing ? (
          /* ── Edit mode ── */
          <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {(['none', 'low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>{p === 'none' ? 'No priority' : p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Scheduled for</label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                disabled={updateTask.isPending}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {updateTask.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ── View mode ── */
          <div className="flex flex-1 flex-col overflow-y-auto p-4">
            <h2 className={cn('text-lg font-semibold leading-snug', isDone && 'text-muted-foreground line-through')}>
              {task.title}
            </h2>

            {task.description && (
              <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{task.status}</dd>

              {task.priority !== 'none' && (
                <>
                  <dt className="text-muted-foreground">Priority</dt>
                  <dd className={cn('font-medium capitalize', priorityColor[task.priority])}>
                    {task.priority}
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

            <div className="mt-6 flex flex-wrap gap-2">
              {isDone ? (
                <button
                  onClick={() => reopenTask.mutate(task.id)}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reopen
                </button>
              ) : (
                <button
                  onClick={() => { completeTask.mutate(task.id); closeDrawer(); }}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <Check className="h-3.5 w-3.5" /> Complete
                </button>
              )}
              <button
                onClick={() => { archiveTask.mutate(task.id); closeDrawer(); }}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

function toDatetimeInputValue(iso: string) {
  return iso.slice(0, 16);
}
