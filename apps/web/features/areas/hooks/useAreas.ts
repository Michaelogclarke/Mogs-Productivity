'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Area {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const res = await fetch('/api/areas');
      if (!res.ok) throw new Error('Failed to fetch areas');
      return (await res.json()).areas as Area[];
    },
  });
}

export function useAreaMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['areas'] });

  const createArea = useMutation({
    mutationFn: async (input: { name: string; color?: string | null; icon?: string | null }) => {
      const res = await fetch('/api/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create area');
      return (await res.json()).area as Area;
    },
    onSuccess: () => { invalidate(); toast.success('Area created'); },
    onError: (e) => toast.error(e.message),
  });

  const archiveArea = useMutation({
    mutationFn: async (areaId: string) => {
      const res = await fetch(`/api/areas/${areaId}/archive`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to delete area');
    },
    onSuccess: () => { invalidate(); toast.success('Area deleted'); },
    onError: (e) => toast.error(e.message),
  });

  return { createArea, archiveArea };
}
