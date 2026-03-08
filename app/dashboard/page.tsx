'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_CONTRACTS, SAMPLE_PROPERTIES, STATUS_LABELS, TYPE_LABELS, formatCurrency, formatDate } from '@/lib/data';
import type { Contract } from '@/lib/data';
import { IconContracts, IconProperties, IconAlert, IconClock, IconArrow, IconSign } from '@/components/Icons';
import AITokenDashboard from '@/components/AITokenDashboard';
import { getLocalContracts, getLocalProperties } from '@/lib/store';

const statusClass: Record<string, string> = {
  draft: 'status-draft', pending: 'status-pending', signed: 'status-signed',
  completed: 'status-completed', expired: 'status-expired',
};

export default function DashboardPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [propertyCount, setPropertyCount] = useState(0);

  useEffect(() => {
    const local = getLocalContracts();
    const localIds = new Set(local.map(c => c.id));
    const merged = [...local, ...SAMPLE_CONTRACTS.filter(c => !localIds.has(c.id))];
    setContracts(merged);

    const localProps = getLocalProperties();
    const localPropIds = new Set(localProps.map(p => p.id));
    setPropertyCount(localProps.length + SAMPLE_PROPERTIES.filter(p => !localPropIds.has(p.id)).length);
  }, []);

  const statusCounts = contracts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  const pending = contracts.filter(c => c.status === 'pending');
  const recent  = [...contracts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  return (
    <AppLayout title="ダッシュボード">
      {/* KPI */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">総契約書数</div>
          <div className="stat-value">{contracts.length}</div>
          <div className="stat-sub">全ステータス合計</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">署名待ち</div>
          <div className="stat-value" style={{ color: 'var(--gold)' }}>{statusCounts.pending || 0}</div>
          <div className="stat-sub">対応が必要</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">締結完了</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{statusCounts.completed || 0}</div>
          <div className="stat-sub">完了</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">管理物件数</div>
          <div className="stat-value">{propertyCount}</div>
          <div className="stat-sub">登録済み</div>
        </div>
      </div>

      {/* 署名待ちアラート */}
      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(184,148,74,0.4)', background: 'rgba(232,212,154,0.08)' }}>
          <div className="card-header">
            <div className="card-title" style={{ color: 'var(--gold)' }}>
              <IconAlert size={14} color="var(--gold)" /> 署名待ち ({pending.length}件)
            </div>
            <Link href="/contracts?status=pending" className="btn btn-outline btn-sm">
              すべて確認 <IconArrow size={12} />
            </Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.slice(0, 3).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <IconClock size={14} color="var(--gold)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.propertyName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.tenantName} · {c.sentAt ? `送信済み ${formatDate(c.sentAt)}` : '未送信'}</div>
                </div>
                <Link href={`/contracts/${c.id}`} className="btn btn-gold btn-sm">
                  <IconSign size={12} /> 署名
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 直近の契約書 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title"><IconContracts size={14} /> 直近の契約書</div>
          <Link href="/contracts" className="btn btn-outline btn-sm">一覧 <IconArrow size={12} /></Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>契約番号</th><th>物件名</th><th>契約者</th>
                <th>種別</th><th>ステータス</th><th>更新日</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    <Link href="/contracts/new" className="btn btn-primary btn-sm">最初の契約書を作成</Link>
                  </td>
                </tr>
              ) : recent.map(row => (
                <tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/contracts/${row.id}`)}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.contractNo}</td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{row.propertyName}</td>
                  <td style={{ fontSize: 12 }}>{row.tenantName}</td>
                  <td><span className="status-badge" style={{ background: 'var(--earth-pale)', color: 'var(--navy)' }}>{TYPE_LABELS[row.type]}</span></td>
                  <td><span className={`status-badge ${statusClass[row.status]}`}>{STATUS_LABELS[row.status]}</span></td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AITokenDashboard />
    </AppLayout>
  );
}
