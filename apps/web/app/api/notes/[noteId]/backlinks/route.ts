import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, noteLinks, notes } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, unauthorized } from '@/lib/api/response';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { noteId } = await params;

  const backlinks = await db
    .select({
      id: noteLinks.id,
      linkText: noteLinks.linkText,
      resolved: noteLinks.resolved,
      sourceNoteId: noteLinks.sourceNoteId,
      sourceTitle: notes.title,
      sourceExcerpt: notes.excerpt,
    })
    .from(noteLinks)
    .innerJoin(notes, eq(noteLinks.sourceNoteId, notes.id))
    .where(
      and(
        eq(noteLinks.targetNoteId, noteId),
        eq(noteLinks.userId, user.id),
      ),
    );

  return ok({ backlinks });
}
