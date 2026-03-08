import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder';

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(list: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])); } catch {}
      },
    },
  });
}

export function createAdminSupabase() {
  return createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getAuthUser() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch { return null; }
}

export async function getProfile(userId: string) {
  try {
    const supabase = createAdminSupabase();
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return data;
  } catch { return null; }
}
