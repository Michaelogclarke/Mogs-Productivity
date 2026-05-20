import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, notes } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized, notFound } from '@/lib/api/response';
import { deriveMetadata } from '@/features/notes/utils/noteMetadata';
import { refreshNoteLinks } from '@/lib/db/noteLinks';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { noteId } = await params;
  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)));

  if (!note) return notFound();
  return ok({ note });
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  type: z.enum(['normal', 'daily', 'meeting', 'dev_log', 'journal', 'reference']).optional(),
  projectId: z.string().uuid().optional().nullable(),
  areaId: z.string().uuid().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { noteId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const data = parsed.data;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (data.title !== undefined) updates.title = data.title;
  if (data.type !== undefined) updates.type = data.type;
  if (data.projectId !== undefined) updates.projectId = data.projectId;
  if (data.areaId !== undefined) updates.areaId = data.areaId;

  if (data.content !== undefined) {
    updates.content = data.content;
    const meta = deriveMetadata(data.content);
    Object.assign(updates, meta);
  }

  const [note] = await db
    .update(notes)
    .set(updates)
    .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
    .returning();

  if (!note) return notFound();

  if (data.content !== undefined || data.title !== undefined) {
    await refreshNoteLinks(note.id, user.id, note.content);
  }

  return ok({ note });
}
