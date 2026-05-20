import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, projects } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized, notFound } from '@/lib/api/response';

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  areaId: z.string().uuid().optional().nullable(),
  color: z.string().optional().nullable(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { projectId } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const [project] = await db
    .update(projects)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .returning();

  if (!project) return notFound();
  return ok({ project });
}
