'use client';

import { use } from 'react';
import { useNote } from '@/features/notes/hooks/useNotes';
import { useNoteUIStore } from '@/stores/noteUIStore';
import { NoteEditor } from '@/features/notes/components/NoteEditor';
import { NoteMetadataBar } from '@/features/notes/components/NoteMetadataBar';
import { BacklinksPanel } from '@/features/notes/components/BacklinksPanel';
import ReactMarkdown from 'react-markdown';

interface Props {
  params: Promise<{ noteId: string }>;
}

export default function NoteEditorPage({ params }: Props) {
  const { noteId } = use(params);
  const { data: note, isLoading, isError } = useNote(noteId);
  const { backlinksOpen, previewMode } = useNoteUIStore();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-4">Loading…</p>;
  }

  if (isError || !note) {
    return <p className="text-sm text-destructive p-4">Note not found.</p>;
  }

  return (
    <div className="flex h-full gap-6">
      {/* Main editor / preview column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <NoteMetadataBar note={note} />

        {previewMode ? (
          <div className="flex-1 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
            <h1>{note.title}</h1>
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <NoteEditor note={note} />
          </div>
        )}
      </div>

      {/* Backlinks panel */}
      {backlinksOpen && (
        <aside className="w-64 shrink-0 overflow-y-auto border-l border-border pl-4">
          <BacklinksPanel noteId={noteId} />
        </aside>
      )}
    </div>
  );
}
