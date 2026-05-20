'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Note, NoteListItem, NoteTemplate, Backlink } from '../types';

interface NoteFilters {
  search?: string;
  type?: string;
  projectId?: string | null;
  areaId?: string | null;
}

export function useNotes(filters: NoteFilters = {}) {
  return useQuery({
    queryKey: ['notes', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.type) params.set('type', filters.type);
      if (filters.projectId) params.set('projectId', filters.projectId);
      if (filters.areaId) params.set('areaId', filters.areaId);
      const res = await fetch(`/api/notes?${params}`);
      if (!res.ok) throw new Error('Failed to fetch notes');
      return (await res.json()).notes as NoteListItem[];
    },
  });
}

export function useNote(noteId: string) {
  return useQuery({
    queryKey: ['note', noteId],
    queryFn: async () => {
      const res = await fetch(`/api/notes/${noteId}`);
      if (!res.ok) throw new Error('Note not found');
      return (await res.json()).note as Note;
    },
    enabled: !!noteId,
  });
}

export function useBacklinks(noteId: string) {
  return useQuery({
    queryKey: ['backlinks', noteId],
    queryFn: async () => {
      const res = await fetch(`/api/notes/${noteId}/backlinks`);
      if (!res.ok) throw new Error('Failed to fetch backlinks');
      return (await res.json()).backlinks as Backlink[];
    },
    enabled: !!noteId,
  });
}

export function useNoteTemplates() {
  return useQuery({
    queryKey: ['note-templates'],
    queryFn: async () => {
      const res = await fetch('/api/note-templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      return (await res.json()).templates as NoteTemplate[];
    },
  });
}

export function useDailyNote(date: string) {
  return useQuery({
    queryKey: ['note', 'daily', date],
    queryFn: async () => {
      const res = await fetch(`/api/notes/daily/${date}`);
      if (!res.ok) throw new Error('Failed to load daily note');
      const data = await res.json();
      return data.note as Note;
    },
    enabled: !!date,
  });
}

export function useNoteMutations() {
  const qc = useQueryClient();
  const router = useRouter();

  const invalidateNotes = () => qc.invalidateQueries({ queryKey: ['notes'] });

  const createNote = useMutation({
    mutationFn: async (input: {
      title: string;
      content?: string;
      type?: string;
      projectId?: string | null;
      areaId?: string | null;
    }) => {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create note');
      return (await res.json()).note as Note;
    },
    onSuccess: (note) => {
      invalidateNotes();
      router.push(`/notes/${note.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateNote = useMutation({
    mutationFn: async ({ noteId, ...patch }: { noteId: string; title?: string; content?: string; type?: string; projectId?: string | null; areaId?: string | null }) => {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Failed to save note');
      return (await res.json()).note as Note;
    },
    onSuccess: (note) => {
      qc.setQueryData(['note', note.id], note);
      invalidateNotes();
    },
    onError: (e) => toast.error(e.message),
  });

  const archiveNote = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/notes/${noteId}/archive`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to archive note');
    },
    onSuccess: () => {
      invalidateNotes();
      toast.success('Note archived');
      router.push('/notes');
    },
    onError: (e) => toast.error(e.message),
  });

  const saveTemplate = useMutation({
    mutationFn: async ({ templateId, ...patch }: { templateId?: string; name?: string; content: string; type?: string; isDefault?: boolean }) => {
      if (templateId) {
        const res = await fetch(`/api/note-templates/${templateId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error('Failed to save template');
        return (await res.json()).template as NoteTemplate;
      } else {
        const res = await fetch('/api/note-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error('Failed to create template');
        return (await res.json()).template as NoteTemplate;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['note-templates'] });
      toast.success('Template saved');
    },
    onError: (e) => toast.error(e.message),
  });

  return { createNote, updateNote, archiveNote, saveTemplate };
}
