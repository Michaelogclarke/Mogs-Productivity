'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    onSuccess: invalidate,
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
    onError: (_err, _taskId, ctx) => {
      if (ctx?.snapshot) {
        ctx.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      }
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
    onError: (_err, _taskId, ctx) => {
      if (ctx?.snapshot) {
        ctx.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      }
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
      if (!res.ok) throw new Error('Failed to update task');
      return (await res.json()).task as Task;
    },
    onSuccess: invalidate,
  });

  return { createTask, completeTask, reopenTask, archiveTask, updateTask };
}
