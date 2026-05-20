import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, syncUserToDb } from '@/lib/auth/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    if (data.user) {
      await syncUserToDb(data.user.id, data.user.email!);
    }
  }

  return NextResponse.redirect(`${origin}/tasks`);
}
