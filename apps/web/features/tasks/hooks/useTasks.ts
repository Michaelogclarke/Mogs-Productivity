'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Task, CreateTaskInput } from '../types';

type TaskView = 'today' | 'upcoming' | 'overdue' | 'all' | 'completed';

interface TaskFilters {
  view?: TaskView;
  search?: string;
  projectId?: string | null;
  areaId?: string | null;
  priority?: string | null;
}

async function fetchTasks(filters: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters.view) params.set('view', filters.view);
  if (filters.search) params.set('search', filters.search);
  if (filters.projectId) params.set('projectId', filters.projectId);
  if (filters.areaId) params.set('areaId', filters.areaId);
  if (filters.priority) params.set('priority', filters.priority);

  const res = await fetch(`/api/tasks?${params}`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  const data = await res.json();
  return data.tasks;
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error('Task not found');
      const data = await res.json();
      return data.task as Task;
    },
    enabled: !!taskId,
  });
}

export function useTaskMutations() {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tasks'] });

  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed to create task (${res.status})`);
      }
      return (await res.json()).task as Task;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const snapshot = qc.getQueriesData<Task[]>({ queryKey: ['tasks'] });
      const optimistic: Task = {
        id: `optimistic-${Date.now()}`,
        userId: '',
        projectId: input.projectId ?? null,
        areaId: input.areaId ?? null,
        title: input.title,
        description: input.description ?? null,
        status: 'todo',
        priority: input.priority ?? 'none',
        dueDate: input.dueDate ?? null,
        scheduledFor: input.scheduledFor ?? null,
        reminderAt: input.reminderAt ?? null,
        completedAt: null,
        archivedAt: null,
        rawInput: input.rawInput ?? null,
        parsedMetadata: input.parsedMetadata ?? null,
        sortOrder: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      qc.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (old) =>
        old ? [optimistic, ...old] : [optimistic],
      );
      return { snapshot };
    },
    onError: (e, _input, ctx) => {
      if (ctx?.snapshot) ctx.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(e.message);
    },
    onSettled: () => { invalidate(); toast.success('Task created'); },
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to complete task');
      return (await res.json()).task as Task;
    },
    onMutate: async (taskId) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const snapshot = qc.getQueriesData<Task[]>({ queryKey: ['tasks'] });
      qc.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (old) =>
        old ? old.filter((t) => t.id !== taskId) : old,
      );
      return { snapshot };
    },
    onError: (e, _taskId, ctx) => {
      if (ctx?.snapshot) ctx.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(e.message);
    },
    onSettled: invalidate,
  });

  const reopenTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/reopen`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reopen task');
      return (await res.json()).task as Task;
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(e.message),
  });

  const archiveTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/archive`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to archive task');
      return (await res.json()).task as Task;
    },
    onMutate: async (taskId) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const snapshot = qc.getQueriesData<Task[]>({ queryKey: ['tasks'] });
      qc.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (old) =>
        old ? old.filter((t) => t.id !== taskId) : old,
      );
      return { snapshot };
    },
    onError: (e, _taskId, ctx) => {
      if (ctx?.snapshot) ctx.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(e.message);
    },
    onSettled: invalidate,
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, ...patch }: { taskId: string } & Partial<CreateTaskInput>) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Failed to update task');
      }
      return (await res.json()).task as Task;
    },
    onSuccess: () => { invalidate(); toast.success('Task updated'); },
    onError: (e) => toast.error(e.message),
  });

  return { createTask, completeTask, reopenTask, archiveTask, updateTask };
}
