'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  SAMPLE_CUSTOMERS, CUSTOMER_TYPE_LABELS, CUSTOMER_STATUS_LABELS,
  type Customer, type CustomerType, type CustomerStatus,
} from '@/lib/data';
import { getLocalCustomers, saveLocalCustomer, deleteLocalCustomer } from '@/lib/store';
import { IconSearch, IconPlus, IconUser, IconCheck, IconAlert, IconClose, IconArrow, IconContracts } from '@/components/Icons';

const statusColor: Record<CustomerStatus, string> = {
  active: 'status-completed', inactive: 'status-expired', prospect: 'status-pending',
};
const typeColor: Record<CustomerType, string> = {
  tenant: '#2d6a4f', buyer: '#1a2540', owner: '#b8944a', corporate: '#7a7a7a',
};

function CustomerModal({ customer, onSave, onClose }: {
  customer: Customer | null;
  onSave: (c: Customer) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Customer>(customer ?? {
    id: `cu-${Date.now()}`, type: 'tenant', status: 'prospect',
    name: '', nameKana: '', email: '', phone: '', address: '',
    birthDate: '', company: '', notes: '', contractIds: [], tags: [],
    assignedAgent: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });
  const [tagInput, setTagInput] = useState('');
  const [formError, setFormError] = useState('');

  const up = (p: Partial<Customer>) => setForm(f => ({ ...f, ...p }));
  const addTag = () => {
    if (tagInput.trim()) {
      up({ tags: [...(form.tags ?? []), tagInput.trim()] });
      setTagInput('');
    }
  };
  const removeTag = (tag: string) => up({ tags: (form.tags ?? []).filter(t => t !== tag) });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,22,38,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--navy-deep)', borderRadius: '12px 12px 0 0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'white', fontFamily: 'Shippori Mincho, serif' }}>
            {customer ? '顧客情報編集' : '新規顧客登録'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}><IconClose size={20} /></button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div className="form-grid form-grid-2" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="form-label">種別</label>
              <select className="form-select" value={form.type} onChange={e => up({ type: e.target.value as CustomerType })}>
                {Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">ステータス</label>
              <select className="form-select" value={form.status} onChange={e => up({ status: e.target.value as CustomerStatus })}>
                {Object.entries(CUSTOMER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">氏名・会社名<span className="required">*</span></label>
              <input className="form-input" value={form.name} onChange={e => up({ name: e.target.value })} placeholder="山田 太郎" />
            </div>
            <div className="form-group">
              <label className="form-label">フリガナ</label>
              <input className="form-input" value={form.nameKana ?? ''} onChange={e => up({ nameKana: e.target.value })} placeholder="ヤマダ タロウ" />
            </div>
            <div className="form-group">
              <label className="form-label">メールアドレス<span className="required">*</span></label>
              <input className="form-input" type="email" value={form.email} onChange={e => up({ email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">電話番号</label>
              <input className="form-input" value={form.phone} onChange={e => up({ phone: e.target.value })} placeholder="090-xxxx-xxxx" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">住所</label>
              <input className="form-input" value={form.address ?? ''} onChange={e => up({ address: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">生年月日</label>
              <input className="form-input" type="date" value={form.birthDate ?? ''} onChange={e => up({ birthDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">担当者</label>
              <input className="form-input" value={form.assignedAgent ?? ''} onChange={e => up({ assignedAgent: e.target.value })} placeholder="山田 一郎" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">タグ</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {(form.tags ?? []).map(tag => (
                  <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--earth-pale)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>
                    {tag}<button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="form-input" style={{ flex: 1 }} value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="タグを入力してEnter" />
                <button className="btn btn-outline btn-sm" onClick={addTag}>追加</button>
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">メモ・備考</label>
              <textarea className="form-textarea" rows={3} value={form.notes ?? ''} onChange={e => up({ notes: e.target.value })} placeholder="希望条件、対応履歴など…" />
            </div>
          </div>
          {formError && <div className="alert alert-danger" style={{ marginBottom: 10 }}>{formError}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button className="btn btn-outline" onClick={onClose}>キャンセル</button>
            <button className="btn btn-gold btn-lg" onClick={() => { if (form.name && form.email) { onSave({ ...form, updatedAt: new Date().toISOString() }); onClose(); } else setFormError('氏名とメールアドレスを入力してください'); }}>
              <IconCheck size={14} /> {customer ? '更新' : '登録'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch]   = useState('');
  const [typeF, setTypeF]     = useState<CustomerType | 'all'>('all');
  const [statusF, setStatusF] = useState<CustomerStatus | 'all'>('all');
  const [modal, setModal]     = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });
  const [detail, setDetail]   = useState<Customer | null>(null);
  const [saved, setSaved]     = useState('');

  useEffect(() => {
    const local = getLocalCustomers();
    const localIds = new Set(local.map(c => c.id));
    setCustomers([...local, ...SAMPLE_CUSTOMERS.filter(c => !localIds.has(c.id))]);
  }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const ms = !search || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
    return ms && (typeF === 'all' || c.type === typeF) && (statusF === 'all' || c.status === statusF);
  });

  const handleSave = (cu: Customer) => {
    saveLocalCustomer(cu);
    const local = getLocalCustomers();
    const localIds = new Set(local.map(c => c.id));
    setCustomers([...local, ...SAMPLE_CUSTOMERS.filter(c => !localIds.has(c.id))]);
    setSaved('保存しました');
    setTimeout(() => setSaved(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (!confirm('この顧客を削除しますか？')) return;
    deleteLocalCustomer(id);
    setCustomers(customers.filter(c => c.id !== id));
    setDetail(null);
  };

  if (detail) return (
    <AppLayout title={`顧客詳細 - ${detail.name}`}>
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-outline btn-sm" onClick={() => setDetail(null)}>← 一覧に戻る</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><IconUser size={14} /> 基本情報</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-outline btn-sm" onClick={() => { setModal({ open: true, customer: detail }); }}>編集</button>
              <button className="btn btn-sm" style={{ background: 'var(--red)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', padding: '5px 10px', fontSize: 12 }}
                onClick={() => handleDelete(detail.id)}>削除</button>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: typeColor[detail.type] ?? 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                {detail.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Shippori Mincho, serif' }}>{detail.name}</div>
                {detail.nameKana && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{detail.nameKana}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span className={`status-badge ${statusColor[detail.status]}`}>{CUSTOMER_STATUS_LABELS[detail.status]}</span>
                  <span className="status-badge" style={{ background: 'var(--earth-pale)', color: 'var(--navy)' }}>{CUSTOMER_TYPE_LABELS[detail.type]}</span>
                </div>
              </div>
            </div>
            {[
              { label: 'メール', val: detail.email },
              { label: '電話', val: detail.phone },
              { label: '住所', val: detail.address },
              { label: '生年月日', val: detail.birthDate },
              { label: '担当者', val: detail.assignedAgent },
            ].filter(r => r.val).map(row => (
              <div key={row.label} style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)', width: 80, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontWeight: 600, wordBreak: 'break-all' }}>{row.val}</span>
              </div>
            ))}
            {(detail.tags ?? []).length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                {detail.tags!.map(tag => (
                  <span key={tag} style={{ background: 'var(--earth-pale)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          {detail.notes && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><div className="card-title">メモ・備考</div></div>
              <div className="card-body"><p style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{detail.notes}</p></div>
            </div>
          )}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><IconContracts size={14} /> 関連契約書 ({detail.contractIds.length}件)</div>
              <a href={`/contracts/new?customerName=${encodeURIComponent(detail.name)}&customerEmail=${encodeURIComponent(detail.email)}`} className="btn btn-primary btn-sm">新規契約作成</a>
            </div>
            <div className="card-body">
              {detail.contractIds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>関連する契約書がありません</div>
              ) : (
                detail.contractIds.map(id => (
                  <a key={id} href={`/contracts/${id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit', fontSize: 13 }}>
                    <IconContracts size={14} color="var(--text-muted)" />
                    <span style={{ fontFamily: 'monospace', flex: 1 }}>{id}</span>
                    <IconArrow size={12} color="var(--text-muted)" />
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {modal.open && <CustomerModal customer={modal.customer} onSave={cu => { handleSave(cu); setDetail(cu); }} onClose={() => setModal({ open: false, customer: null })} />}
    </AppLayout>
  );

  return (
    <AppLayout title="顧客管理">
      {saved && <div className="alert alert-success" style={{ marginBottom: 16 }}><IconCheck size={14} /> {saved}</div>}

      {/* 統計 */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">総顧客数</div><div className="stat-value">{customers.length}</div><div className="stat-sub">登録済み</div></div>
        <div className="stat-card"><div className="stat-label">取引中</div><div className="stat-value" style={{ color: 'var(--green)' }}>{customers.filter(c => c.status === 'active').length}</div><div className="stat-sub">アクティブ</div></div>
        <div className="stat-card"><div className="stat-label">見込み客</div><div className="stat-value" style={{ color: 'var(--gold)' }}>{customers.filter(c => c.status === 'prospect').length}</div><div className="stat-sub">フォロー中</div></div>
        <div className="stat-card"><div className="stat-label">契約実績</div><div className="stat-value">{customers.filter(c => c.contractIds.length > 0).length}</div><div className="stat-sub">件</div></div>
      </div>

      {/* フィルター・検索 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}><IconSearch size={14} /></span>
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="氏名・メール・電話で検索…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 110 }} value={typeF} onChange={e => setTypeF(e.target.value as typeof typeF)}>
          <option value="all">全種別</option>
          {Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 110 }} value={statusF} onChange={e => setStatusF(e.target.value as typeof statusF)}>
          <option value="all">全ステータス</option>
          {Object.entries(CUSTOMER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setModal({ open: true, customer: null })}>
          <IconPlus size={14} /> 顧客登録
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{filtered.length}件表示中（全{customers.length}件）</div>

      {/* カードグリッド */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {filtered.map(cu => (
          <div key={cu.id} className="card" style={{ cursor: 'pointer' }}
            onClick={() => setDetail(cu)}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-hover)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: typeColor[cu.type] ?? 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                  {cu.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{cu.name}</div>
                  {cu.nameKana && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{cu.nameKana}</div>}
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    <span className={`status-badge ${statusColor[cu.status]}`} style={{ fontSize: 10 }}>{CUSTOMER_STATUS_LABELS[cu.status]}</span>
                    <span className="status-badge" style={{ background: 'var(--earth-pale)', color: 'var(--navy)', fontSize: 10 }}>{CUSTOMER_TYPE_LABELS[cu.type]}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cu.email}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{cu.phone}</div>
              {(cu.tags ?? []).length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                  {cu.tags!.slice(0, 3).map(tag => (
                    <span key={tag} style={{ background: 'var(--earth-pale)', border: '1px solid var(--border)', borderRadius: 20, padding: '1px 8px', fontSize: 10 }}>{tag}</span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11 }}>
                <span style={{ color: 'var(--text-muted)' }}>担当: {cu.assignedAgent || '未割当'}</span>
                <span style={{ color: 'var(--text-muted)' }}>契約 {cu.contractIds.length}件</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <IconUser size={32} /><br />顧客が見つかりません
          </div>
        )}
      </div>

      {modal.open && <CustomerModal customer={modal.customer} onSave={handleSave} onClose={() => setModal({ open: false, customer: null })} />}
    </AppLayout>
  );
}
