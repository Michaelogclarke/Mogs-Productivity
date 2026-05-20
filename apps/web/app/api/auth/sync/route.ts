import { getAuthenticatedUser, syncUserToDb } from '@/lib/auth/supabase-server';
import { ok, unauthorized } from '@/lib/api/response';

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  await syncUserToDb(user.id, user.email!);
  return ok({ synced: true });
}
