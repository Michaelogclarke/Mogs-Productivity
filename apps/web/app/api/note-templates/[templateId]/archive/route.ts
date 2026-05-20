import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, noteTemplates } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, unauthorized, notFound } from '@/lib/api/response';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { templateId } = await params;
  const [template] = await db
    .update(noteTemplates)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(noteTemplates.id, templateId), eq(noteTemplates.userId, user.id)))
    .returning();

  if (!template) return notFound();
  return ok({ template });
}
