import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createAdminSupabase();
    const [{ data: contract, error }, { data: logs }] = await Promise.all([
      supabase.from('contracts').select('*').eq('id', id).single(),
      supabase.from('audit_logs').select('*').eq('contract_id', id).order('created_at', { ascending: false }),
    ]);
    if (error) return NextResponse.json({ error: '契約書が見つかりません' }, { status: 404 });
    return NextResponse.json({ contract, auditLogs: logs ?? [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const supabase = createAdminSupabase();

    const { data: contract, error } = await supabase
      .from('contracts').update(body).eq('id', id).select().single();
    if (error) throw error;

    await supabase.from('audit_logs').insert({
      contract_id: id,
      event: body.status === 'pending' ? '署名依頼送信' : '契約書更新',
      detail: `ステータス: ${contract.status}`,
      ip_address: ip,
    })

    return NextResponse.json({ contract });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createAdminSupabase();
    const { error } = await supabase.from('contracts').update({ status: 'cancelled' }).eq('id', id);
    if (error) throw error;
    await supabase.from('audit_logs').insert({
      contract_id: id, event: '契約書取消', detail: '取消処理', ip_address: 'system',
    })
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
