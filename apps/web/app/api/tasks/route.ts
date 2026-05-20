import { NextRequest } from 'next/server';
import { and, asc, desc, eq, ilike, isNull, lte, gte, or } from 'drizzle-orm';
import { z } from 'zod';
import { db, tasks } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized } from '@/lib/api/response';

// ---------------------------------------------------------------------------
// GET /api/tasks
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const view = searchParams.get('view');
  const search = searchParams.get('search');
  const projectId = searchParams.get('projectId');
  const areaId = searchParams.get('areaId');
  const priority = searchParams.get('priority');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const conditions = [eq(tasks.userId, user.id), isNull(tasks.archivedAt)];

  if (search) {
    conditions.push(ilike(tasks.title, `%${search}%`));
  }
  if (projectId) {
    conditions.push(eq(tasks.projectId, projectId));
  }
  if (areaId) {
    conditions.push(eq(tasks.areaId, areaId));
  }
  if (priority) {
    conditions.push(eq(tasks.priority, priority));
  }

  // View-specific filters
  if (view === 'today') {
    conditions.push(
      or(
        // overdue
        and(lte(tasks.dueDate, todayStart), isNull(tasks.completedAt)),
        // due today
        and(gte(tasks.dueDate, todayStart), lte(tasks.dueDate, todayEnd)),
        // scheduled today
        and(gte(tasks.scheduledFor, todayStart), lte(tasks.scheduledFor, todayEnd)),
      )!,
    );
    conditions.push(isNull(tasks.completedAt));
  } else if (view === 'upcoming') {
    conditions.push(gte(tasks.dueDate, todayEnd));
    conditions.push(isNull(tasks.completedAt));
  } else if (view === 'overdue') {
    conditions.push(lte(tasks.dueDate, todayStart));
    conditions.push(isNull(tasks.completedAt));
  } else if (view === 'completed') {
    // remove the isNull(completedAt) filter we applied above — we WANT completed tasks
    const idx = conditions.findIndex(
      (c) => c.toString() === isNull(tasks.completedAt).toString(),
    );
    if (idx !== -1) conditions.splice(idx, 1);
    conditions.push(eq(tasks.status, 'done'));
  } else if (view === 'all' || !view) {
    conditions.push(isNull(tasks.completedAt));
  }

  const result = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(
      view === 'completed'
        ? desc(tasks.completedAt)
        : asc(tasks.createdAt),
    );

  return ok({ tasks: result });
}

// ---------------------------------------------------------------------------
// POST /api/tasks
// ---------------------------------------------------------------------------
const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().uuid().optional().nullable(),
  areaId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
  reminderAt: z.string().datetime().optional().nullable(),
  priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).optional(),
  rawInput: z.string().optional().nullable(),
  parsedMetadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const data = parsed.data;
  const [task] = await db
    .insert(tasks)
    .values({
      userId: user.id,
      title: data.title,
      description: data.description ?? null,
      projectId: data.projectId ?? null,
      areaId: data.areaId ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
      priority: data.priority ?? 'none',
      rawInput: data.rawInput ?? null,
      parsedMetadata: data.parsedMetadata ?? null,
    })
    .returning();

  return ok({ task }, 201);
}
