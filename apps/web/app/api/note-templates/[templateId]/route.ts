import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, noteTemplates } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized, notFound } from '@/lib/api/response';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  content: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { templateId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const [template] = await db
    .update(noteTemplates)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(noteTemplates.id, templateId), eq(noteTemplates.userId, user.id)))
    .returning();

  if (!template) return notFound();
  return ok({ template });
}
