import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase.from('system_settings').select('key,value');
    if (error) throw error;
    const obj: Record<string, string> = {};
    (data ?? []).forEach(r => { obj[r.key] = r.value ?? ''; });
    return NextResponse.json({ settings: obj });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminSupabase();
    const upserts = Object.entries(body).map(([key, value]) => ({
      key, value: String(value),
    }));
    const { error } = await supabase
      .from('system_settings')
      .upsert(upserts, { onConflict: 'key' });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
