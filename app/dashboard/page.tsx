'use client';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_CONTRACTS, SAMPLE_PROPERTIES, STATUS_LABELS, TYPE_LABELS, formatCurrency, formatDate } from '@/lib/data';
import Link from 'next/link';
import { FileText, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowRight, Building2, PenLine } from 'lucide-react';

const statusCounts = SAMPLE_CONTRACTS.reduce((acc, c) => {
  acc[c.status] = (acc[c.status] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

export default function DashboardPage() {
  const pending = SAMPLE_CONTRACTS.filter(c => c.status === 'pending');
  const recent = [...SAMPLE_CONTRACTS].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  return (
    <AppLayout title="ダッシュボード">
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: 24,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
            {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>おはようございます、山田 一郎 宅建士</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            署名待ちの契約が <strong style={{ color: '#fbbf24' }}>{pending.length}件</strong> あります
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/contracts/new" className="btn btn-gold">
            <PenLine size={14} /> 新規契約作成
          </Link>
          <Link href="/properties" className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            <Building2 size={14} /> 物件管理
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card navy">
          <div className="stat-label">総契約数</div>
          <div className="stat-value">{SAMPLE_CONTRACTS.length}</div>
          <div className="stat-sub">全ステータス合計</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-label">署名待ち</div>
          <div className="stat-value">{statusCounts.pending || 0}</div>
          <div className="stat-sub">要アクション</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">締結完了</div>
          <div className="stat-value" style={{ color: 'var(--green-ok)' }}>{statusCounts.completed || 0}</div>
          <div className="stat-sub">今月</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">登録物件数</div>
          <div className="stat-value">{SAMPLE_PROPERTIES.length}</div>
          <div className="stat-sub">アクティブ</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">下書き</div>
          <div className="stat-value" style={{ color: 'var(--text-muted)' }}>{statusCounts.draft || 0}</div>
          <div className="stat-sub">作成中</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Pending contracts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={16} style={{ color: '#d97706' }} />
              署名待ち契約
            </div>
            <Link href="/contracts" className="btn btn-outline btn-sm">
              すべて見る <ArrowRight size={12} />
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {pending.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                署名待ちの契約はありません
              </div>
            ) : (
              pending.map((c) => (
                <div key={c.id} style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.propertyName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {c.tenantName} / {TYPE_LABELS[c.type]}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span className="status-badge status-pending">署名待ち</span>
                    <Link href={`/contracts/${c.id}`} className="btn btn-primary btn-sm">詳細</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} style={{ color: 'var(--blue-info)' }} />
              最近の更新
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recent.map((c) => (
              <div key={c.id} style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: c.status === 'completed' ? 'var(--green-ok)' :
                    c.status === 'pending' ? '#d97706' :
                    c.status === 'signed' ? 'var(--blue-info)' : 'var(--border-strong)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.propertyName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {c.auditLog[c.auditLog.length - 1]?.event}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {new Date(c.updatedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flow guide */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">電子契約フロー</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', padding: '8px 0' }}>
            {[
              { icon: '📁', label: 'CSV/物件\nインポート', color: '#3b82f6' },
              { icon: '→', arrow: true },
              { icon: '📝', label: '契約書\n自動生成', color: '#7c3aed' },
              { icon: '→', arrow: true },
              { icon: '⚖️', label: '宅建士\nAIチェック', color: '#d97706' },
              { icon: '→', arrow: true },
              { icon: '📧', label: '署名依頼\n送信', color: '#0891b2' },
              { icon: '→', arrow: true },
              { icon: '✍️', label: '顧客\n電子署名', color: '#059669' },
              { icon: '→', arrow: true },
              { icon: '🔐', label: 'タイムスタンプ\n付与', color: '#dc2626' },
              { icon: '→', arrow: true },
              { icon: '✅', label: '締結完了\n保管', color: '#16a34a' },
            ].map((step, i) => step.arrow ? (
              <span key={i} style={{ color: 'var(--border-strong)', fontSize: 18, flexShrink: 0 }}>›</span>
            ) : (
              <div key={i} style={{ textAlign: 'center', minWidth: 72, flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: step.color + '15',
                  border: `2px solid ${step.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, margin: '0 auto 6px',
                }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.3 }}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legal compliance */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { title: '宅建業法（改正）', detail: '35条・37条書面 電子交付 対応済み', ok: true },
          { title: '電子帳簿保存法', detail: '2024年1月義務化 完全準拠・7年保存', ok: true },
          { title: '電子署名法', detail: 'PKI基盤・タイムスタンプ 法的効力担保', ok: true },
        ].map((item) => (
          <div key={item.title} className={`alert ${item.ok ? 'alert-success' : 'alert-warn'}`}>
            <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 11 }}>{item.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
