import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, inboxItems } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized } from '@/lib/api/response';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const result = await db
    .select()
    .from(inboxItems)
    .where(and(eq(inboxItems.userId, user.id), eq(inboxItems.processed, false)));

  return ok({ items: result });
}

const createInboxSchema = z.object({
  content: z.string().min(1),
  type: z.string().optional(),
  rawInput: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const parsed = createInboxSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const data = parsed.data;
  const [item] = await db
    .insert(inboxItems)
    .values({
      userId: user.id,
      content: data.content,
      type: data.type ?? 'text',
      rawInput: data.rawInput ?? null,
    })
    .returning();

  return ok({ item }, 201);
}
