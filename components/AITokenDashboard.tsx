'use client';
import { useState, useEffect, useCallback } from 'react';
import { IconSparkle, IconTrend, IconAlert, IconClock, IconUser } from './Icons';

interface TokenStats {
  totalTokens: number;
  totalCost: number;
  callCount: number;
  byOperation: Record<string, { tokens: number; cost: number; count: number }>;
  daily: Array<{ date: string; tokens: number; cost: number }>;
  recentCalls: Array<{
    id: string; operation: string; model: string;
    input_tokens: number; output_tokens: number; total_tokens: number;
    cost_usd: number; response_ms: number | null; created_at: string;
  }>;
}

interface Budget {
  used: number; budget: number; percentage: number; alert: boolean;
}

const OP_LABELS: Record<string, string> = {
  chat: 'AIチャット', generate: '契約書生成', legal_check: 'リーガルチェック',
  special_terms: '特約生成', summary: 'サマリ生成',
};
const OP_COLORS: Record<string, string> = {
  chat: 'var(--blue)', generate: 'var(--navy)', legal_check: 'var(--gold)',
  special_terms: 'var(--green)', summary: 'var(--nezumi)',
};

// Format numbers
const fmt = (n: number) => n.toLocaleString();
const fmtUsd = (n: number) => `$${n.toFixed(4)}`;
const fmtJpy = (n: number) => `¥${Math.round(n * 150).toLocaleString()}`; // USD→JPY 概算

export default function AITokenDashboard() {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'summary' | 'breakdown' | 'log'>('summary');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/token-stats?period=${period}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStats(data.stats);
      setBudget(data.budget);
    } catch (e) {
      setError(String(e));
      // デモデータ（Supabase未設定時）
      setStats(DEMO_STATS);
      setBudget({ used: 3.42, budget: 50, percentage: 6.84, alert: false });
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const maxDaily = Math.max(...(stats?.daily.map(d => d.tokens) ?? [1]));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontFamily: 'Shippori Mincho, serif', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--navy-deep)' }}>
          <IconSparkle size={16} color="var(--gold)" /> AI トークン使用量管理
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['today', 'week', 'month'] as const).map(p => (
            <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPeriod(p)}>
              {{ today: '今日', week: '7日間', month: '今月' }[p]}
            </button>
          ))}
          <button className="btn btn-outline btn-sm" onClick={fetchStats}>↻</button>
        </div>
      </div>

      {/* Budget Alert */}
      {budget?.alert && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <IconAlert size={14} />
          <div>
            <strong>AI予算の{budget.percentage.toFixed(0)}%を使用しました</strong>
            <span style={{ marginLeft: 8, fontSize: 12 }}>{fmtUsd(budget.used)} / {fmtUsd(budget.budget)}</span>
          </div>
        </div>
      )}

      {/* Budget bar */}
      {budget && (
        <div style={{ marginBottom: 20, padding: '14px 18px', background: 'var(--earth-pale)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--earth-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>月次AI予算使用状況</span>
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: budget.alert ? 'var(--red)' : 'var(--text-main)', fontWeight: 700 }}>
              {fmtUsd(budget.used)} / {fmtUsd(budget.budget)}（{fmtJpy(budget.used)}）
            </span>
          </div>
          <div style={{ height: 10, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99, transition: 'width 0.6s ease',
              width: `${budget.percentage}%`,
              background: budget.percentage >= 80
                ? 'linear-gradient(90deg, var(--red) 0%, var(--red-light) 100%)'
                : budget.percentage >= 50
                  ? 'linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 100%)'
                  : 'linear-gradient(90deg, var(--green) 0%, var(--green-light) 100%)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: 'var(--text-muted)' }}>
            <span>0%</span><span>50%</span><span>80% 警告</span><span>100%</span>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: '総トークン数', value: stats ? fmt(stats.totalTokens) : '---', sub: 'input + output', icon: <IconSparkle size={15} />, color: 'var(--navy)' },
          { label: '推定コスト', value: stats ? fmtJpy(stats.totalCost) : '---', sub: fmtUsd(stats?.totalCost ?? 0), icon: <IconTrend size={15} />, color: 'var(--gold)' },
          { label: 'API呼び出し数', value: stats ? fmt(stats.callCount) : '---', sub: '件', icon: <IconClock size={15} />, color: 'var(--blue)' },
          { label: '平均コスト/回', value: stats && stats.callCount > 0 ? fmtJpy(stats.totalCost / stats.callCount) : '---', sub: '1回あたり', icon: <IconUser size={15} />, color: 'var(--green)' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 10, right: 10, opacity: 0.15, transform: 'scale(2)', color: s.color }}>{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 22, color: s.color }}>{loading ? '…' : s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'summary', label: '日次推移' },
          { key: 'breakdown', label: '操作別内訳' },
          { key: 'log', label: '呼び出し履歴' },
        ].map(t => (
          <div key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as typeof tab)}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Daily chart */}
      {tab === 'summary' && (
        <div className="card">
          <div className="card-header"><div className="card-title">日次トークン使用推移（直近7日）</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, paddingTop: 20 }}>
              {(stats?.daily ?? []).map((d) => (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {d.tokens > 0 ? fmt(d.tokens) : ''}
                  </div>
                  <div style={{
                    width: '100%', minHeight: 4, borderRadius: '4px 4px 0 0',
                    background: d.tokens > 0 ? 'linear-gradient(0deg, var(--navy) 0%, var(--navy-light) 100%)' : 'var(--border)',
                    height: `${maxDaily > 0 ? Math.max((d.tokens / maxDaily) * 100, d.tokens > 0 ? 8 : 2) : 2}px`,
                    transition: 'height 0.3s',
                  }} />
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(d.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {(stats?.daily ?? []).map((d) => (
                <div key={d.date} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
                  {d.cost > 0 ? fmtUsd(d.cost) : '-'}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Operation breakdown */}
      {tab === 'breakdown' && (
        <div className="card">
          <div className="card-header"><div className="card-title">操作別トークン内訳</div></div>
          <div className="card-body">
            {stats && Object.keys(stats.byOperation).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(stats.byOperation)
                  .sort((a, b) => b[1].tokens - a[1].tokens)
                  .map(([op, v]) => {
                    const pct = stats.totalTokens > 0 ? (v.tokens / stats.totalTokens) * 100 : 0;
                    return (
                      <div key={op}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: OP_COLORS[op] ?? 'var(--nezumi)', display: 'inline-block' }} />
                            {OP_LABELS[op] ?? op}
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{v.count}回</span>
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                            {fmt(v.tokens)} tokens ({fmtUsd(v.cost)})
                          </span>
                        </div>
                        <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: OP_COLORS[op] ?? 'var(--nezumi)', borderRadius: 99, transition: 'width 0.5s' }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{pct.toFixed(1)}%</div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 13 }}>
                {loading ? 'データ読み込み中...' : 'この期間のデータはありません'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Call log */}
      {tab === 'log' && (
        <div className="card">
          <div className="card-header"><div className="card-title">API呼び出し履歴（直近20件）</div></div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>日時</th><th>操作</th><th>モデル</th><th>入力</th><th>出力</th><th>合計</th><th>コスト</th><th>応答</th></tr>
              </thead>
              <tbody>
                {(stats?.recentCalls ?? []).map((call) => (
                  <tr key={call.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {new Date(call.created_at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}{' '}
                      {new Date(call.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: OP_COLORS[call.operation] ?? 'var(--nezumi)', display: 'inline-block' }} />
                        {OP_LABELS[call.operation] ?? call.operation}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>Sonnet 4</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'right' }}>{fmt(call.input_tokens)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'right' }}>{fmt(call.output_tokens)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'right', fontWeight: 700 }}>{fmt(call.total_tokens)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-sub)' }}>{fmtUsd(call.cost_usd)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                      {call.response_ms ? `${call.response_ms}ms` : '-'}
                    </td>
                  </tr>
                ))}
                {(stats?.recentCalls ?? []).length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                    {loading ? 'データ読み込み中...' : '履歴はありません'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-warn" style={{ marginTop: 12, fontSize: 12 }}>
          <IconAlert size={12} />
          <span>Supabase未接続のためデモデータを表示中。設定後に実データが表示されます。</span>
        </div>
      )}
    </div>
  );
}

// ─── デモデータ（Supabase未接続時） ─────────────────────────
const DEMO_STATS: TokenStats = {
  totalTokens: 48_320,
  totalCost: 0.2847,
  callCount: 47,
  byOperation: {
    chat: { tokens: 18_420, cost: 0.091, count: 28 },
    generate: { tokens: 15_800, cost: 0.112, count: 8 },
    legal_check: { tokens: 9_200, cost: 0.058, count: 7 },
    special_terms: { tokens: 3_200, cost: 0.018, count: 3 },
    summary: { tokens: 1_700, cost: 0.006, count: 1 },
  },
  daily: Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split('T')[0],
      tokens: Math.floor(Math.random() * 8000 + 2000),
      cost: Math.random() * 0.05 + 0.01,
    };
  }),
  recentCalls: [
    { id: '1', operation: 'chat', model: 'claude-sonnet-4-20250514', input_tokens: 420, output_tokens: 180, total_tokens: 600, cost_usd: 0.00396, response_ms: 1240, created_at: new Date(Date.now() - 3e5).toISOString() },
    { id: '2', operation: 'generate', model: 'claude-sonnet-4-20250514', input_tokens: 850, output_tokens: 1900, total_tokens: 2750, cost_usd: 0.031, response_ms: 4820, created_at: new Date(Date.now() - 8e5).toISOString() },
    { id: '3', operation: 'legal_check', model: 'claude-sonnet-4-20250514', input_tokens: 520, output_tokens: 680, total_tokens: 1200, cost_usd: 0.0118, response_ms: 2100, created_at: new Date(Date.now() - 15e5).toISOString() },
    { id: '4', operation: 'chat', model: 'claude-sonnet-4-20250514', input_tokens: 380, output_tokens: 220, total_tokens: 600, cost_usd: 0.00444, response_ms: 980, created_at: new Date(Date.now() - 25e5).toISOString() },
    { id: '5', operation: 'special_terms', model: 'claude-sonnet-4-20250514', input_tokens: 310, output_tokens: 760, total_tokens: 1070, cost_usd: 0.0125, response_ms: 2340, created_at: new Date(Date.now() - 36e5).toISOString() },
  ],
};
