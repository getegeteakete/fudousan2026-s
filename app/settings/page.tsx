'use client';
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { IconCheck, IconSettings, IconUser, IconSign, IconAlert, IconLock, IconContracts } from '@/components/Icons';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    companyName: '（株）プロップサイン不動産',
    companyAddress: '東京都渋谷区道玄坂1-1-1',
    companyPhone: '03-1234-5678',
    companyEmail: 'info@propsign.co.jp',
    licenseNo: '東京都知事（3）第○○○○○号',
    agentName: '山田 一郎',
    agentLicense: '東京都知事（3）第123456号',
    signatureExpiry: '7',
    signatureType: 'witness',
    timestampEnabled: true,
    mfaRequired: true,
    reminderDays: '3',
    emailFrom: 'contract@propsign.co.jp',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const [tab, setTab] = useState<'company' | 'agent' | 'sign' | 'notify'>('company');

  return (
    <AppLayout title="設定">
      <div className="tabs">
        {[
          { key: 'company', label: '会社情報', icon: <IconSettings size={13} /> },
          { key: 'agent', label: '宅建士設定', icon: <IconUser size={13} /> },
          { key: 'sign', label: '電子署名設定', icon: <IconSign size={13} /> },
          { key: 'notify', label: '通知設定', icon: <IconContracts size={13} /> },
        ].map(t => (
          <div key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key as typeof tab)}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {t.icon}{t.label}
          </div>
        ))}
      </div>

      {saved && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <IconCheck size={14} /> 設定を保存しました
        </div>
      )}

      {tab === 'company' && (
        <div className="card">
          <div className="card-header"><div className="card-title"><IconSettings size={14} /> 会社基本情報</div></div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group"><label className="form-label">会社名<span className="required">*</span></label>
                <input className="form-input" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">宅建業免許番号<span className="required">*</span></label>
                <input className="form-input" value={form.licenseNo} onChange={e => setForm(f => ({ ...f, licenseNo: e.target.value }))} /></div>
              <div className="form-group form-grid" style={{ gridColumn: '1 / -1' }}><label className="form-label">所在地</label>
                <input className="form-input" value={form.companyAddress} onChange={e => setForm(f => ({ ...f, companyAddress: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">電話番号</label>
                <input className="form-input" value={form.companyPhone} onChange={e => setForm(f => ({ ...f, companyPhone: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">メールアドレス</label>
                <input className="form-input" type="email" value={form.companyEmail} onChange={e => setForm(f => ({ ...f, companyEmail: e.target.value }))} /></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'agent' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><IconUser size={14} /> 宅建士デフォルト設定</div>
            <div className="alert alert-warn" style={{ margin: 0, padding: '5px 10px', fontSize: 11 }}>
              <IconAlert size={11} /> 契約書作成時の初期値として使用されます
            </div>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group"><label className="form-label">宅建士 氏名<span className="required">*</span></label>
                <input className="form-input" value={form.agentName} onChange={e => setForm(f => ({ ...f, agentName: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">宅建士 免許番号<span className="required">*</span></label>
                <input className="form-input" value={form.agentLicense} onChange={e => setForm(f => ({ ...f, agentLicense: e.target.value }))} /></div>
            </div>
            <div className="alert alert-info" style={{ marginTop: 8 }}>
              <IconSign size={13} />
              <span style={{ fontSize: 12 }}>宅建業法35条・37条書面には宅建士の電子署名・記名が必須です。複数の宅建士を登録する場合はユーザー管理から追加してください。</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'sign' && (
        <div className="card">
          <div className="card-header"><div className="card-title"><IconSign size={14} /> 電子署名・セキュリティ設定</div></div>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{ marginBottom: 16 }}>
              <div className="form-group"><label className="form-label">デフォルト署名タイプ</label>
                <select className="form-select" value={form.signatureType} onChange={e => setForm(f => ({ ...f, signatureType: e.target.value }))}>
                  <option value="witness">立会人型（メール認証）</option>
                  <option value="party">当事者型（電子証明書）</option>
                </select></div>
              <div className="form-group"><label className="form-label">署名依頼の有効期限（日）</label>
                <select className="form-select" value={form.signatureExpiry} onChange={e => setForm(f => ({ ...f, signatureExpiry: e.target.value }))}>
                  <option value="7">7日間</option><option value="14">14日間</option><option value="30">30日間</option>
                </select></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'timestampEnabled', label: 'タイムスタンプを自動付与', desc: '署名完了時にRFC3161準拠のタイムスタンプを自動付与します（推奨）', icon: <IconLock size={14} /> },
                { key: 'mfaRequired', label: '多要素認証（MFA）を必須にする', desc: '全ユーザーのログイン時にSMSまたは認証アプリによる2段階認証を強制します', icon: <IconSecurity size={14} /> },
              ].map((item) => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', background: 'var(--earth-pale)', borderRadius: 'var(--radius)', cursor: 'pointer', border: '1px solid var(--border)' }}>
                  <input type="checkbox" checked={form[item.key as keyof typeof form] as boolean}
                    onChange={e => setForm(f => ({ ...f, [item.key]: e.target.checked }))}
                    style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{item.icon}{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'notify' && (
        <div className="card">
          <div className="card-header"><div className="card-title"><IconContracts size={14} /> 通知設定</div></div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group"><label className="form-label">送信元メールアドレス</label>
                <input className="form-input" type="email" value={form.emailFrom} onChange={e => setForm(f => ({ ...f, emailFrom: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">リマインドメール送信タイミング（日前）</label>
                <select className="form-select" value={form.reminderDays} onChange={e => setForm(f => ({ ...f, reminderDays: e.target.value }))}>
                  <option value="1">1日前</option><option value="3">3日前</option><option value="7">7日前</option>
                </select></div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                '署名依頼送信時にメール通知',
                '署名完了時に双方にメール通知',
                '有効期限切れ前にリマインドメール送信',
                '契約締結完了時にPDF自動送付',
              ].map((item) => (
                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-outline">キャンセル</button>
        <button className="btn btn-gold btn-lg" onClick={handleSave}>
          <IconCheck size={15} /> 設定を保存
        </button>
      </div>
    </AppLayout>
  );
}

function IconSecurity({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L4 6L4 13C4 17.4 7.4 21.5 12 22C16.6 21.5 20 17.4 20 13L20 6Z" />
      <path d="M9 12L11 14L15 10" />
    </svg>
  );
}
