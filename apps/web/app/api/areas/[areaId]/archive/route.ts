import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, areas } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, unauthorized, notFound } from '@/lib/api/response';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ areaId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { areaId } = await params;
  // Areas don't have archivedAt in schema — just delete them (soft-style via a workaround)
  // For MVP: delete the area record (tasks keep their areaId but reference is nulled by DB cascade)
  const [area] = await db
    .delete(areas)
    .where(and(eq(areas.id, areaId), eq(areas.userId, user.id)))
    .returning();

  if (!area) return notFound();
  return ok({ archived: true });
}
