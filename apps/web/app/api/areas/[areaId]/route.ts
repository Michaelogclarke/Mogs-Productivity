import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, areas } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized, notFound } from '@/lib/api/response';

const schema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ areaId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { areaId } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const [area] = await db
    .update(areas)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(areas.id, areaId), eq(areas.userId, user.id)))
    .returning();

  if (!area) return notFound();
  return ok({ area });
}
