import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import { sendSignatureCompletedEmail, sendSignatureReceiptEmail } from '@/lib/email';
import { createHash } from 'crypto';
import { getToken, deleteToken } from '@/lib/token-store';

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;

    // Supabase を試みる
    const sbAvailable = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('.supabase.co') &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ')
    );

    if (sbAvailable) {
      const supabase = createAdminSupabase();
      const { data: contract, error } = await supabase
        .from('contracts')
        .select('id, property_name, tenant_name, tenant_email, status, signature_expires_at, rent, start_date, end_date, type, contract_no, agent_name')
        .eq('signature_token', token)
        .single();

      if (error || !contract) return NextResponse.json({ error: '無効なリンクです' }, { status: 404 });
      const now = new Date();
      if (contract.signature_expires_at && new Date(contract.signature_expires_at) < now)
        return NextResponse.json({ error: '署名リンクの有効期限が切れています' }, { status: 410 });
      if (['signed', 'completed'].includes(contract.status))
        return NextResponse.json({ error: 'すでに署名済みです', status: contract.status }, { status: 409 });

      return NextResponse.json({ contract, source: 'supabase' });
    }

    // ローカルトークンマップから検索
    const local = getToken(token);
    if (!local) return NextResponse.json({ error: '無効なリンクです（Supabase未接続）', hint: 'supabase' }, { status: 404 });
    if (new Date(local.expiresAt) < new Date())
      return NextResponse.json({ error: '署名リンクの有効期限が切れています' }, { status: 410 });

    return NextResponse.json({
      contract: {
        id: local.contractId, tenant_name: local.tenantName,
        tenant_email: local.tenantEmail, property_name: local.propertyName,
        contract_no: local.contractNo, agent_name: local.agentName,
        type: local.type, status: 'pending', signature_expires_at: local.expiresAt,
      },
      source: 'local',
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const supabase = createAdminSupabase();
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
    const userAgent = req.headers.get('user-agent') ?? '';

    const { signatureData } = await req.json();

    const sbAvailable = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('.supabase.co') &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ')
    );

    // タイムスタンプハッシュ生成（RFC3161模擬）
    const tsData = `${token}:${ip}:${new Date().toISOString()}:${signatureData?.slice(0, 100) ?? ''}`;
    const timestampHash = createHash('sha256').update(tsData).digest('hex');
    const now = new Date().toISOString();

    let tenantEmail = '';
    let tenantName = '';
    let propertyName = '';
    let contractNo = '';
    let agentName = '';
    let agentEmail = '';
    let contractId = '';
    let updatedContract: Record<string, unknown> = {};

    if (sbAvailable) {
      const { data: contract, error } = await supabase
        .from('contracts').select('*').eq('signature_token', token).single();

      if (error || !contract) return NextResponse.json({ error: '無効なリンクです' }, { status: 404 });
      if (contract.signature_expires_at && new Date(contract.signature_expires_at) < new Date())
        return NextResponse.json({ error: '有効期限切れです' }, { status: 410 });
      if (['signed', 'completed'].includes(contract.status))
        return NextResponse.json({ error: '署名済みです' }, { status: 409 });

      const { data: updated, error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'signed', signed_at: now, signer_ip: ip,
          signature_data: signatureData, timestamp_hash: timestampHash,
          timestamp_at: now, signature_token: null,
        })
        .eq('id', contract.id).select().single();
      if (updateError) throw updateError;

      await supabase.from('audit_logs').insert({
        contract_id: contract.id, event: '電子署名完了',
        detail: `${contract.tenant_name}が署名完了。タイムスタンプ付与。`,
        ip_address: ip, user_agent: userAgent,
        metadata: { timestamp_hash: timestampHash, signature_type: contract.signature_type },
      });

      tenantEmail = contract.tenant_email;
      tenantName  = contract.tenant_name;
      propertyName= contract.property_name;
      contractNo  = contract.contract_no;
      agentName   = contract.agent_name ?? '担当者';
      contractId  = contract.id;
      updatedContract = updated;

    } else {
      // ローカルモード
      const local = getToken(token);
      if (!local) return NextResponse.json({ error: '無効なリンクです（ローカルトークン期限切れ）', hint: 'restart' }, { status: 404 });
      if (new Date(local.expiresAt) < new Date())
        return NextResponse.json({ error: '有効期限切れです' }, { status: 410 });

      tenantEmail  = local.tenantEmail;
      tenantName   = local.tenantName;
      propertyName = local.propertyName;
      contractNo   = local.contractNo;
      agentName    = local.agentName;
      agentEmail   = local.agentEmail ?? '';
      contractId   = local.contractId;
      deleteToken(token);
      updatedContract = { id: contractId, status: 'signed', signed_at: now };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const contractUrl = `${appUrl}/contracts/${contractId}`;
    const agentMailTo = agentEmail || process.env.RESEND_FROM_EMAIL || '';

    // ─── メール送信（並列） ────────────────────────────────
    const [receiptResult, completedResult] = await Promise.all([
      // 借主へ署名完了証明
      sendSignatureReceiptEmail({
        to: tenantEmail, tenantName, propertyName, contractNo,
        signedAt: now, timestampHash,
      }),
      // 担当者へ署名完了通知
      agentMailTo ? sendSignatureCompletedEmail({
        to: agentMailTo, agentName, tenantName, propertyName, contractNo,
        signedAt: now, timestampHash, contractUrl,
      }) : Promise.resolve({ success: false, error: '担当者メール未設定', fallback: false }),
    ]);

    return NextResponse.json({
      success: true, signedAt: now, timestampHash,
      contract: updatedContract,
      email: {
        receipt:   { sent: receiptResult.success,   fallback: receiptResult.fallback,   id: (receiptResult as {id?:string}).id },
        completed: { sent: completedResult.success, fallback: completedResult.fallback, id: (completedResult as {id?:string}).id },
      },
    });

  } catch (e) {
    console.error('[sign/token POST]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
