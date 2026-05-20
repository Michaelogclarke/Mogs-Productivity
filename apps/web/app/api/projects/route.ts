import { NextRequest } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db, projects } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized } from '@/lib/api/response';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const result = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, user.id), isNull(projects.archivedAt)));

  return ok({ projects: result });
}

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  areaId: z.string().uuid().optional().nullable(),
  color: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const data = parsed.data;
  const [project] = await db
    .insert(projects)
    .values({
      userId: user.id,
      name: data.name,
      description: data.description ?? null,
      areaId: data.areaId ?? null,
      color: data.color ?? null,
    })
    .returning();

  return ok({ project }, 201);
}
