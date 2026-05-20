import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, projects } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, unauthorized, notFound } from '@/lib/api/response';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { projectId } = await params;
  const [project] = await db
    .update(projects)
    .set({ status: 'archived', archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .returning();

  if (!project) return notFound();
  return ok({ project });
}
