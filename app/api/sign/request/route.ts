import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, getAuthUser } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const { contractId, expiryDays = 7, signatureType = 'witness', sendSms = false } = await req.json();
    const supabase = createAdminSupabase();
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

    // 署名トークン生成
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_signature_token', {
      contract_id: contractId,
      expiry_days: expiryDays,
    });
    if (tokenError) throw tokenError;

    // 契約をpendingに
    const { data: contract, error: updateError } = await supabase
      .from('contracts')
      .update({ status: 'pending', signature_type: signatureType })
      .eq('id', contractId)
      .select()
      .single();
    if (updateError) throw updateError;

    // 監査ログ
    await supabase.from('audit_logs').insert({
      contract_id: contractId, user_id: user.id,
      event: '署名依頼送信',
      detail: `送信先: ${contract.tenant_email} / 有効期限: ${expiryDays}日 / 種別: ${signatureType}`,
      ip_address: ip,
      metadata: { token: tokenData, sms: sendSms },
    });

    // TODO: メール送信（Resend連携）
    const signUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${tokenData}`;

    return NextResponse.json({
      success: true,
      signUrl,
      expiresAt: contract.signature_expires_at,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
