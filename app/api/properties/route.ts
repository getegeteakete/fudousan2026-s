import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const supabase = createAdminSupabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');

    let query = supabase.from('properties').select('*', { count: 'exact' })
      .eq('status', 'active').order('created_at', { ascending: false });

    if (search) query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,owner.ilike.%${search}%`);
    if (type) query = query.eq('type', type);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ properties: data, total: count });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const body = await req.json();
    const supabase = createAdminSupabase();

    // 単一または複数インサート
    const rows = Array.isArray(body) ? body : [body];
    const toInsert = rows.map(r => ({ ...r, user_id: user.id }));

    const { data, error } = await supabase.from('properties').insert(toInsert).select();
    if (error) throw error;

    return NextResponse.json({ properties: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
