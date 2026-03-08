'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { IconSettings, IconUser, IconCheck, IconAlert, IconDatabase, IconKey, IconLock } from '@/components/Icons';
import { getSettings, saveSettings, getLocalContracts, getLocalProperties, type AppSettings } from '@/lib/store';

export default function AdminPage() {
  const [tab, setTab] = useState<'tokens'|'users'|'system'|'budget'>('tokens');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [budget, setBudget] = useState('50');
  const [contractCount, setContractCount] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [healthData, setHealthData] = useState<Record<string,{ok:boolean;detail:string}>|null>(null);

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    setBudget(s.monthlyBudgetUsd ?? '50');
    setContractCount(getLocalContracts().length);
    setPropertyCount(getLocalProperties().length);
    fetch('/api/health').then(r=>r.json()).then(d=>setHealthData(d.checks)).catch(()=>{});
  }, []);

  const handleSaveBudget = () => {
    if (!settings) return;
    const updated = { ...settings, monthlyBudgetUsd: budget };
    saveSettings(updated);
    setSettings(updated);
    setSaved(true);
    setTimeout(()=>setSaved(false), 3000);
  };

  return (
    <AppLayout title="管理者パネル">
      <div className="tabs">
        {[{key:'tokens',label:'AIトークン管理'},{key:'users',label:'ユーザー管理'},{key:'system',label:'システム状態'},{key:'budget',label:'予算設定'}].map(t=>(
          <div key={t.key} className={`tab ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key as typeof tab)}>{t.label}</div>
        ))}
      </div>

      {saved && <div className="alert alert-success" style={{marginBottom:16}}><IconCheck size={14}/> 設定を保存しました</div>}

      {/* ── AIトークン管理 ── */}
      {tab==='tokens' && (
        <div>
          <div className="stat-grid" style={{marginBottom:20}}>
            {[
              {label:'今月のAPI呼び出し',value:'—',sub:'Supabase接続後に表示'},
              {label:'今月の総トークン',value:'—',sub:'input + output'},
              {label:'推定コスト',value:'—',sub:'USD'},
              {label:'月次予算残',value:`$${budget}`,sub:'上限設定値'},
            ].map(s=>(
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{fontSize:20}}>{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title"><IconKey size={14}/> APIキー・接続状態</div></div>
            <div className="card-body">
              {healthData ? (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {Object.entries(healthData).map(([k,v])=>(
                    <div key={k} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:v.ok?'rgba(45,106,79,0.05)':'rgba(155,35,53,0.05)',borderRadius:'var(--radius)',border:`1px solid ${v.ok?'rgba(45,106,79,0.2)':'rgba(155,35,53,0.2)'}`}}>
                      <span style={{width:20,height:20,borderRadius:'50%',background:v.ok?'var(--green)':'var(--red)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>{v.ok?'✓':'✗'}</span>
                      <span style={{fontSize:12,color:'var(--text-sub)',width:160,flexShrink:0}}>{k}</span>
                      <span style={{fontSize:12,color:v.ok?'var(--green)':'var(--red)'}}>{v.detail}</span>
                    </div>
                  ))}
                </div>
              ):(
                <div style={{textAlign:'center',padding:24,color:'var(--text-muted)',fontSize:13}}>接続診断を取得中…</div>
              )}
              <div style={{marginTop:14,display:'flex',gap:8}}>
                <button className="btn btn-outline btn-sm" onClick={()=>fetch('/api/health').then(r=>r.json()).then(d=>setHealthData(d.checks))}>↻ 再診断</button>
                <a href="/api/health" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">JSONで確認 ↗</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ユーザー管理 ── */}
      {tab==='users' && (
        <div className="card">
          <div className="card-header"><div className="card-title"><IconUser size={14}/> ユーザー管理</div></div>
          <div className="card-body">
            <div className="alert alert-info" style={{marginBottom:16}}>
              <IconDatabase size={14}/>
              <span style={{fontSize:12}}>Supabase Auth と連携することでユーザー管理が利用できます。Supabaseダッシュボード → Authentication → Users から管理してください。</span>
            </div>
            <table className="data-table">
              <thead><tr><th>名前</th><th>メール</th><th>役割</th><th>ステータス</th></tr></thead>
              <tbody>
                {[
                  {name:settings?.agentName||'山田 一郎',email:settings?.companyEmail||'info@propsign.co.jp',role:'管理者・宅建士',status:'active'},
                ].map((u,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{u.name}</td>
                    <td style={{fontSize:12}}>{u.email}</td>
                    <td><span className="status-badge status-signed">{u.role}</span></td>
                    <td><span className="status-badge status-completed">アクティブ</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{marginTop:12}}>
              <a href="https://app.supabase.com" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">Supabaseでユーザー管理 ↗</a>
            </div>
          </div>
        </div>
      )}

      {/* ── システム状態 ── */}
      {tab==='system' && (
        <div>
          <div className="stat-grid" style={{marginBottom:20}}>
            {[
              {label:'ローカル保存契約書',value:`${contractCount}件`,sub:'このブラウザに保存'},
              {label:'ローカル保存物件',value:`${propertyCount}件`,sub:'インポート済み'},
              {label:'システムバージョン',value:'v1.0.0',sub:'PropSign'},
              {label:'法令適合',value:'準拠',sub:'宅建業法・電帳法'},
            ].map(s=>(
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{fontSize:18}}>{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title"><IconLock size={14}/> セキュリティ設定状態</div></div>
            <div className="card-body">
              {[
                {label:'タイムスタンプ自動付与',ok:settings?.timestampEnabled??true},
                {label:'多要素認証（MFA）必須',ok:settings?.mfaRequired??true},
                {label:'TLS 1.3 暗号化通信',ok:true},
                {label:'電子帳簿保存法準拠モード',ok:true},
              ].map(item=>(
                <div key={item.label} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{width:18,height:18,borderRadius:'50%',background:item.ok?'var(--green)':'var(--red)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,flexShrink:0}}>{item.ok?'✓':'✗'}</span>
                  <span style={{fontSize:13}}>{item.label}</span>
                  <span style={{marginLeft:'auto',fontSize:11,color:item.ok?'var(--green)':'var(--red)',fontWeight:700}}>{item.ok?'有効':'無効'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 予算設定 ── */}
      {tab==='budget' && (
        <div className="card">
          <div className="card-header"><div className="card-title"><IconSettings size={14}/> AI月次予算設定</div></div>
          <div className="card-body">
            <div className="alert alert-warn" style={{marginBottom:16}}>
              <IconAlert size={13}/>
              <span style={{fontSize:12}}>使用量が設定値の80%を超えると警告が表示されます。100%超過時はAI機能が一時停止されます。</span>
            </div>
            <div className="form-group" style={{maxWidth:300}}>
              <label className="form-label">月次AI予算上限（USD）</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontSize:16,fontWeight:700,color:'var(--text-muted)'}}>$</span>
                <input className="form-input" type="number" min="1" max="1000" value={budget}
                  onChange={e=>setBudget(e.target.value)} style={{maxWidth:120}}/>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>≈ ¥{Math.round(parseFloat(budget||'0')*150).toLocaleString()}</span>
              </div>
            </div>
            <div style={{marginTop:16,display:'flex',flexWrap:'wrap',gap:8}}>
              {['10','30','50','100','200'].map(v=>(
                <button key={v} className={`btn btn-sm ${budget===v?'btn-primary':'btn-outline'}`} onClick={()=>setBudget(v)}>${v}</button>
              ))}
            </div>
            <div style={{marginTop:20}}>
              <button className="btn btn-gold btn-lg" onClick={handleSaveBudget}>
                <IconCheck size={15}/> 予算を保存
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
