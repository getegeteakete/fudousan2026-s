import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

type Row = {
  id: string; operation: string; model: string;
  input_tokens: number; output_tokens: number;
  total_tokens?: number; cost_usd?: string | number;
  response_ms?: number; created_at: string;
};

function getTotal(r: Row): number {
  if (r.total_tokens != null) return Number(r.total_tokens);
  return Number(r.input_tokens ?? 0) + Number(r.output_tokens ?? 0);
}
function getCost(r: Row): number { return parseFloat(String(r.cost_usd ?? 0)); }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') ?? 'month') as 'today' | 'week' | 'month' | 'all';

  const supabase = createAdminSupabase();
  const now = new Date();

  let since: Date;
  switch (period) {
    case 'today': since = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    case 'week':  since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case 'month': since = new Date(now.getFullYear(), now.getMonth(), 1); break;
    default:      since = new Date(0);
  }

  const { data: raw, error } = await supabase
    .from('ai_token_usage')
    .select('id,operation,model,input_tokens,output_tokens,total_tokens,cost_usd,response_ms,created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      hint: error.message.includes('does not exist') || error.code === '42P01'
        ? 'SCHEMA_MISSING'
        : 'DB_ERROR',
      stats: null, budget: null,
    });
  }

  const data: Row[] = raw ?? [];

  // 集計
  const byOperation: Record<string, { tokens: number; cost: number; count: number }> = {};
  data.forEach(r => {
    if (!byOperation[r.operation]) byOperation[r.operation] = { tokens: 0, cost: 0, count: 0 };
    byOperation[r.operation].tokens += getTotal(r);
    byOperation[r.operation].cost   += getCost(r);
    byOperation[r.operation].count  += 1;
  });

  const totalTokens = data.reduce((s, r) => s + getTotal(r), 0);
  const totalCost   = data.reduce((s, r) => s + getCost(r), 0);

  // 日次7日
  const daily: Record<string, { tokens: number; cost: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    daily[d.toISOString().split('T')[0]] = { tokens: 0, cost: 0 };
  }
  data.forEach(r => {
    const key = r.created_at.split('T')[0];
    if (daily[key]) { daily[key].tokens += getTotal(r); daily[key].cost += getCost(r); }
  });

  // 予算
  let budget = { used: totalCost, budget: 50, percentage: 0, alert: false };
  try {
    const { data: s } = await supabase.from('system_settings').select('value').eq('key', 'monthly_ai_budget_usd').single();
    const bv = parseFloat(s?.value ?? '50');
    const ms = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: md } = await supabase.from('ai_token_usage').select('cost_usd').gte('created_at', ms.toISOString());
    const mc = (md ?? []).reduce((s, r) => s + getCost(r as Row), 0);
    const pct = Math.min((mc / bv) * 100, 100);
    budget = { used: mc, budget: bv, percentage: pct, alert: pct >= 80 };
  } catch { /* system_settings未作成でも続行 */ }

  return NextResponse.json({
    ok: true,
    stats: {
      totalTokens, totalCost, callCount: data.length, byOperation,
      daily: Object.entries(daily).map(([date, v]) => ({ date, ...v })),
      recentCalls: data.slice(0, 20),
    },
    budget,
  });
}
