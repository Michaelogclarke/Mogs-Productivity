import { NextRequest } from 'next/server';
import { z } from 'zod';
import { parseQuickAdd } from '@mogs/parser';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized } from '@/lib/api/response';

const schema = z.object({ input: z.string().min(1) });

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message);

  const result = parseQuickAdd(parsed.data.input);
  return ok(result);
}
