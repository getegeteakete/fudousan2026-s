import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { contractId, expiryDays = 7, signatureType = 'witness', sendSms = false } = await req.json();
    const supabase = createAdminSupabase();
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

    // 署名トークン生成（Supabase RPC）
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_signature_token', {
      contract_id: contractId, expiry_days: expiryDays,
    });
    if (tokenError) throw tokenError;

    const { data: contract, error: updateError } = await supabase
      .from('contracts')
      .update({ status: 'pending', signature_type: signatureType })
      .eq('id', contractId).select().single();
    if (updateError) throw updateError;

    await supabase.from('audit_logs').insert({
      contract_id: contractId,
      event: '署名依頼送信',
      detail: `送信先: ${contract.tenant_email} / 有効期限: ${expiryDays}日`,
      ip_address: ip,
      metadata: { token: tokenData, sms: sendSms },
    })

    const signUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/sign/${tokenData}`;
    return NextResponse.json({ success: true, signUrl, expiresAt: contract.signature_expires_at });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
