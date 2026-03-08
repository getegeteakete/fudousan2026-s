import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import { sendSignatureRequestEmail } from '@/lib/email';
import { createHash } from 'crypto';
import { setToken } from '@/lib/token-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contractId,
      expiryDays    = 7,
      signatureType = 'witness',
      sendSms       = false,
      // ローカル契約書から渡されるフォールバック情報
      localContract,
    } = body;

    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fudousan2026-system2.vercel.app';

    // ─── Supabase 接続チェック ───────────────────────────────
    const supabase = createAdminSupabase();
    const sbAvailable = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('.supabase.co') &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ')
    );

    let signToken: string;
    let tenantEmail: string;
    let tenantName: string;
    let propertyName: string;
    let contractNo: string;
    let agentName: string;
    let expiresAt: string | undefined;

    if (sbAvailable) {
      // ─── Supabase 接続あり: DB から取得してトークン生成 ────
      const { data: tokenData, error: tokenError } = await supabase.rpc('generate_signature_token', {
        contract_id: contractId,
        expiry_days: expiryDays,
      });
      if (tokenError) throw new Error(`トークン生成失敗: ${tokenError.message}`);
      signToken = tokenData;

      const { data: contract, error: updateError } = await supabase
        .from('contracts')
        .update({ status: 'pending', signature_type: signatureType })
        .eq('id', contractId)
        .select()
        .single();
      if (updateError) throw new Error(`契約更新失敗: ${updateError.message}`);

      tenantEmail  = contract.tenant_email;
      tenantName   = contract.tenant_name;
      propertyName = contract.property_name;
      contractNo   = contract.contract_no;
      agentName    = contract.agent_name ?? '担当者';
      expiresAt    = contract.signature_expires_at;

      await supabase.from('audit_logs').insert({
        contract_id: contractId,
        event: '署名依頼送信',
        detail: `送信先: ${tenantEmail} / 有効期限: ${expiryDays}日`,
        ip_address: ip,
        metadata: { token: signToken, sms: sendSms, signatureType },
      });

    } else {
      // ─── Supabase 未接続: ローカル契約書で処理 ─────────────
      if (!localContract) {
        return NextResponse.json(
          { error: 'Supabase未接続のため、契約情報が必要です。', needsLocal: true },
          { status: 400 }
        );
      }

      // UUID形式のトークンをSHA-256ベースで生成
      const raw = `${contractId}:${Date.now()}:${Math.random()}`;
      signToken    = createHash('sha256').update(raw).digest('hex').slice(0, 32);
      tenantEmail  = localContract.tenantEmail;
      tenantName   = localContract.tenantName;
      propertyName = localContract.propertyName;
      contractNo   = localContract.contractNo;
      agentName    = localContract.agentName ?? '担当者';
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiryDays);
      expiresAt = expDate.toISOString();

      // トークンをグローバルストアに登録
      setToken(signToken, {
        contractId, tenantEmail, tenantName, propertyName,
        contractNo, agentName, type: 'lease', expiresAt,
        createdAt: new Date().toISOString(),
      });
    }

    const signUrl = `${appUrl}/sign/${signToken}`;

    // ─── メール送信 ────────────────────────────────────────────
    const companyName = process.env.COMPANY_NAME ?? '株式会社PropSign不動産';
    const emailResult = await sendSignatureRequestEmail({
      to:          tenantEmail,
      tenantName,
      propertyName,
      contractNo,
      agentName,
      companyName,
      signUrl,
      expiresAt,
    });

    return NextResponse.json({
      success:      true,
      signUrl,
      expiresAt,
      signToken,
      email: {
        sent:     emailResult.success,
        fallback: emailResult.fallback ?? false,
        id:       emailResult.id,
        error:    emailResult.error,
      },
    });

  } catch (e) {
    console.error('[sign/request]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
