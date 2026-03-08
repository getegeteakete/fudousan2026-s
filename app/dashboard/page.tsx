'use client';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_CONTRACTS, SAMPLE_PROPERTIES, STATUS_LABELS, TYPE_LABELS, formatCurrency, formatDate } from '@/lib/data';
import Link from 'next/link';
import { IconContracts, IconTrend, IconClock, IconCheck, IconAlert, IconArrow, IconProperties, IconNewContract, IconSparkle } from '@/components/Icons';

const statusCounts = SAMPLE_CONTRACTS.reduce((acc, c) => {
  acc[c.status] = (acc[c.status] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

export default function DashboardPage() {
  const pending = SAMPLE_CONTRACTS.filter(c => c.status === 'pending');
  const recent = [...SAMPLE_CONTRACTS].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  return (
    <AppLayout title="ダッシュボード">
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy-deep) 0%, var(--navy-light) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        marginBottom: 22,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        border: '1px solid rgba(184,148,74,0.2)',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 5, letterSpacing: '0.12em' }}>
            {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
          <div style={{ fontFamily: 'Shippori Mincho, serif', fontSize: 19, fontWeight: 700, marginBottom: 6, letterSpacing: '0.06em' }}>
            おはようございます、山田 一郎 宅建士
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            署名待ちの契約が <strong style={{ color: 'var(--gold-light)' }}>{pending.length}件</strong> あります
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/contracts/new" className="btn btn-gold">
            <IconNewContract size={14} /> 新規契約作成
          </Link>
          <Link href="/properties" className="btn btn-outline" style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)' }}>
            <IconProperties size={14} /> 物件管理
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
        <div className="stat-card earth">
          <div className="stat-label">締結完了</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{statusCounts.completed || 0}</div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Pending */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><IconAlert size={15} color="var(--gold)" /> 署名待ち契約</div>
            <Link href="/contracts" className="btn btn-outline btn-sm">すべて <IconArrow size={12} /></Link>
          </div>
          <div style={{ padding: 0 }}>
            {pending.length === 0 ? (
              <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>署名待ちはありません</div>
            ) : pending.map((c) => (
              <div key={c.id} style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.propertyName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.tenantName} / {TYPE_LABELS[c.type]}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span className="status-badge status-pending">署名待ち</span>
                  <Link href={`/contracts/${c.id}`} className="btn btn-primary btn-sm">詳細</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><IconClock size={15} color="var(--blue)" /> 最近の更新</div>
          </div>
          <div style={{ padding: 0 }}>
            {recent.map((c) => (
              <div key={c.id} style={{ padding: '11px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: c.status === 'completed' ? 'var(--green)' : c.status === 'pending' ? 'var(--gold)' : c.status === 'signed' ? 'var(--blue)' : 'var(--border-dark)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.propertyName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.auditLog[c.auditLog.length - 1]?.event}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {new Date(c.updatedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flow */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-header"><div className="card-title"><IconContracts size={15} /> 電子契約フロー</div></div>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
          {[
            { icon: '📁', label: 'CSV\nインポート', color: 'var(--blue)' },
            { arrow: true },
            { icon: '📝', label: '契約書\n自動生成', color: 'var(--navy)' },
            { arrow: true },
            { icon: '⚖️', label: '宅建士\nAIチェック', color: 'var(--gold)' },
            { arrow: true },
            { icon: '📧', label: '署名依頼\n送信', color: 'var(--nezumi)' },
            { arrow: true },
            { icon: '✍️', label: '顧客\n電子署名', color: 'var(--green)' },
            { arrow: true },
            { icon: '🔐', label: 'タイムスタンプ\n付与', color: 'var(--red)' },
            { arrow: true },
            { icon: '✅', label: '締結完了\n保管', color: 'var(--green)' },
          ].map((s, i) => 'arrow' in s ? (
            <span key={i} style={{ color: 'var(--earth)', fontSize: 16, flexShrink: 0 }}>›</span>
          ) : (
            <div key={i} style={{ textAlign: 'center', minWidth: 68, flexShrink: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', border: `1.5px solid ${s.color}30`, background: s.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, margin: '0 auto 6px' }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-sub)', whiteSpace: 'pre-line', lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { title: '宅建業法（改正）', detail: '35条・37条書面 電子交付対応済み' },
          { title: '電子帳簿保存法', detail: '2024年1月義務化 完全準拠・7年保存' },
          { title: '電子署名法', detail: 'PKI基盤・タイムスタンプ 法的効力担保' },
        ].map((item) => (
          <div key={item.title} className="alert alert-success">
            <span style={{ flexShrink: 0, marginTop: 1 }}><IconCheck size={14} /></span>
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
