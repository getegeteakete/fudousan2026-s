/**
 * PropSign メール送信ライブラリ（Resend）
 * RESEND_API_KEY が未設定の場合はコンソールログにフォールバック
 */

const RESEND_API = 'https://api.resend.com/emails';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'PropSign <noreply@propsign.co.jp>';
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fudousan2026-system2.vercel.app';

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
  fallback?: boolean;  // true = APIキー未設定でコンソール出力のみ
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY ?? '';

  if (!key || key === 're_xxxxxx' || !key.startsWith('re_')) {
    // APIキー未設定 → サーバーログに出力してsuccess扱い
    console.log('[PropSign Email - FALLBACK MODE]', {
      to: params.to,
      subject: params.subject,
      preview: params.html.replace(/<[^>]+>/g, '').slice(0, 200),
    });
    return { success: true, fallback: true, id: `fallback-${Date.now()}` };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[PropSign Email] Resend error:', data);
      return { success: false, error: data.message ?? `HTTP ${res.status}` };
    }
    return { success: true, id: data.id };
  } catch (e) {
    console.error('[PropSign Email] fetch error:', e);
    return { success: false, error: String(e) };
  }
}

/* ─── 署名依頼メール ─────────────────────────────── */
export async function sendSignatureRequestEmail(params: {
  to: string;
  tenantName: string;
  propertyName: string;
  contractNo: string;
  agentName: string;
  companyName: string;
  signUrl: string;
  expiresAt?: string;
}): Promise<EmailResult> {
  const expiry = params.expiresAt
    ? new Date(params.expiresAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : '7日後';

  const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f2ee;font-family:'Noto Sans JP','Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <!-- Header -->
        <tr><td style="background:#0d1626;padding:24px 32px;text-align:center;">
          <div style="display:inline-block;width:40px;height:40px;background:linear-gradient(135deg,#b8944a,#d4af6b);border-radius:8px;line-height:40px;font-size:18px;font-weight:900;color:#0d1626;margin-bottom:8px;">判</div>
          <div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:0.04em;">PropSign</div>
          <div style="color:rgba(255,255,255,0.45);font-size:11px;letter-spacing:0.1em;margin-top:2px;">不動産電子契約システム</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-size:18px;font-weight:700;color:#1a2540;margin:0 0 16px;border-left:3px solid #b8944a;padding-left:10px;">電子署名のご依頼</h1>
          <p style="color:#3a3a3a;font-size:14px;line-height:1.9;margin:0 0 20px;">${params.tenantName} 様<br><br>
          この度は、${params.companyName}をご利用いただき誠にありがとうございます。<br>
          以下の契約書について、電子署名をお願い申し上げます。</p>

          <!-- Contract Info -->
          <table width="100%" style="border-collapse:collapse;margin-bottom:24px;border-radius:8px;overflow:hidden;">
            <tr style="background:#f5f0e8;">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#888;width:40%;border-bottom:1px solid #eee;">契約書番号</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#1a2540;border-bottom:1px solid #eee;font-family:monospace;">${params.contractNo}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #eee;">物件名</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1a2540;border-bottom:1px solid #eee;">${params.propertyName}</td>
            </tr>
            <tr style="background:#f5f0e8;">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #eee;">担当宅建士</td>
              <td style="padding:10px 14px;font-size:13px;color:#1a2540;border-bottom:1px solid #eee;">${params.agentName}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#888;">署名期限</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#9b2335;">${expiry} まで</td>
            </tr>
          </table>

          <!-- CTA Button -->
          <div style="text-align:center;margin:28px 0;">
            <a href="${params.signUrl}" style="display:inline-block;background:linear-gradient(135deg,#b8944a,#d4af6b);color:#0d1626;font-size:15px;font-weight:700;padding:14px 40px;border-radius:8px;text-decoration:none;box-shadow:0 4px 16px rgba(184,148,74,0.35);">
              ✦ 電子署名を行う
            </a>
          </div>

          <p style="font-size:12px;color:#888;line-height:1.7;background:#f9f9f9;padding:12px 16px;border-radius:6px;margin-top:20px;">
            ⚠️ 本メールに心当たりがない場合は、このメールを無視してください。<br>
            リンクの有効期限は <strong>${expiry}</strong> です。期限後はリンクが無効になります。<br>
            本署名はRFC3161準拠のタイムスタンプが付与され、宅地建物取引業法に基づく法的効力を有します。
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f5f0e8;padding:20px 32px;text-align:center;border-top:1px solid #e8e8e8;">
          <p style="font-size:12px;color:#b8944a;font-weight:700;margin:0 0 4px;">${params.companyName}</p>
          <p style="font-size:11px;color:#888;margin:0;">Powered by PropSign — 不動産電子契約システム</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return sendEmail({
    to: params.to,
    subject: `【署名依頼】${params.propertyName} の電子契約書 — ${params.contractNo}`,
    html,
  });
}

/* ─── 署名完了通知メール（担当者へ） ──────────────── */
export async function sendSignatureCompletedEmail(params: {
  to: string;            // 担当者メール
  agentName: string;
  tenantName: string;
  propertyName: string;
  contractNo: string;
  signedAt: string;
  timestampHash: string;
  contractUrl: string;
}): Promise<EmailResult> {
  const signedDate = new Date(params.signedAt).toLocaleString('ja-JP');

  const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f2ee;font-family:'Noto Sans JP','Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr><td style="background:#2d6a4f;padding:20px 32px;text-align:center;">
          <div style="color:#fff;font-size:22px;font-weight:700;">✓ 署名完了のお知らせ</div>
          <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:6px;">PropSign 電子契約システム</div>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="color:#3a3a3a;font-size:14px;line-height:1.9;margin:0 0 20px;">${params.agentName} 様<br><br>
          担当契約書への電子署名が完了しましたのでご連絡します。</p>

          <table width="100%" style="border-collapse:collapse;margin-bottom:20px;">
            <tr style="background:#f5f0e8;">
              <td style="padding:9px 14px;font-size:12px;font-weight:700;color:#888;width:40%;border-bottom:1px solid #eee;">契約書番号</td>
              <td style="padding:9px 14px;font-size:13px;font-family:monospace;font-weight:700;color:#1a2540;border-bottom:1px solid #eee;">${params.contractNo}</td>
            </tr>
            <tr>
              <td style="padding:9px 14px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #eee;">物件名</td>
              <td style="padding:9px 14px;font-size:13px;font-weight:600;border-bottom:1px solid #eee;">${params.propertyName}</td>
            </tr>
            <tr style="background:#f5f0e8;">
              <td style="padding:9px 14px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #eee;">署名者</td>
              <td style="padding:9px 14px;font-size:13px;border-bottom:1px solid #eee;">${params.tenantName}</td>
            </tr>
            <tr>
              <td style="padding:9px 14px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #eee;">署名日時</td>
              <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#2d6a4f;border-bottom:1px solid #eee;">${signedDate}</td>
            </tr>
            <tr style="background:#f5f0e8;">
              <td style="padding:9px 14px;font-size:12px;font-weight:700;color:#888;">タイムスタンプ</td>
              <td style="padding:9px 14px;font-size:10px;font-family:monospace;color:#666;word-break:break-all;">${params.timestampHash}</td>
            </tr>
          </table>

          <div style="text-align:center;margin:24px 0;">
            <a href="${params.contractUrl}" style="display:inline-block;background:#1a2540;color:#fff;font-size:14px;font-weight:700;padding:12px 32px;border-radius:8px;text-decoration:none;">
              契約書を確認する →
            </a>
          </div>
          <p style="font-size:11px;color:#aaa;text-align:center;margin-top:16px;">
            電子帳簿保存法に基づき、本契約データは7年間保存されます。
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return sendEmail({
    to: params.to,
    subject: `【署名完了】${params.tenantName}様 署名済み — ${params.contractNo}`,
    html,
  });
}

/* ─── 署名完了通知（借主へ） ─────────────────────── */
export async function sendSignatureReceiptEmail(params: {
  to: string;
  tenantName: string;
  propertyName: string;
  contractNo: string;
  signedAt: string;
  timestampHash: string;
}): Promise<EmailResult> {
  const signedDate = new Date(params.signedAt).toLocaleString('ja-JP');

  const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f2ee;font-family:'Noto Sans JP',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <tr><td style="background:#0d1626;padding:20px 32px;text-align:center;">
          <div style="color:#fff;font-size:18px;font-weight:700;">✓ 電子署名完了のご確認</div>
          <div style="color:rgba(184,148,74,0.8);font-size:12px;margin-top:4px;">PropSign 不動産電子契約</div>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="font-size:14px;line-height:1.9;color:#3a3a3a;">${params.tenantName} 様<br><br>
          電子署名が正常に完了しました。下記の内容をご確認ください。</p>
          <table width="100%" style="border-collapse:collapse;margin:16px 0 24px;">
            <tr style="background:#f5f0e8;"><td style="padding:9px 14px;font-size:12px;font-weight:700;color:#888;width:40%;border-bottom:1px solid #eee;">物件名</td><td style="padding:9px 14px;font-size:13px;font-weight:600;border-bottom:1px solid #eee;">${params.propertyName}</td></tr>
            <tr><td style="padding:9px 14px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #eee;">契約書番号</td><td style="padding:9px 14px;font-size:12px;font-family:monospace;border-bottom:1px solid #eee;">${params.contractNo}</td></tr>
            <tr style="background:#f5f0e8;"><td style="padding:9px 14px;font-size:12px;font-weight:700;color:#888;border-bottom:1px solid #eee;">署名日時</td><td style="padding:9px 14px;font-size:13px;font-weight:600;color:#2d6a4f;border-bottom:1px solid #eee;">${signedDate}</td></tr>
            <tr><td style="padding:9px 14px;font-size:12px;font-weight:700;color:#888;">タイムスタンプ</td><td style="padding:9px 14px;font-size:10px;font-family:monospace;color:#666;word-break:break-all;">${params.timestampHash}</td></tr>
          </table>
          <div style="background:#f5f0e8;border-radius:8px;padding:14px 16px;">
            <p style="font-size:12px;color:#666;margin:0;line-height:1.7;">
              📋 本署名はRFC3161準拠のタイムスタンプが付与されており、宅地建物取引業法に基づく法的効力を有します。<br>
              📁 電子帳簿保存法に基づき、本契約データは7年間安全に保存されます。<br>
              ❓ ご不明な点は担当者までお問い合わせください。
            </p>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return sendEmail({
    to: params.to,
    subject: `【署名完了証明】${params.propertyName} 電子契約書 — ${params.contractNo}`,
    html,
  });
}

export { APP_URL };
