'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, CalendarDays } from 'lucide-react';
import { useNotes, useNoteMutations } from '../hooks/useNotes';
import { useNoteUIStore } from '@/stores/noteUIStore';
import { cn } from '@/lib/utils';

const TYPE_FILTERS = [
  { value: null, label: 'All' },
  { value: 'normal', label: 'Notes' },
  { value: 'daily', label: 'Daily' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'dev_log', label: 'Dev Log' },
  { value: 'journal', label: 'Journal' },
  { value: 'reference', label: 'Reference' },
] as const;

export function NotesList() {
  const { searchQuery, setSearchQuery, filterType, setFilterType } = useNoteUIStore();
  const { data: notes = [], isLoading } = useNotes({ search: searchQuery || undefined, type: filterType ?? undefined });
  const { createNote } = useNoteMutations();
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/notes/daily/${today}`}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Today
          </Link>
          <button
            onClick={() => createNote.mutate({ title: 'Untitled', content: '' })}
            disabled={createNote.isPending}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            New note
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes…"
          className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Type filters */}
      <div className="flex gap-1 flex-wrap">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={label}
            onClick={() => setFilterType(value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs transition-colors',
              filterType === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="flex flex-col gap-1 py-3 hover:bg-muted/30 px-2 -mx-2 rounded-md transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate">{note.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              {note.excerpt && (
                <p className="text-xs text-muted-foreground line-clamp-2">{note.excerpt}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                <span className="capitalize">{note.type.replace('_', ' ')}</span>
                <span>·</span>
                <span>{note.wordCount} words</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
