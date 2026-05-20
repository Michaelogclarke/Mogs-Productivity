'use client';

import { use } from 'react';
import { useDailyNote } from '@/features/notes/hooks/useNotes';
import { useNoteUIStore } from '@/stores/noteUIStore';
import { NoteEditor } from '@/features/notes/components/NoteEditor';
import { NoteMetadataBar } from '@/features/notes/components/NoteMetadataBar';
import { BacklinksPanel } from '@/features/notes/components/BacklinksPanel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface Props {
  params: Promise<{ date: string }>;
}

function adjacentDate(date: string, delta: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function DailyNotePage({ params }: Props) {
  const { date } = use(params);
  const { data: note, isLoading, isError } = useDailyNote(date);
  const { backlinksOpen, previewMode } = useNoteUIStore();

  const prev = adjacentDate(date, -1);
  const next = adjacentDate(date, 1);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex h-full gap-6">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Date nav */}
        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
          <Link href={`/notes/daily/${prev}`} className="hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium text-foreground">{formatDate(date)}</span>
          <Link href={`/notes/daily/${next}`} className="hover:text-foreground transition-colors">
            <ChevronRight className="h-4 w-4" />
          </Link>
          {date !== today && (
            <Link href={`/notes/daily/${today}`} className="ml-2 hover:text-foreground transition-colors">
              Today
            </Link>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : isError || !note ? (
          <p className="text-sm text-destructive">Failed to load daily note.</p>
        ) : (
          <>
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
          </>
        )}
      </div>

      {backlinksOpen && note && (
        <aside className="w-64 shrink-0 overflow-y-auto border-l border-border pl-4">
          <BacklinksPanel noteId={note.id} />
        </aside>
      )}
    </div>
  );
}
