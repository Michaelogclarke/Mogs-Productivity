'use client';

import { Archive, Eye, EyeOff, Terminal } from 'lucide-react';
import { useNoteMutations } from '../hooks/useNotes';
import { useNoteUIStore } from '@/stores/noteUIStore';
import { useNoteShortcuts } from '../hooks/useNoteShortcuts';
import { cn } from '@/lib/utils';
import type { Note } from '../types';

const TYPE_LABELS: Record<string, string> = {
  normal: 'Note',
  daily: 'Daily',
  meeting: 'Meeting',
  dev_log: 'Dev Log',
  journal: 'Journal',
  reference: 'Reference',
};

interface NoteMetadataBarProps {
  note: Note;
}

export function NoteMetadataBar({ note }: NoteMetadataBarProps) {
  const { archiveNote } = useNoteMutations();
  const {
    saveStatus,
    previewMode, setPreviewMode,
    backlinksOpen, setBacklinksOpen,
    vimMode, setVimMode,
    vimStatusText,
  } = useNoteUIStore();

  // Register global shortcuts on every note page that mounts this bar
  useNoteShortcuts();

  return (
    <div className="flex items-center justify-between border-b border-border py-2 mb-4 text-xs text-muted-foreground select-none">
      <div className="flex items-center gap-3">
        <span className="rounded bg-muted px-2 py-0.5 font-medium">
          {TYPE_LABELS[note.type] ?? note.type}
        </span>
        <span>{note.wordCount} words</span>
        <span>{note.readingTimeMinutes} min read</span>

        {/* Save status */}
        <span className={cn(
          'transition-opacity',
          saveStatus === 'idle'    && 'opacity-0',
          saveStatus === 'saving'  && 'opacity-100 text-muted-foreground',
          saveStatus === 'saved'   && 'opacity-100 text-green-600 dark:text-green-400',
          saveStatus === 'error'   && 'opacity-100 text-red-500',
        )}>
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved'  && 'Saved'}
          {saveStatus === 'error'  && 'Save failed'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Vim mode status */}
        {vimMode && vimStatusText && (
          <span className="font-mono font-semibold tracking-wider text-primary">
            {vimStatusText}
          </span>
        )}

        {/* Vim toggle — Cmd+. */}
        <button
          onClick={() => setVimMode(!vimMode)}
          title="Toggle vim mode (⌘.)"
          className={cn(
            'flex items-center gap-1 transition-colors',
            vimMode ? 'text-primary' : 'hover:text-foreground',
          )}
        >
          <Terminal className="h-3.5 w-3.5" />
          Vim
        </button>

        {/* Preview toggle — Cmd+E */}
        <button
          onClick={() => setPreviewMode(!previewMode)}
          title={`${previewMode ? 'Hide preview' : 'Show preview'} (⌘E)`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          {previewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {previewMode ? 'Editor' : 'Preview'}
        </button>

        {/* Backlinks toggle — Cmd+B */}
        <button
          onClick={() => setBacklinksOpen(!backlinksOpen)}
          title="Toggle backlinks (⌘B)"
          className="hover:text-foreground transition-colors"
        >
          {backlinksOpen ? 'Hide backlinks' : 'Backlinks'}
        </button>

        {/* Archive */}
        <button
          onClick={() => archiveNote.mutate(note.id)}
          disabled={archiveNote.isPending}
          className="flex items-center gap-1 hover:text-destructive transition-colors"
        >
          <Archive className="h-3.5 w-3.5" />
          Archive
        </button>
      </div>
    </div>
  );
}
