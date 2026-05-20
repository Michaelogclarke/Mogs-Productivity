'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Project {
  id: string;
  userId: string;
  areaId: string | null;
  name: string;
  description: string | null;
  status: string;
  color: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return (await res.json()).projects as Project[];
    },
  });
}

export function useProjectMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['projects'] });

  const createProject = useMutation({
    mutationFn: async (input: { name: string; areaId?: string | null; color?: string | null }) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create project');
      return (await res.json()).project as Project;
    },
    onSuccess: () => { invalidate(); toast.success('Project created'); },
    onError: (e) => toast.error(e.message),
  });

  const archiveProject = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`/api/projects/${projectId}/archive`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to archive project');
    },
    onSuccess: () => { invalidate(); toast.success('Project archived'); },
    onError: (e) => toast.error(e.message),
  });

  return { createProject, archiveProject };
}
