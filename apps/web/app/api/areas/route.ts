import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, areas } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized } from '@/lib/api/response';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const result = await db.select().from(areas).where(eq(areas.userId, user.id));
  return ok({ areas: result });
}

const createAreaSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const parsed = createAreaSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const data = parsed.data;
  const [area] = await db
    .insert(areas)
    .values({
      userId: user.id,
      name: data.name,
      color: data.color ?? null,
      icon: data.icon ?? null,
    })
    .returning();

  return ok({ area }, 201);
}
