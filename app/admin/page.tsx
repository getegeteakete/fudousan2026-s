'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import AITokenDashboard from '@/components/AITokenDashboard';
import {
  IconUser, IconSecurity, IconCheck, IconAlert, IconSettings,
  IconKey, IconDatabase, IconContracts, IconSparkle, IconTrend,
} from '@/components/Icons';

const TABS = [
  { key: 'ai', label: 'AIトークン管理', icon: <IconSparkle size={13} /> },
  { key: 'users', label: 'ユーザー管理', icon: <IconUser size={13} /> },
  { key: 'system', label: 'システム状態', icon: <IconDatabase size={13} /> },
  { key: 'budget', label: 'API予算設定', icon: <IconTrend size={13} /> },
];

const MOCK_USERS = [
  { id: '1', name: '山田 一郎', email: 'yamada@propsign.co.jp', role: 'admin', license: '東京都知事（3）第123456号', mfa: true, lastLogin: '2024-12-15 14:32', status: 'active' },
  { id: '2', name: '鈴木 花子', email: 'suzuki@propsign.co.jp', role: 'agent', license: '東京都知事（2）第789012号', mfa: true, lastLogin: '2024-12-15 09:15', status: 'active' },
  { id: '3', name: '田中 次郎', email: 'tanaka@propsign.co.jp', role: 'agent', license: '', mfa: false, lastLogin: '2024-12-13 16:40', status: 'active' },
  { id: '4', name: '佐藤 三郎', email: 'sato@propsign.co.jp', role: 'viewer', license: '', mfa: false, lastLogin: '2024-11-28 11:20', status: 'inactive' },
];

const SYSTEM_STATUS = [
  { name: 'Supabase DB', status: 'ok', detail: 'PostgreSQL 15 / レスポンス 12ms', icon: <IconDatabase size={15} /> },
  { name: 'Anthropic API', status: 'ok', detail: 'Claude Sonnet 4 / レスポンス avg 2.1s', icon: <IconSparkle size={15} /> },
  { name: 'タイムスタンプ', status: 'ok', detail: 'RFC3161 / SHA-256', icon: <IconSecurity size={15} /> },
  { name: 'TLS証明書', status: 'ok', detail: 'TLS 1.3 / 有効期限 2025-06-15', icon: <IconKey size={15} /> },
  { name: 'メール配信', status: 'ok', detail: 'Resend / 配信率 99.2%', icon: <IconContracts size={15} /> },
  { name: 'バックアップ', status: 'warn', detail: '最終バックアップ 23時間前', icon: <IconDatabase size={15} /> },
];

export default function AdminPage() {
  const [tab, setTab] = useState('ai');
  const [budgetSettings, setBudgetSettings] = useState({
    monthlyBudget: '50',
    alertThreshold: '80',
    hardLimit: 'true',
  });
  const [saved, setSaved] = useState(false);

  const handleSaveBudget = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppLayout title="管理者ダッシュボード">
      {/* Admin header */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1626 0%, #1a2540 100%)',
        borderRadius: 'var(--radius-xl)', padding: '18px 24px', marginBottom: 22,
        display: 'flex', alignItems: 'center', gap: 14,
        border: '1px solid rgba(184,148,74,0.2)',
      }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(184,148,74,0.15)', border: '1px solid rgba(184,148,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconSettings size={20} color="var(--gold-light)" />
        </div>
        <div>
          <div style={{ fontFamily: 'Shippori Mincho, serif', fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 2 }}>管理者コントロールパネル</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>AIトークン・ユーザー・システム状態の管理</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>最終更新</div>
          <div style={{ fontSize: 12, color: 'var(--gold-light)', fontFamily: 'monospace' }}>
            {new Date().toLocaleString('ja-JP')}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <div key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {t.icon}{t.label}
          </div>
        ))}
      </div>

      {/* ── AI トークン管理 ── */}
      {tab === 'ai' && <AITokenDashboard />}

      {/* ── ユーザー管理 ── */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--text-sub)' }}>{MOCK_USERS.length}名のユーザー</div>
            <button className="btn btn-primary btn-sm">
              <IconUser size={13} /> ユーザー招待
            </button>
          </div>
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>ユーザー</th><th>権限</th><th>宅建士免許</th><th>MFA</th><th>最終ログイン</th><th>状態</th><th></th></tr>
                </thead>
                <tbody>
                  {MOCK_USERS.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: u.role === 'admin' ? 'rgba(155,35,53,0.1)' : u.role === 'agent' ? 'var(--earth-pale)' : 'var(--bg)',
                          color: u.role === 'admin' ? 'var(--red)' : 'var(--text-sub)',
                        }}>
                          {{ admin: '管理者', agent: '宅建士', viewer: '閲覧者' }[u.role]}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {u.license || '—'}
                      </td>
                      <td>
                        {u.mfa
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--green)' }}><IconCheck size={11} /> 有効</span>
                          : <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--red)' }}><IconAlert size={11} /> 未設定</span>}
                      </td>
                      <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{u.lastLogin}</td>
                      <td>
                        <span className={`status-badge ${u.status === 'active' ? 'status-completed' : 'status-expired'}`}>
                          {u.status === 'active' ? '有効' : '無効'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm">編集</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MFA warning */}
          {MOCK_USERS.some(u => !u.mfa && u.status === 'active') && (
            <div className="alert alert-warn" style={{ marginTop: 14 }}>
              <IconAlert size={14} />
              <div>
                <strong>MFA未設定のユーザーがいます</strong>
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  セキュリティ強化のため、全ユーザーにMFAの設定を推奨します。設定画面でMFA必須化を有効にできます。
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── システム状態 ── */}
      {tab === 'system' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>
            {SYSTEM_STATUS.map(s => (
              <div key={s.name} className="card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: s.status === 'ok' ? 'rgba(39,174,96,0.1)' : 'rgba(230,126,34,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: s.status === 'ok' ? 'var(--green)' : 'var(--gold)',
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</span>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: s.status === 'ok' ? 'var(--green)' : 'var(--gold)',
                        display: 'inline-block',
                        boxShadow: `0 0 4px ${s.status === 'ok' ? 'var(--green)' : 'var(--gold)'}`,
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Supabase setup guide */}
          <div className="card">
            <div className="card-header"><div className="card-title"><IconDatabase size={14} /> Supabase セットアップガイド</div></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { step: '1', title: 'Supabaseプロジェクト作成', desc: 'https://app.supabase.com でプロジェクトを作成し、URLとAnon Keyを取得', done: false },
                  { step: '2', title: 'スキーマのデプロイ', desc: 'supabase/schema.sql をSQL Editorで実行してテーブルを作成', done: false },
                  { step: '3', title: '環境変数の設定', desc: 'Vercel Dashboard → Settings → Environment Variables に.env.local.exampleの変数を追加', done: false },
                  { step: '4', title: 'Anthropic APIキー設定', desc: 'ANTHROPIC_API_KEY をVercelの環境変数に設定', done: false },
                  { step: '5', title: '認証設定', desc: 'Supabase → Authentication → URL Configuration に本番URLを設定', done: false },
                ].map(item => (
                  <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px', background: 'var(--earth-pale)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      background: item.done ? 'var(--green)' : 'var(--navy)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {item.done ? '✓' : item.step}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <a href="/PropSign_Setup.sql" download className="btn btn-outline btn-sm">
                  <IconDatabase size={13} /> schema.sql をダウンロード
                </a>
              </div>
            </div>
          </div>

          {/* Env vars display */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><div className="card-title"><IconKey size={14} /> 必要な環境変数</div></div>
            <div className="card-body">
              <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 2, background: 'var(--navy-deep)', padding: '14px 16px', borderRadius: 'var(--radius)', color: '#a8d8a8' }}>
                {`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
ANTHROPIC_API_KEY=sk-ant-api03-...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
RESEND_API_KEY=re_xxxxxxxx`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── API予算設定 ── */}
      {tab === 'budget' && (
        <div>
          {saved && <div className="alert alert-success" style={{ marginBottom: 16 }}><IconCheck size={14} /> 設定を保存しました</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="card">
              <div className="card-header"><div className="card-title"><IconSparkle size={14} /> AI API 予算設定</div></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">月次予算上限（USD）</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>$</span>
                    <input className="form-input" type="number" min="1" max="1000" step="5"
                      value={budgetSettings.monthlyBudget}
                      onChange={e => setBudgetSettings(s => ({ ...s, monthlyBudget: e.target.value }))} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    ≈ ¥{(parseFloat(budgetSettings.monthlyBudget) * 150).toLocaleString()}/月（1USD=150円換算）
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">アラート閾値（%）</label>
                  <input className="form-input" type="number" min="50" max="99"
                    value={budgetSettings.alertThreshold}
                    onChange={e => setBudgetSettings(s => ({ ...s, alertThreshold: e.target.value }))} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    予算の{budgetSettings.alertThreshold}%到達時に管理者へメール通知
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox"
                      checked={budgetSettings.hardLimit === 'true'}
                      onChange={e => setBudgetSettings(s => ({ ...s, hardLimit: e.target.checked ? 'true' : 'false' }))} />
                    予算超過時にAI機能を自動停止する（ハードリミット）
                  </label>
                </div>
                <button className="btn btn-gold btn-lg w-full" style={{ marginTop: 8 }} onClick={handleSaveBudget}>
                  <IconCheck size={14} /> 予算設定を保存
                </button>
              </div>
            </div>

            {/* Pricing reference */}
            <div className="card">
              <div className="card-header"><div className="card-title">Claude API 料金表</div></div>
              <div className="card-body">
                <table className="data-table">
                  <thead><tr><th>モデル</th><th>Input</th><th>Output</th></tr></thead>
                  <tbody>
                    {[
                      { model: 'Claude Sonnet 4', input: '$3.00', output: '$15.00', current: true },
                      { model: 'Claude Haiku 4.5', input: '$0.80', output: '$4.00', current: false },
                      { model: 'Claude Opus 4.5', input: '$15.00', output: '$75.00', current: false },
                    ].map(r => (
                      <tr key={r.model} style={{ background: r.current ? 'var(--earth-pale)' : undefined }}>
                        <td style={{ fontSize: 12, fontWeight: r.current ? 700 : 400 }}>
                          {r.model} {r.current && <span style={{ color: 'var(--gold)', fontSize: 10 }}>使用中</span>}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.input}/1M</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.output}/1M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-muted)' }}>
                  ※ 料金はAnthropicの公式価格（2025年時点）。為替レートは変動します。
                </div>

                <div style={{ marginTop: 16, padding: '12px', background: 'var(--earth-pale)', borderRadius: 'var(--radius)', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>目安コスト試算</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-sub)' }}>
                    <div>AIチャット 100回/月 → 約 ¥450</div>
                    <div>契約書生成 50件/月 → 約 ¥2,100</div>
                    <div>リーガルチェック 50件/月 → 約 ¥1,100</div>
                    <div style={{ fontWeight: 700, color: 'var(--navy)', marginTop: 4 }}>合計 ≈ ¥3,650/月</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Per-user AI usage */}
          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-header"><div className="card-title"><IconUser size={14} /> ユーザー別AIトークン使用量（今月）</div></div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>ユーザー</th><th>チャット</th><th>契約書生成</th><th>リーガルチェック</th><th>合計トークン</th><th>推定コスト</th></tr></thead>
                <tbody>
                  {[
                    { name: '山田 一郎', chat: 12400, gen: 8900, legal: 4200, total: 25500, cost: 0.1643 },
                    { name: '鈴木 花子', chat: 8200, gen: 4100, legal: 2800, total: 15100, cost: 0.0892 },
                    { name: '田中 次郎', chat: 5600, gen: 2400, legal: 1200, total: 9200, cost: 0.0532 },
                  ].map(u => (
                    <tr key={u.name}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{u.chat.toLocaleString()}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{u.gen.toLocaleString()}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{u.legal.toLocaleString()}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{u.total.toLocaleString()}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-sub)' }}>
                        ${u.cost.toFixed(4)}<br />
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>¥{Math.round(u.cost * 150).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
