import { NextRequest } from 'next/server';
import { and, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import { db, notes } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized } from '@/lib/api/response';
import { deriveMetadata } from '@/features/notes/utils/noteMetadata';
import { refreshNoteLinks } from '@/lib/db/noteLinks';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search');
  const type = searchParams.get('type');
  const projectId = searchParams.get('projectId');
  const areaId = searchParams.get('areaId');

  const conditions = [eq(notes.userId, user.id), isNull(notes.archivedAt)];

  if (search) {
    conditions.push(or(ilike(notes.title, `%${search}%`), ilike(notes.content, `%${search}%`))!);
  }
  if (type) conditions.push(eq(notes.type, type));
  if (projectId) conditions.push(eq(notes.projectId, projectId));
  if (areaId) conditions.push(eq(notes.areaId, areaId));

  const result = await db
    .select({
      id: notes.id,
      title: notes.title,
      type: notes.type,
      excerpt: notes.excerpt,
      wordCount: notes.wordCount,
      readingTimeMinutes: notes.readingTimeMinutes,
      projectId: notes.projectId,
      areaId: notes.areaId,
      noteDate: notes.noteDate,
      updatedAt: notes.updatedAt,
      createdAt: notes.createdAt,
    })
    .from(notes)
    .where(and(...conditions))
    .orderBy(desc(notes.updatedAt));

  return ok({ notes: result });
}

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional().default(''),
  type: z.enum(['normal', 'daily', 'meeting', 'dev_log', 'journal', 'reference']).optional().default('normal'),
  projectId: z.string().uuid().optional().nullable(),
  areaId: z.string().uuid().optional().nullable(),
  noteDate: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const data = parsed.data;
  const meta = deriveMetadata(data.content);

  const [note] = await db
    .insert(notes)
    .values({
      userId: user.id,
      title: data.title,
      content: data.content,
      type: data.type,
      projectId: data.projectId ?? null,
      areaId: data.areaId ?? null,
      noteDate: data.noteDate ?? null,
      ...meta,
    })
    .returning();

  await refreshNoteLinks(note.id, user.id, data.content);

  return ok({ note }, 201);
}
