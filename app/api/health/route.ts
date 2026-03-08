import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string }> = {};

  const sbUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const sbAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const sbSvc  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const antKey = process.env.ANTHROPIC_API_KEY ?? '';

  const sbUrlOk  = sbUrl.includes('.supabase.co') && !sbUrl.includes('placeholder');
  const sbAnonOk = sbAnon.startsWith('eyJ') && sbAnon.length > 50;
  const sbSvcOk  = sbSvc.startsWith('eyJ') && sbSvc.length > 50;
  const antOk    = antKey.startsWith('sk-ant') && antKey.length > 30;

  checks.env_url     = { ok: sbUrlOk,  detail: sbUrlOk  ? sbUrl : '未設定' };
  checks.env_anon    = { ok: sbAnonOk, detail: sbAnonOk ? 'JWT設定済み ✓' : '未設定' };
  checks.env_service = { ok: sbSvcOk,  detail: sbSvcOk  ? 'JWT設定済み ✓' : '未設定' };
  checks.env_ai      = { ok: antOk,    detail: antOk    ? '設定済み ✓' : '未設定' };

  if (!sbSvcOk) {
    return NextResponse.json({ ok: false, checks, message: 'SUPABASE_SERVICE_ROLE_KEY未設定' });
  }

  const supabase = createAdminSupabase();

  try {
    const { error } = await supabase.from('system_settings').select('key').limit(1);
    if (error) throw error;
    checks.db_connect = { ok: true, detail: 'Supabase 接続成功 ✓' };
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    checks.db_connect = { ok: false, detail: 'DB接続失敗: ' + msg.slice(0, 100) };
    return NextResponse.json({ ok: false, checks, message: msg });
  }

  const tables = ['profiles','properties','contracts','audit_logs','ai_token_usage','system_settings'];
  const missing: string[] = [];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('count').limit(0);
    if (error) missing.push(t);
  }
  checks.db_tables = {
    ok: missing.length === 0,
    detail: missing.length === 0 ? `全${tables.length}テーブル確認済み ✓` : `未作成: ${missing.join(', ')}`,
  };

  let tokenCount = 0;
  try {
    const res = await supabase.from('ai_token_usage').select('*', { count: 'exact', head: true });
    tokenCount = res.count ?? 0;
  } catch {}
  checks.token_records = { ok: true, detail: `${tokenCount}件のトークン記録` };

  if (antOk) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': antKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }),
      });
      checks.anthropic = { ok: r.ok, detail: r.ok ? 'Anthropic API ✓' : `HTTP ${r.status}` };
    } catch (e) { checks.anthropic = { ok: false, detail: String(e).slice(0, 60) }; }
  } else {
    checks.anthropic = { ok: false, detail: 'APIキー未設定' };
  }

  const allOk = Object.values(checks).every(c => c.ok);
  return NextResponse.json({ ok: allOk, checks, message: allOk ? '全接続OK ✓' : 'schema.sqlの実行が必要です', timestamp: new Date().toISOString() });
}
