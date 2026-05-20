import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, tasks } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized, notFound } from '@/lib/api/response';

// ---------------------------------------------------------------------------
// GET /api/tasks/:taskId
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { taskId } = await params;
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));

  if (!task) return notFound();
  return ok({ task });
}

// ---------------------------------------------------------------------------
// PATCH /api/tasks/:taskId
// ---------------------------------------------------------------------------
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  areaId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
  reminderAt: z.string().datetime().optional().nullable(),
  priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'doing', 'done', 'cancelled', 'archived']).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { taskId } = await params;
  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const data = parsed.data;
  const updates: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.projectId !== undefined) updates.projectId = data.projectId;
  if (data.areaId !== undefined) updates.areaId = data.areaId;
  if (data.dueDate !== undefined) updates.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.scheduledFor !== undefined) updates.scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
  if (data.reminderAt !== undefined) updates.reminderAt = data.reminderAt ? new Date(data.reminderAt) : null;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.status !== undefined) updates.status = data.status;

  const [task] = await db
    .update(tasks)
    .set(updates)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))
    .returning();

  if (!task) return notFound();
  return ok({ task });
}
