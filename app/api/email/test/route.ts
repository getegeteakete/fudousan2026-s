import { NextRequest, NextResponse } from 'next/server';
import { sendSignatureRequestEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();
    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: '有効なメールアドレスを指定してください' }, { status: 400 });
    }
    const apiKey = process.env.RESEND_API_KEY ?? '';
    const isConfigured = apiKey.startsWith('re_') && apiKey !== 're_xxxxxx';

    const result = await sendSignatureRequestEmail({
      to,
      tenantName: 'テスト 太郎',
      propertyName: 'PropSignテスト物件 101号室',
      contractNo: 'PS-TEST-' + Date.now().toString().slice(-6),
      agentName: '山田 宅建士',
      companyName: '株式会社PropSign不動産',
      signUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://fudousan2026-system2.vercel.app'}/sign/test-demo`,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    });

    return NextResponse.json({
      success: result.success,
      mode: isConfigured ? 'resend_api' : 'fallback_log',
      to, id: result.id, fallback: result.fallback ?? false, error: result.error,
      message: result.fallback
        ? 'RESEND_API_KEY未設定→サーバーログに出力。Vercel環境変数にRESEND_API_KEYを設定してください。'
        : result.success ? `${to} にテストメールを送信しました` : `送信失敗: ${result.error}`,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY ?? '';
  const isConfigured = apiKey.startsWith('re_') && apiKey !== 're_xxxxxx';
  return NextResponse.json({
    status: isConfigured ? 'configured' : 'not_configured',
    mode: isConfigured ? 'resend_api' : 'fallback_log',
    from: process.env.RESEND_FROM_EMAIL ?? '未設定',
    message: isConfigured ? '✅ Resend API接続済み' : '⚠️ RESEND_API_KEY未設定 — フォールバックモード',
    usage: 'POST { "to": "your@email.com" }',
    resend_dashboard: 'https://resend.com/overview',
    pricing: 'Free: 月3,000通 / 日100通',
  });
}
