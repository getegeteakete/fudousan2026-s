import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import { createHash } from 'crypto';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminSupabase();

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('id, property_name, tenant_name, tenant_email, status, signature_expires_at, rent, start_date, end_date, type')
    .eq('signature_token', token)
    .single();

  if (error || !contract) return NextResponse.json({ error: '無効なリンクです' }, { status: 404 });

  const now = new Date();
  if (contract.signature_expires_at && new Date(contract.signature_expires_at) < now) {
    return NextResponse.json({ error: '署名リンクの有効期限が切れています' }, { status: 410 });
  }

  if (contract.status === 'signed' || contract.status === 'completed') {
    return NextResponse.json({ error: 'すでに署名済みです', status: contract.status }, { status: 409 });
  }

  return NextResponse.json({ contract });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
  const { token } = await params;
  const supabase = createAdminSupabase();
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const userAgent = req.headers.get('user-agent') ?? '';

  const { signatureData } = await req.json();

  // トークン検証
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('signature_token', token)
    .single();

  if (error || !contract) return NextResponse.json({ error: '無効なリンクです' }, { status: 404 });
  if (contract.signature_expires_at && new Date(contract.signature_expires_at) < new Date()) {
    return NextResponse.json({ error: '有効期限切れです' }, { status: 410 });
  }
  if (['signed', 'completed'].includes(contract.status)) {
    return NextResponse.json({ error: '署名済みです' }, { status: 409 });
  }

  // タイムスタンプハッシュ生成（RFC3161模擬）
  const timestampData = `${contract.id}:${ip}:${new Date().toISOString()}:${signatureData?.slice(0, 100) ?? ''}`;
  const timestampHash = createHash('sha256').update(timestampData).digest('hex');

  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('contracts')
    .update({
      status: 'signed',
      signed_at: now,
      signer_ip: ip,
      signature_data: signatureData,
      timestamp_hash: timestampHash,
      timestamp_at: now,
      signature_token: null, // トークン無効化
    })
    .eq('id', contract.id)
    .select()
    .single();

  if (updateError) throw updateError;

  // 監査ログ
  await supabase.from('audit_logs').insert({
    contract_id: contract.id,
    event: '電子署名完了',
    detail: `${contract.tenant_name}が署名完了。タイムスタンプ付与。`,
    ip_address: ip,
    user_agent: userAgent,
    metadata: { timestamp_hash: timestampHash, signature_type: contract.signature_type },
  });

  return NextResponse.json({
    success: true,
    signedAt: now,
    timestampHash,
    contract: updated,
  });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
