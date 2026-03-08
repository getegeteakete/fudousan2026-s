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

// ──────────────────────────────────────────────────────────
// 外部連携テストパネル（settings タブ用）
// ──────────────────────────────────────────────────────────
function IntegrationTestPanel() {
  const [emailTo, setEmailTo]     = useState('');
  const [emailResult, setEmailResult] = useState<{success?:boolean;mode?:string;message?:string;id?:string;fallback?:boolean} | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{status?:string;mode?:string;from?:string;message?:string} | null>(null);
  const [aiResult, setAiResult]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [signResult, setSignResult] = useState<{success?:boolean;signUrl?:string;email?:{sent:boolean;fallback?:boolean}} | null>(null);
  const [signLoading, setSignLoading] = useState(false);

  // メール設定確認
  useEffect(() => {
    fetch('/api/email/test')
      .then(r => r.json())
      .then(d => setEmailStatus(d))
      .catch(() => setEmailStatus({ status: 'error', message: '接続エラー' }));
  }, []);

  const sendTestEmail = async () => {
    if (!emailTo.includes('@')) { alert('メールアドレスを入力してください'); return; }
    setEmailLoading(true); setEmailResult(null);
    const r = await fetch('/api/email/test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: emailTo }),
    });
    setEmailResult(await r.json());
    setEmailLoading(false);
  };

  const testAI = async () => {
    setAiLoading(true); setAiResult('');
    const r = await fetch('/api/ai/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: '「こんにちは」と日本語で返答してください' }] }),
    });
    const d = await r.json();
    setAiResult(d.content ?? d.error ?? '応答なし');
    setAiLoading(false);
  };

  const testSignFlow = async () => {
    setSignLoading(true); setSignResult(null);
    const r = await fetch('/api/sign/request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractId: 'test-' + Date.now(),
        expiryDays: 1,
        localContract: {
          tenantEmail: emailTo || 'test@example.com',
          tenantName: 'テスト 太郎', propertyName: 'テスト物件',
          contractNo: 'PS-TEST-001', agentName: '山田 宅建士',
        },
      }),
    });
    setSignResult(await r.json());
    setSignLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* メール送信テスト */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📧 メール送信（Resend）テスト</div>
          {emailStatus && (
            <span className={`status-badge ${emailStatus.status === 'configured' ? 'status-completed' : 'status-pending'}`}>
              {emailStatus.status === 'configured' ? '✓ API接続済み' : '⚠ フォールバックモード'}
            </span>
          )}
        </div>
        <div className="card-body">
          {emailStatus && (
            <div className={`alert ${emailStatus.status === 'configured' ? 'alert-success' : 'alert-warn'}`} style={{ marginBottom: 14 }}>
              {emailStatus.message}<br />
              {emailStatus.status !== 'configured' && (
                <span style={{ fontSize: 11 }}>
                  Vercel環境変数に <code>RESEND_API_KEY</code> を設定してください。
                  <a href="https://resend.com" target="_blank" rel="noreferrer" style={{ marginLeft: 6, textDecoration: 'underline' }}>Resend無料登録 →</a>
                </span>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <input className="form-input" style={{ flex: '1 1 200px' }}
              placeholder="送信先メールアドレス" type="email"
              value={emailTo} onChange={e => setEmailTo(e.target.value)} />
            <button className="btn btn-primary" disabled={emailLoading} onClick={sendTestEmail}>
              {emailLoading ? <><span className="spinner" /> 送信中…</> : '📤 テスト送信'}
            </button>
          </div>
          {emailResult && (
            <div className={`alert ${emailResult.success ? 'alert-success' : 'alert-danger'}`}>
              {emailResult.success ? '✓ ' : '✗ '}{emailResult.message}
              {emailResult.fallback && <span style={{ display: 'block', fontSize: 11, marginTop: 4 }}>フォールバックモード: サーバーログを確認してください（Vercel → Functions → Logs）</span>}
              {emailResult.id && !emailResult.fallback && <span style={{ display: 'block', fontSize: 11, fontFamily: 'monospace', marginTop: 4 }}>ID: {emailResult.id}</span>}
            </div>
          )}
        </div>
      </div>

      {/* AI API テスト */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🤖 Anthropic AI（Claude）テスト</div>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            Claudeに「こんにちは」と送信してAPI接続を確認します
          </p>
          <button className="btn btn-primary" disabled={aiLoading} onClick={testAI}>
            {aiLoading ? <><span className="spinner" /> 通信中…</> : '💬 AI接続テスト'}
          </button>
          {aiResult && (
            <div className={`alert ${aiResult.includes('error') || aiResult.includes('エラー') ? 'alert-danger' : 'alert-success'}`} style={{ marginTop: 12 }}>
              {aiResult.includes('error') || aiResult.includes('エラー') ? '✗ ' : '✓ AI応答: '}{aiResult}
            </div>
          )}
        </div>
      </div>

      {/* 電子署名フローテスト */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">✍️ 電子署名フローテスト</div>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            署名URLの発行・メール送信の完全フローをテストします
          </p>
          <button className="btn btn-gold" disabled={signLoading} onClick={testSignFlow}>
            {signLoading ? <><span className="spinner" /> 処理中…</> : '🔗 署名URLを発行'}
          </button>
          {signResult && (
            <div style={{ marginTop: 12 }}>
              {signResult.success ? (
                <>
                  <div className="alert alert-success" style={{ marginBottom: 8 }}>
                    ✓ 署名URL発行成功
                    {signResult.email?.fallback && ' （メール: フォールバックモード）'}
                    {signResult.email?.sent && !signResult.email?.fallback && ' ＋ メール送信済み'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input readOnly className="form-input" style={{ flex: '1 1 200px', fontSize: 11, fontFamily: 'monospace' }} value={signResult.signUrl ?? ''} onFocus={e => e.target.select()} />
                    <a href={signResult.signUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">署名ページを開く ↗</a>
                  </div>
                </>
              ) : (
                <div className="alert alert-danger">✗ エラー: {JSON.stringify(signResult)}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 設定ガイド */}
      <div className="card">
        <div className="card-header"><div className="card-title">⚙️ 本番化チェックリスト</div></div>
        <div className="card-body">
          {[
            { env: 'RESEND_API_KEY', label: 'Resend APIキー（メール送信）', url: 'https://resend.com', hint: '無料: 月3,000通' },
            { env: 'ANTHROPIC_API_KEY', label: 'Anthropic APIキー（AI生成）', url: 'https://console.anthropic.com', hint: 'Claude Sonnet 4使用' },
            { env: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL（DB保存）', url: 'https://app.supabase.com', hint: '無料枠500MB' },
            { env: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Key', url: 'https://app.supabase.com', hint: 'Settings → API' },
          ].map(item => (
            <div key={item.env} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13, flexWrap: 'wrap' }}>
              <code style={{ fontSize: 11, background: 'var(--earth-pale)', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', flexShrink: 0 }}>{item.env}</code>
              <span style={{ flex: 1, minWidth: 120 }}>{item.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{item.hint}</span>
              <a href={item.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>取得 ↗</a>
            </div>
          ))}
          <div className="alert alert-info" style={{ marginTop: 14 }}>
            Vercel Dashboard → Settings → Environment Variables に上記を設定してください
          </div>
        </div>
      </div>

    </div>
  );
}
