import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, getAuthUser } from '@/lib/supabase-server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    const { id } = await params;
    const supabase = createAdminSupabase();

    const [{ data: contract, error }, { data: logs }] = await Promise.all([
      supabase.from('contracts').select('*').eq('id', id).single(),
      supabase.from('audit_logs').select('*').eq('contract_id', id).order('created_at', { ascending: false }),
    ]);

    if (error) return NextResponse.json({ error: '契約書が見つかりません' }, { status: 404 });
    return NextResponse.json({ contract, auditLogs: logs });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const supabase = createAdminSupabase();

    const { data: contract, error } = await supabase
      .from('contracts').update(body).eq('id', id).select().single();
    if (error) throw error;

    await supabase.from('audit_logs').insert({
      contract_id: id, user_id: user.id,
      event: body.status === 'pending' ? '署名依頼送信' : '契約書更新',
      detail: `ステータス: ${contract.status}`, ip_address: ip,
    });

    return NextResponse.json({ contract });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    const { id } = await params;
    const supabase = createAdminSupabase();

    // 論理削除（statusをcancelledに）
    const { error } = await supabase.from('contracts').update({ status: 'cancelled' }).eq('id', id);
    if (error) throw error;

    await supabase.from('audit_logs').insert({
      contract_id: id, user_id: user.id,
      event: '契約書取消', detail: '管理者による取消', ip_address: 'system',
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
