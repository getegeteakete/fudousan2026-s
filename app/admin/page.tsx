'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_CUSTOMERS } from '@/lib/data';
import { IconSettings, IconUser, IconCheck, IconAlert, IconDatabase, IconKey, IconLock, IconPlus, IconClose, IconSearch } from '@/components/Icons';
import { getSettings, saveSettings, getLocalContracts, getLocalProperties, getLocalCustomers, type AppSettings } from '@/lib/store';

type UserRole = 'admin' | 'agent' | 'viewer';
interface AppUser {
  id: string; name: string; email: string; role: UserRole;
  active: boolean; lastLogin?: string; licenseNo?: string;
}

const ROLE_LABELS: Record<UserRole, string> = { admin: '管理者', agent: '担当者（宅建士）', viewer: '閲覧者' };
const ROLE_COLOR: Record<UserRole, string> = { admin: 'status-expired', agent: 'status-completed', viewer: 'status-pending' };

export default function AdminPage() {
  const [tab, setTab] = useState<'tokens' | 'users' | 'system' | 'budget'>('tokens');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState('');
  const [budget, setBudget] = useState('50');
  const [healthData, setHealthData] = useState<Record<string, { ok: boolean; detail: string }> | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [userModal, setUserModal] = useState<{ open: boolean; user: AppUser | null }>({ open: false, user: null });
  const [userForm, setUserForm] = useState<AppUser>({ id: '', name: '', email: '', role: 'agent', active: true });
  const [userSearch, setUserSearch] = useState('');
  const [userFormError, setUserFormError] = useState('');

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    setBudget(s.monthlyBudgetUsd ?? '50');
    fetch('/api/health').then(r => r.json()).then(d => setHealthData(d.checks)).catch(() => { });
    // ローカルユーザーリスト（設定から生成）
    setUsers([
      { id: 'u001', name: s.agentName || '山田 一郎', email: s.companyEmail || 'info@propsign.co.jp', role: 'admin', active: true, lastLogin: new Date().toISOString(), licenseNo: s.agentLicense },
      { id: 'u002', name: '中村 宅建士', email: 'nakamura@propsign.co.jp', role: 'agent', active: true, lastLogin: new Date(Date.now() - 86400000).toISOString(), licenseNo: '東京都知事（4）第789012号' },
      { id: 'u003', name: '松本 宅建士', email: 'matsumoto@propsign.co.jp', role: 'agent', active: true, lastLogin: new Date(Date.now() - 172800000).toISOString() },
      { id: 'u004', name: '事務スタッフ', email: 'staff@propsign.co.jp', role: 'viewer', active: false },
    ]);
  }, []);

  const handleSaveBudget = () => {
    if (!settings) return;
    const updated = { ...settings, monthlyBudgetUsd: budget };
    saveSettings(updated); setSettings(updated);
    setSaved('予算を保存しました'); setTimeout(() => setSaved(''), 3000);
  };

  const openUserModal = (user: AppUser | null) => {
    setUserForm(user ?? { id: `u-${Date.now()}`, name: '', email: '', role: 'agent', active: true });
    setUserModal({ open: true, user });
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.email) { setUserFormError('氏名とメールを入力してください'); return; }
    setUserFormError('');
    if (userModal.user) {
      setUsers(users.map(u => u.id === userForm.id ? userForm : u));
    } else {
      setUsers([...users, userForm]);
    }
    setUserModal({ open: false, user: null });
    setSaved('ユーザーを保存しました'); setTimeout(() => setSaved(''), 3000);
  };

  const handleToggleActive = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  const stats = {
    contracts: getLocalContracts().length,
    properties: getLocalProperties().length,
    customers: getLocalCustomers().length + SAMPLE_CUSTOMERS.length,
  };

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  if (!settings) return <AppLayout title="管理者パネル"><div style={{ textAlign: 'center', padding: 60 }}>読み込み中…</div></AppLayout>;

  return (
    <AppLayout title="管理者パネル">
      {saved && <div className="alert alert-success" style={{ marginBottom: 16 }}><IconCheck size={14} /> {saved}</div>}

      <div className="tabs" style={{ flexWrap: 'wrap' }}>
        {[{ key: 'tokens', label: 'AIトークン管理' }, { key: 'users', label: 'ユーザー管理' }, { key: 'system', label: 'システム状態' }, { key: 'budget', label: '予算設定' }].map(t => (
          <div key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as typeof tab)}>{t.label}</div>
        ))}
      </div>

      {/* ── AIトークン管理 ── */}
      {tab === 'tokens' && (
        <div>
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            {[
              { label: '月次予算上限', value: `$${budget}`, sub: `≈ ¥${Math.round(parseFloat(budget) * 150).toLocaleString()}` },
              { label: 'API呼び出し', value: '—', sub: 'Supabase接続後' },
              { label: '総トークン', value: '—', sub: 'input + output' },
              { label: '推定コスト', value: '—', sub: '今月分' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: 20 }}>{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title"><IconKey size={14} /> API接続診断</div></div>
            <div className="card-body">
              {healthData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(healthData).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: v.ok ? 'rgba(45,106,79,0.05)' : 'rgba(155,35,53,0.05)', borderRadius: 'var(--radius)', border: `1px solid ${v.ok ? 'rgba(45,106,79,0.2)' : 'rgba(155,35,53,0.2)'}` }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: v.ok ? 'var(--green)' : 'var(--red)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{v.ok ? '✓' : '✗'}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-sub)', width: 140, flexShrink: 0 }}>{k}</span>
                      <span style={{ fontSize: 12, color: v.ok ? 'var(--green)' : 'var(--red)' }}>{v.detail}</span>
                    </div>
                  ))}
                </div>
              ) : <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>診断中…</div>}
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => fetch('/api/health').then(r => r.json()).then(d => setHealthData(d.checks))}>↻ 再診断</button>
                <a href="/api/health" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">JSON確認 ↗</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ユーザー管理 ── */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 160 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}><IconSearch size={14} /></span>
              <input className="form-input" style={{ paddingLeft: 32 }} placeholder="氏名・メールで検索…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => openUserModal(null)}>
              <IconPlus size={14} /> ユーザー追加
            </button>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="card-title"><IconUser size={14} /> ユーザー一覧 ({filteredUsers.length}名)</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>氏名</th><th>メール</th><th>権限</th><th>宅建士番号</th><th>最終ログイン</th><th>状態</th><th></th></tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</td>
                      <td><span className={`status-badge ${ROLE_COLOR[u.role]}`}>{ROLE_LABELS[u.role]}</span></td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.licenseNo || '—'}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('ja-JP') : '未ログイン'}</td>
                      <td>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
                          <input type="checkbox" checked={u.active} onChange={() => handleToggleActive(u.id)} />
                          {u.active ? '有効' : '無効'}
                        </label>
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => openUserModal(u)}>編集</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-body" style={{ paddingTop: 12 }}>
              <div className="alert alert-info">
                <IconDatabase size={13} />
                <span style={{ fontSize: 12 }}>Supabase接続後は、Authentication → Users でリアルタイムにユーザーを管理できます。</span>
              </div>
            </div>
          </div>
          {/* 権限説明 */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><div className="card-title"><IconLock size={14} /> 権限レベル説明</div></div>
            <div className="card-body">
              {[
                { role: '管理者', color: 'status-expired', desc: '全機能アクセス可能。ユーザー管理・システム設定・全契約書の閲覧・編集・削除ができます。' },
                { role: '担当者（宅建士）', color: 'status-completed', desc: '自分が担当する契約書の作成・編集・署名が可能。物件登録・顧客管理も利用できます。' },
                { role: '閲覧者', color: 'status-pending', desc: '契約書・物件・顧客の閲覧のみ。編集・作成・削除はできません。' },
              ].map(r => (
                <div key={r.role} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className={`status-badge ${r.color}`} style={{ flexShrink: 0 }}>{r.role}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.6 }}>{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── システム状態 ── */}
      {tab === 'system' && (
        <div>
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            {[
              { label: '登録契約書', value: `${stats.contracts}件`, sub: 'ローカル保存' },
              { label: '登録物件', value: `${stats.properties}件`, sub: 'ローカル保存' },
              { label: '登録顧客', value: `${stats.customers}名`, sub: '総計' },
              { label: 'バージョン', value: 'v1.0.0', sub: 'PropSign' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: 18 }}>{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title"><IconLock size={14} /> セキュリティ設定状態</div></div>
            <div className="card-body">
              {[
                { label: 'タイムスタンプ自動付与（RFC3161）', ok: settings.timestampEnabled },
                { label: '多要素認証（MFA）必須', ok: settings.mfaRequired },
                { label: 'TLS 1.3 暗号化通信', ok: true },
                { label: '電子帳簿保存法準拠モード', ok: true },
                { label: '宅建業法35条・37条電子交付対応', ok: true },
                { label: '監査ログ自動記録', ok: true },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: item.ok ? 'var(--green)' : 'var(--red)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>{item.ok ? '✓' : '✗'}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: 11, color: item.ok ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{item.ok ? '有効' : '無効'}</span>
                  {!item.ok && <a href="/settings" className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>設定</a>}
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title"><IconDatabase size={14} /> データ管理</div></div>
            <div className="card-body">
              <div className="alert alert-warn" style={{ marginBottom: 12 }}>
                <IconAlert size={13} /> ローカルストレージのデータはブラウザをリセットすると削除されます。Supabaseと連携することで永続化できます。
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => {
                  const data = { contracts: localStorage.getItem('propsign_contracts'), properties: localStorage.getItem('propsign_properties'), customers: localStorage.getItem('propsign_customers'), settings: localStorage.getItem('propsign_settings') };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `propsign-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
                }}>📥 データをエクスポート</button>
                <a href="https://app.supabase.com" target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Supabaseで永続化 ↗</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 予算設定 ── */}
      {tab === 'budget' && (
        <div className="card">
          <div className="card-header"><div className="card-title"><IconSettings size={14} /> AI月次予算設定</div></div>
          <div className="card-body">
            <div className="alert alert-warn" style={{ marginBottom: 16 }}>
              <IconAlert size={13} />
              <span style={{ fontSize: 12 }}>使用量が80%を超えると警告が表示されます。100%超過時はAI機能が一時停止されます。</span>
            </div>
            <div className="form-group" style={{ maxWidth: 320 }}>
              <label className="form-label">月次AI予算上限（USD）</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-muted)' }}>$</span>
                <input className="form-input" type="number" min="1" max="1000" value={budget}
                  onChange={e => setBudget(e.target.value)} style={{ maxWidth: 120 }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>≈ ¥{Math.round(parseFloat(budget || '0') * 150).toLocaleString()}</span>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['10', '30', '50', '100', '200'].map(v => (
                <button key={v} className={`btn btn-sm ${budget === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBudget(v)}>${v}</button>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-gold btn-lg" onClick={handleSaveBudget}><IconCheck size={15} /> 予算を保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ユーザー編集モーダル */}
      {userModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,22,38,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--navy-deep)', borderRadius: '12px 12px 0 0' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'white', fontFamily: 'Shippori Mincho, serif' }}>{userModal.user ? 'ユーザー編集' : 'ユーザー追加'}</div>
              <button onClick={() => setUserModal({ open: false, user: null })} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}><IconClose size={20} /></button>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <div className="form-grid form-grid-2" style={{ gap: 12 }}>
                <div className="form-group"><label className="form-label">氏名<span className="required">*</span></label>
                  <input className="form-input" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">メールアドレス<span className="required">*</span></label>
                  <input className="form-input" type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">権限</label>
                  <select className="form-select" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value as UserRole }))}>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">宅建士番号</label>
                  <input className="form-input" value={userForm.licenseNo ?? ''} onChange={e => setUserForm(f => ({ ...f, licenseNo: e.target.value }))} placeholder="東京都知事（3）第123456号" /></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={userForm.active} onChange={e => setUserForm(f => ({ ...f, active: e.target.checked }))} />
                    アカウントを有効にする
                  </label>
                </div>
              </div>
              {userFormError && <div className="alert alert-danger" style={{ marginBottom: 10 }}>{userFormError}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
                <button className="btn btn-outline" onClick={() => setUserModal({ open: false, user: null })}>キャンセル</button>
                <button className="btn btn-gold btn-lg" onClick={handleSaveUser}><IconCheck size={14} /> {userModal.user ? '更新' : '追加'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
