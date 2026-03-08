'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { IconCheck, IconSettings, IconUser, IconSign, IconAlert, IconLock, IconContracts } from '@/components/Icons';
import { getSettings, saveSettings, type AppSettings } from '@/lib/store';

export default function SettingsPage() {
  const [tab, setTab]     = useState<'company'|'agent'|'sign'|'notify'>('company');
  const [form, setForm]   = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setForm(getSettings()); }, []);

  const up = (patch: Partial<AppSettings>) => {
    setForm(p => p ? { ...p, ...patch } : p);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    saveSettings(form);                // ① localStorage に即保存
    try {                              // ② Supabase が使えれば同期
      await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } catch { /* offline OK */ }
    setSaving(false); setSaved(true); setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!form) return <AppLayout title="設定"><div style={{textAlign:'center',padding:60,color:'var(--text-muted)'}}>読み込み中…</div></AppLayout>;

  const tabs = [
    { key: 'company', label: '会社情報' },
    { key: 'agent',   label: '宅建士設定' },
    { key: 'sign',    label: '電子署名設定' },
    { key: 'notify',  label: '通知設定' },
  ];

  return (
    <AppLayout title="設定">
      <div className="tabs">
        {tabs.map(t => (
          <div key={t.key} className={`tab ${tab===t.key?'active':''}`} onClick={() => setTab(t.key as typeof tab)}>
            {t.label}
            {dirty && <span style={{width:5,height:5,borderRadius:'50%',background:'var(--gold)',display:'inline-block',marginLeft:4}}/>}
          </div>
        ))}
      </div>

      {saved && <div className="alert alert-success" style={{marginBottom:16}}><IconCheck size={14}/> 設定を保存しました（このブラウザに記憶されます）</div>}

      {/* ── 会社情報 ── */}
      {tab==='company' && (
        <div className="card">
          <div className="card-header"><div className="card-title"><IconSettings size={14}/> 会社基本情報</div></div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group"><label className="form-label">会社名<span className="required">*</span></label>
                <input className="form-input" value={form.companyName} onChange={e=>up({companyName:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">宅建業免許番号<span className="required">*</span></label>
                <input className="form-input" value={form.licenseNo} onChange={e=>up({licenseNo:e.target.value})} placeholder="東京都知事（3）第○○○○○号"/></div>
              <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">所在地</label>
                <input className="form-input" value={form.companyAddress} onChange={e=>up({companyAddress:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">電話番号</label>
                <input className="form-input" value={form.companyPhone} onChange={e=>up({companyPhone:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">メールアドレス</label>
                <input className="form-input" type="email" value={form.companyEmail} onChange={e=>up({companyEmail:e.target.value})}/></div>
            </div>
          </div>
        </div>
      )}

      {/* ── 宅建士設定 ── */}
      {tab==='agent' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><IconUser size={14}/> 宅建士デフォルト設定</div>
            <div className="alert alert-warn" style={{margin:0,padding:'5px 10px',fontSize:11}}>
              <IconAlert size={11}/> 契約書作成時の初期値として使用されます
            </div>
          </div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group"><label className="form-label">宅建士 氏名<span className="required">*</span></label>
                <input className="form-input" value={form.agentName} onChange={e=>up({agentName:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">宅建士 免許番号<span className="required">*</span></label>
                <input className="form-input" value={form.agentLicense} onChange={e=>up({agentLicense:e.target.value})} placeholder="東京都知事（3）第123456号"/></div>
            </div>
            <div className="alert alert-info" style={{marginTop:8}}>
              <IconSign size={13}/>
              <span style={{fontSize:12}}>宅建業法35条・37条書面には宅建士の電子署名・記名が必須です。</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 電子署名設定 ── */}
      {tab==='sign' && (
        <div className="card">
          <div className="card-header"><div className="card-title"><IconSign size={14}/> 電子署名・セキュリティ設定</div></div>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{marginBottom:16}}>
              <div className="form-group"><label className="form-label">デフォルト署名タイプ</label>
                <select className="form-select" value={form.signatureType} onChange={e=>up({signatureType:e.target.value})}>
                  <option value="witness">立会人型（メール認証）</option>
                  <option value="party">当事者型（電子証明書）</option>
                </select></div>
              <div className="form-group"><label className="form-label">署名依頼の有効期限</label>
                <select className="form-select" value={form.signatureExpiry} onChange={e=>up({signatureExpiry:e.target.value})}>
                  <option value="7">7日間</option><option value="14">14日間</option><option value="30">30日間</option>
                </select></div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                {key:'timestampEnabled',label:'タイムスタンプを自動付与',desc:'署名完了時にRFC3161準拠のタイムスタンプを自動付与します（推奨）',icon:<IconLock size={14}/>},
                {key:'mfaRequired',label:'多要素認証（MFA）を必須にする',desc:'全ユーザーのログイン時にSMSまたは認証アプリによる2段階認証を強制します',icon:<IconLock size={14}/>},
              ].map(item=>(
                <label key={item.key} style={{display:'flex',alignItems:'flex-start',gap:12,padding:14,background:'var(--earth-pale)',borderRadius:'var(--radius)',cursor:'pointer',border:'1px solid var(--border)'}}>
                  <input type="checkbox" checked={form[item.key as keyof AppSettings] as boolean}
                    onChange={e=>up({[item.key]:e.target.checked})} style={{marginTop:2,flexShrink:0}}/>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:6,fontWeight:700,fontSize:13,marginBottom:3}}>{item.icon}{item.label}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)'}}>{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 通知設定 ── */}
      {tab==='notify' && (
        <div className="card">
          <div className="card-header"><div className="card-title"><IconContracts size={14}/> 通知設定</div></div>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <div className="form-group"><label className="form-label">送信元メールアドレス</label>
                <input className="form-input" type="email" value={form.emailFrom} onChange={e=>up({emailFrom:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">リマインドメール送信タイミング</label>
                <select className="form-select" value={form.reminderDays} onChange={e=>up({reminderDays:e.target.value})}>
                  <option value="1">1日前</option><option value="3">3日前</option><option value="7">7日前</option>
                </select></div>
            </div>
            <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:10}}>
              {[
                {key:'notifyOnSend',label:'署名依頼送信時にメール通知'},
                {key:'notifyOnSigned',label:'署名完了時に双方にメール通知'},
                {key:'notifyOnExpiry',label:'有効期限切れ前にリマインドメール送信'},
                {key:'notifyOnComplete',label:'契約締結完了時にPDF自動送付'},
              ].map(item=>(
                <label key={item.key} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer'}}>
                  <input type="checkbox" checked={form[item.key as keyof AppSettings] as boolean}
                    onChange={e=>up({[item.key]:e.target.checked})}/>
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{marginTop:20,display:'flex',justifyContent:'flex-end',gap:8,alignItems:'center'}}>
        {dirty && <span style={{fontSize:11,color:'var(--gold)'}}>● 未保存の変更があります</span>}
        <button className="btn btn-outline" onClick={()=>{setForm(getSettings());setDirty(false);}} disabled={!dirty}>キャンセル</button>
        <button className="btn btn-gold btn-lg" onClick={handleSave} disabled={saving||!dirty}>
          {saving?'保存中…':<><IconCheck size={15}/> 設定を保存</>}
        </button>
      </div>
    </AppLayout>
  );
}
