import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, tasks } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, unauthorized, notFound } from '@/lib/api/response';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { taskId } = await params;
  const [task] = await db
    .update(tasks)
    .set({ status: 'archived', archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))
    .returning();

  if (!task) return notFound();
  return ok({ task });
}
