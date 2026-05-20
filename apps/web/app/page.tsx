export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';

export default async function RootPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect('/tasks');
  }
  redirect('/login');
}
