import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    },
  );
}

// Uses the local session JWT — no round-trip to Supabase auth servers.
// Sufficient for API routes; the proxy validates the session on every request anyway.
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.user) return null;
  return session.user;
}

// Call once after sign-up / first login to sync the auth user into our DB.
// Not called on every request.
export async function syncUserToDb(userId: string, email: string) {
  await db
    .insert(users)
    .values({ id: userId, email })
    .onConflictDoNothing();
}
