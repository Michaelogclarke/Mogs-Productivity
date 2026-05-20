'use client';

import Link from 'next/link';
import { Link2 } from 'lucide-react';
import { useBacklinks } from '../hooks/useNotes';

interface BacklinksPanelProps {
  noteId: string;
}

export function BacklinksPanel({ noteId }: BacklinksPanelProps) {
  const { data: backlinks = [], isLoading } = useBacklinks(noteId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Link2 className="h-3.5 w-3.5" />
        Backlinks
        {backlinks.length > 0 && <span className="font-normal">({backlinks.length})</span>}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : backlinks.length === 0 ? (
        <p className="text-xs text-muted-foreground">No backlinks yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {backlinks.map((bl) => (
            <Link
              key={bl.id}
              href={`/notes/${bl.sourceNoteId}`}
              className="rounded-md border border-border px-3 py-2 hover:bg-muted/50 transition-colors block"
            >
              <p className="text-sm font-medium truncate">{bl.sourceTitle}</p>
              {bl.sourceExcerpt && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {bl.sourceExcerpt}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
