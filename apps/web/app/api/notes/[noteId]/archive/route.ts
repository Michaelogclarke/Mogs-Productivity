import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, notes } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, unauthorized, notFound } from '@/lib/api/response';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { noteId } = await params;
  const [note] = await db
    .update(notes)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
    .returning();

  if (!note) return notFound();
  return ok({ note });
}
