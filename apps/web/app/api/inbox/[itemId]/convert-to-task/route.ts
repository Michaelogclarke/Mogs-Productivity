import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, inboxItems, tasks } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized, notFound } from '@/lib/api/response';

const schema = z.object({
  title: z.string().min(1),
  scheduledFor: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { itemId } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const data = parsed.data;

  const [item] = await db
    .select()
    .from(inboxItems)
    .where(and(eq(inboxItems.id, itemId), eq(inboxItems.userId, user.id)));

  if (!item) return notFound();

  const [task] = await db
    .insert(tasks)
    .values({
      userId: user.id,
      title: data.title,
      rawInput: item.rawInput ?? item.content,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority ?? 'none',
    })
    .returning();

  await db
    .update(inboxItems)
    .set({
      processed: true,
      processedIntoType: 'task',
      processedIntoId: task.id,
      updatedAt: new Date(),
    })
    .where(eq(inboxItems.id, itemId));

  return ok({ task }, 201);
}
