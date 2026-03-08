import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const supabase = createAdminSupabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = supabase.from('contracts').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (search) query = query.or(`tenant_name.ilike.%${search}%,property_name.ilike.%${search}%,contract_no.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ contracts: data, total: count });
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
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';

    const { data: contract, error } = await supabase
      .from('contracts')
      .insert({ ...body, created_by: user.id, status: 'draft' })
      .select()
      .single();

    if (error) throw error;

    // 監査ログ
    await supabase.from('audit_logs').insert({
      contract_id: contract.id,
      user_id: user.id,
      event: '契約書作成',
      detail: `${contract.property_name} / ${contract.tenant_name}`,
      ip_address: ip,
      metadata: { type: contract.type },
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
