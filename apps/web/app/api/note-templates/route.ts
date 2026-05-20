import { NextRequest } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db, noteTemplates } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized } from '@/lib/api/response';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const result = await db
    .select()
    .from(noteTemplates)
    .where(and(eq(noteTemplates.userId, user.id), isNull(noteTemplates.archivedAt)));

  return ok({ templates: result });
}

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['daily', 'meeting', 'dev_log', 'journal', 'custom']).optional().default('custom'),
  content: z.string(),
  isDefault: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const [template] = await db
    .insert(noteTemplates)
    .values({ userId: user.id, ...parsed.data })
    .returning();

  return ok({ template }, 201);
}
