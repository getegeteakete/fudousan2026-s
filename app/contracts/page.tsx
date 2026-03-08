'use client';
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_CONTRACTS, STATUS_LABELS, TYPE_LABELS, formatDate } from '@/lib/data';
import type { ContractStatus, ContractType } from '@/lib/data';
import Link from 'next/link';
import { Search, Filter, Plus, Download, ChevronRight } from 'lucide-react';

export default function ContractsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ContractType | 'all'>('all');

  const filtered = SAMPLE_CONTRACTS.filter((c) => {
    const matchSearch = !search ||
      c.propertyName.includes(search) ||
      c.tenantName.includes(search) ||
      c.contractNo.includes(search);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const statusClass: Record<ContractStatus, string> = {
    draft: 'status-draft',
    pending: 'status-pending',
    signed: 'status-signed',
    completed: 'status-completed',
    expired: 'status-expired',
  };

  return (
    <AppLayout title="契約書管理">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 32 }}
            placeholder="物件名・契約者名・契約番号で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 130 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'all')}
        >
          <option value="all">全ステータス</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 130 }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ContractType | 'all')}
        >
          <option value="all">全契約種別</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <Link href="/contracts/new" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
          <Plus size={14} /> 新規作成
        </Link>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        {filtered.length}件表示中（全{SAMPLE_CONTRACTS.length}件）
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>契約番号</th>
                <th>物件名</th>
                <th>契約者</th>
                <th>種別</th>
                <th>ステータス</th>
                <th>作成日</th>
                <th>更新日</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>
                      {c.contractNo}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.propertyName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.propertyAddress}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{c.tenantName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.tenantEmail}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, background: 'var(--bg-base)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                      {TYPE_LABELS[c.type]}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${statusClass[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{formatDate(c.createdAt)}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(c.updatedAt)}</td>
                  <td>
                    <Link href={`/contracts/${c.id}`} className="btn btn-outline btn-sm">
                      詳細 <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    契約書が見つかりませんでした
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <span className={`status-badge status-${k}`}>{v}</span>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
