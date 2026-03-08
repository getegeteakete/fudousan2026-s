'use client';
import { useState, useEffect, useCallback } from 'react';
import { IconSparkle, IconAlert, IconDatabase, IconKey } from './Icons';

interface TokenStats {
  totalTokens: number; totalCost: number; callCount: number;
  byOperation: Record<string, { tokens: number; cost: number; count: number }>;
  daily: Array<{ date: string; tokens: number; cost: number }>;
  recentCalls: Array<{
    id: string; operation: string; model: string;
    input_tokens: number; output_tokens: number;
    total_tokens?: number; cost_usd: number; response_ms?: number; created_at: string;
  }>;
}
interface Budget { used: number; budget: number; percentage: number; alert: boolean; }
type ConnStatus = 'loading' | 'ok' | 'schema_missing' | 'env_missing' | 'error';

const OP_LABELS: Record<string,string> = { chat:'AIチャット', generate:'契約書生成', legal_check:'リーガルチェック', special_terms:'特約生成', summary:'サマリ生成' };
const OP_COLORS: Record<string,string> = { chat:'#3b82f6', generate:'#1a2540', legal_check:'#b8944a', special_terms:'#2d6a4f', summary:'#7a7a7a' };
const fmt = (n:number) => n.toLocaleString();
const fmtUsd = (n:number) => `$${n.toFixed(4)}`;
const fmtJpy = (n:number) => `¥${Math.round(n*150).toLocaleString()}`;

export default function AITokenDashboard() {
  const [stats, setStats] = useState<TokenStats|null>(null);
  const [budget, setBudget] = useState<Budget|null>(null);
  const [period, setPeriod] = useState<'today'|'week'|'month'>('month');
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<ConnStatus>('loading');
  const [connDetail, setConnDetail] = useState('');
  const [tab, setTab] = useState<'summary'|'breakdown'|'log'>('summary');
  const [healthData, setHealthData] = useState<Record<string,{ok:boolean;detail:string}>|null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/token-stats?period=${period}`);
      const data = await res.json();
      if (!data.ok) {
        if (data.hint === 'SCHEMA_MISSING') { setConnStatus('schema_missing'); setConnDetail(data.error ?? ''); }
        else if (!data.error || data.error.includes('placeholder')) { setConnStatus('env_missing'); setConnDetail(''); }
        else { setConnStatus('error'); setConnDetail(data.error ?? ''); }
        setLoading(false); return;
      }
      setConnStatus('ok'); setConnDetail('');
      setStats(data.stats); setBudget(data.budget);
    } catch(e) { setConnStatus('error'); setConnDetail(String(e)); }
    finally { setLoading(false); }
  }, [period]);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthData(data.checks ?? null);
      if (data.ok) setConnStatus('ok');
      else if (data.checks?.db_tables?.ok === false && data.checks?.db_connect?.ok === true) setConnStatus('schema_missing');
      else if (!data.checks?.env_service?.ok) setConnStatus('env_missing');
    } catch {}
  }, []);

  useEffect(() => { fetchStats(); fetchHealth(); }, [fetchStats, fetchHealth]);

  const display = stats ?? DEMO_STATS;
  const maxDaily = Math.max(...display.daily.map(d=>d.tokens), 1);

  if (connStatus === 'schema_missing') return (
    <SchemaGuide healthData={healthData} onRetry={() => { fetchStats(); fetchHealth(); }} />
  );
  if (connStatus === 'env_missing') return (
    <EnvGuide onRetry={() => { fetchStats(); fetchHealth(); }} />
  );

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10}}>
        <h2 style={{fontFamily:'Shippori Mincho,serif',fontSize:16,fontWeight:700,display:'flex',alignItems:'center',gap:8,color:'var(--navy-deep)'}}>
          <IconSparkle size={16} color="var(--gold)" />
          AI トークン使用量管理
          {connStatus==='ok' && (
            <span style={{padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:700,background:'rgba(45,106,79,0.12)',color:'var(--green)',display:'flex',alignItems:'center',gap:4}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block',boxShadow:'0 0 5px var(--green)'}}/>
              Supabase 接続中
            </span>
          )}
          {connStatus==='loading' && (
            <span style={{padding:'2px 8px',borderRadius:99,fontSize:10,background:'var(--border)',color:'var(--text-muted)'}}>接続確認中…</span>
          )}
        </h2>
        <div style={{display:'flex',gap:6}}>
          {(['today','week','month'] as const).map(p=>(
            <button key={p} className={`btn btn-sm ${period===p?'btn-primary':'btn-outline'}`} onClick={()=>setPeriod(p)}>
              {{today:'今日',week:'7日間',month:'今月'}[p]}
            </button>
          ))}
          <button className="btn btn-outline btn-sm" onClick={()=>{fetchStats();fetchHealth();}}>↻</button>
        </div>
      </div>

      {budget && (
        <div style={{marginBottom:20,padding:'14px 18px',background:'var(--earth-pale)',borderRadius:'var(--radius-lg)',border:'1px solid var(--border)'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontSize:12,fontWeight:600,color:'var(--text-sub)'}}>月次AI予算使用状況</span>
            <span style={{fontSize:12,fontFamily:'monospace',color:budget.alert?'var(--red)':'var(--text-main)',fontWeight:700}}>
              {fmtUsd(budget.used)} / {fmtUsd(budget.budget)}（{fmtJpy(budget.used)}）
            </span>
          </div>
          <div style={{height:10,background:'var(--border)',borderRadius:99,overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:99,transition:'width 0.6s',width:`${Math.max(budget.percentage,budget.used>0?2:0)}%`,
              background:budget.percentage>=80?'linear-gradient(90deg,var(--red),#c0392b)':budget.percentage>=50?'linear-gradient(90deg,var(--gold),var(--gold-light))':'linear-gradient(90deg,var(--green),#27ae60)'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:10,color:'var(--text-muted)'}}>
            <span>0%</span><span>50%</span><span style={{color:'var(--gold)'}}>80% 警告</span><span>100%</span>
          </div>
        </div>
      )}

      <div className="stat-grid" style={{marginBottom:18}}>
        {[
          {label:'総トークン数',value:display?fmt(display.totalTokens):'---',sub:'input + output',color:'var(--navy)'},
          {label:'推定コスト',value:display?fmtJpy(display.totalCost):'---',sub:fmtUsd(display?.totalCost??0),color:'var(--gold)'},
          {label:'API呼び出し数',value:display?fmt(display.callCount):'---',sub:'件',color:'#3b82f6'},
          {label:'平均コスト/回',value:display&&display.callCount>0?fmtJpy(display.totalCost/display.callCount):'---',sub:'1回あたり',color:'var(--green)'},
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{fontSize:22,color:s.color}}>{loading?'…':s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {[{key:'summary',label:'日次推移'},{key:'breakdown',label:'操作別内訳'},{key:'log',label:'呼び出し履歴'}].map(t=>(
          <div key={t.key} className={`tab ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key as typeof tab)}>{t.label}</div>
        ))}
      </div>

      {tab==='summary' && (
        <div className="card">
          <div className="card-header"><div className="card-title">日次トークン使用推移（直近7日）</div></div>
          <div className="card-body">
            <div style={{display:'flex',alignItems:'flex-end',gap:8,height:140,paddingTop:20}}>
              {display.daily.map(d=>(
                <div key={d.date} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  {d.tokens>0&&<div style={{fontSize:9,color:'var(--text-muted)',fontFamily:'monospace'}}>{fmt(d.tokens)}</div>}
                  <div style={{width:'100%',minHeight:4,borderRadius:'4px 4px 0 0',
                    background:d.tokens>0?'linear-gradient(0deg,var(--navy),var(--navy-light))':'var(--border)',
                    height:`${maxDaily>0?Math.max((d.tokens/maxDaily)*110,d.tokens>0?8:2):2}px`,transition:'height 0.3s'}}/>
                  <div style={{fontSize:9,color:'var(--text-muted)',whiteSpace:'nowrap'}}>
                    {new Date(d.date).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})}
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
              {display.daily.map(d=>(
                <div key={d.date} style={{textAlign:'center',fontSize:9,color:'var(--text-muted)',fontFamily:'monospace'}}>
                  {d.cost>0?fmtUsd(d.cost):'—'}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==='breakdown' && (
        <div className="card">
          <div className="card-header"><div className="card-title">操作別トークン内訳</div></div>
          <div className="card-body">
            {Object.keys(display.byOperation).length>0?(
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {Object.entries(display.byOperation).sort((a,b)=>b[1].tokens-a[1].tokens).map(([op,v])=>{
                  const pct = display.totalTokens>0?(v.tokens/display.totalTokens)*100:0;
                  return (
                    <div key={op}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:13}}>
                        <span style={{display:'flex',alignItems:'center',gap:8,fontWeight:600}}>
                          <span style={{width:8,height:8,borderRadius:'50%',background:OP_COLORS[op]??'#888',display:'inline-block'}}/>
                          {OP_LABELS[op]??op}
                          <span style={{fontSize:11,color:'var(--text-muted)',fontWeight:400}}>{v.count}回</span>
                        </span>
                        <span style={{fontFamily:'monospace',fontSize:12}}>{fmt(v.tokens)} tok（{fmtUsd(v.cost)}）</span>
                      </div>
                      <div style={{height:8,background:'var(--border)',borderRadius:99,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:OP_COLORS[op]??'#888',borderRadius:99,transition:'width 0.5s'}}/>
                      </div>
                      <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{pct.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            ):(
              <div style={{textAlign:'center',color:'var(--text-muted)',padding:'32px 0',fontSize:13}}>この期間のデータはありません</div>
            )}
          </div>
        </div>
      )}

      {tab==='log' && (
        <div className="card">
          <div className="card-header"><div className="card-title">API呼び出し履歴（直近20件）</div></div>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr><th>日時</th><th>操作</th><th>モデル</th><th>入力</th><th>出力</th><th>合計</th><th>コスト</th><th>応答</th></tr></thead>
              <tbody>
                {display.recentCalls.map(c=>(
                  <tr key={c.id}>
                    <td style={{fontFamily:'monospace',fontSize:11}}>
                      {new Date(c.created_at).toLocaleDateString('ja-JP',{month:'2-digit',day:'2-digit'})}{' '}
                      {new Date(c.created_at).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}
                    </td>
                    <td><span style={{display:'flex',alignItems:'center',gap:5,fontSize:12,fontWeight:600}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:OP_COLORS[c.operation]??'#888',display:'inline-block'}}/>
                      {OP_LABELS[c.operation]??c.operation}
                    </span></td>
                    <td style={{fontSize:10,color:'var(--text-muted)'}}>Sonnet 4</td>
                    <td style={{fontFamily:'monospace',fontSize:12,textAlign:'right'}}>{fmt(c.input_tokens)}</td>
                    <td style={{fontFamily:'monospace',fontSize:12,textAlign:'right'}}>{fmt(c.output_tokens)}</td>
                    <td style={{fontFamily:'monospace',fontSize:12,textAlign:'right',fontWeight:700}}>{fmt(c.total_tokens??(c.input_tokens+c.output_tokens))}</td>
                    <td style={{fontFamily:'monospace',fontSize:11,color:'var(--text-sub)'}}>{fmtUsd(Number(c.cost_usd))}</td>
                    <td style={{fontFamily:'monospace',fontSize:11,color:'var(--text-muted)'}}>{c.response_ms?`${c.response_ms}ms`:'—'}</td>
                  </tr>
                ))}
                {display.recentCalls.length===0&&(
                  <tr><td colSpan={8} style={{textAlign:'center',padding:28,color:'var(--text-muted)'}}>AIチャットや契約書生成を実行するとここに記録されます</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(connStatus==='error'||connStatus==='loading') && connDetail && (
        <div className="alert alert-warn" style={{marginTop:12,fontSize:12}}>
          <IconAlert size={12}/><span>{connDetail}</span>
        </div>
      )}
    </div>
  );
}

// ── スキーマ未作成ガイド ─────────────────────────────────────
function SchemaGuide({healthData, onRetry}: {healthData:Record<string,{ok:boolean;detail:string}>|null; onRetry:()=>void}) {
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
        <IconSparkle size={16} color="var(--gold)"/>
        <h2 style={{fontFamily:'Shippori Mincho,serif',fontSize:16,fontWeight:700,color:'var(--navy-deep)'}}>AI トークン使用量管理</h2>
        <span style={{padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:700,background:'#fff3cd',color:'#856404'}}>初期設定が必要</span>
      </div>
      <div className="card" style={{border:'2px solid var(--gold)',background:'#fffdf5'}}>
        <div className="card-body">
          <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:20}}>
            <div style={{width:44,height:44,borderRadius:10,background:'rgba(184,148,74,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <IconDatabase size={20} color="var(--gold)"/>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Supabase DB接続済み・テーブルが未作成です</div>
              <div style={{fontSize:13,color:'var(--text-muted)'}}>環境変数は正しく設定されています。<strong>schema.sql</strong> を Supabase SQL Editor で実行してテーブルを作成してください。</div>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {n:'1',title:'Supabase SQL Editor を開く',desc:'https://app.supabase.com → プロジェクト → SQL Editor → New query',link:'https://app.supabase.com'},
              {n:'2',title:'schema.sql をコピーして貼り付ける',desc:'GitHubの supabase/schema.sql を全選択コピー → SQL Editorに貼り付け → ▶ Run ボタン',link:'https://github.com/getegeteakete/fudousan2026-s/blob/main/supabase/schema.sql'},
              {n:'3',title:'「再接続確認」ボタンを押す',desc:'テーブル作成後、下のボタンで接続を確認します',link:null},
            ].map(s=>(
              <div key={s.n} style={{display:'flex',gap:12,padding:'12px 14px',background:'white',borderRadius:'var(--radius)',border:'1px solid var(--border)'}}>
                <div style={{width:26,height:26,borderRadius:'50%',background:'var(--navy)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{s.n}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{s.title}</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{s.desc}</div>
                  {s.link&&<a href={s.link} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#3b82f6',marginTop:3,display:'inline-block'}}>{s.link} ↗</a>}
                </div>
              </div>
            ))}
          </div>
          {healthData&&(
            <div style={{marginTop:18,padding:'14px',background:'var(--navy-deep)',borderRadius:'var(--radius)'}}>
              <div style={{fontSize:12,fontWeight:700,color:'white',marginBottom:10}}>現在の接続診断</div>
              {Object.entries(healthData).map(([k,v])=>(
                <div key={k} style={{display:'flex',gap:8,alignItems:'center',fontSize:11,marginBottom:5}}>
                  <span style={{width:14,height:14,borderRadius:'50%',background:v.ok?'#27ae60':'#e74c3c',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,flexShrink:0}}>{v.ok?'✓':'✗'}</span>
                  <span style={{color:'rgba(255,255,255,0.4)',width:130,flexShrink:0}}>{k}</span>
                  <span style={{color:v.ok?'#a8d8a8':'#f8a8a8'}}>{v.detail}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{marginTop:16,display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className="btn btn-primary btn-sm" onClick={onRetry}>↻ 再接続確認</button>
            <a href="https://github.com/getegeteakete/fudousan2026-s/blob/main/supabase/schema.sql" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">schema.sql を GitHub で開く ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 環境変数未設定ガイド ─────────────────────────────────────
function EnvGuide({onRetry}: {onRetry:()=>void}) {
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
        <IconSparkle size={16} color="var(--gold)"/>
        <h2 style={{fontFamily:'Shippori Mincho,serif',fontSize:16,fontWeight:700,color:'var(--navy-deep)'}}>AI トークン使用量管理</h2>
        <span style={{padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:700,background:'#fee',color:'#c00'}}>環境変数未設定</span>
      </div>
      <div className="card" style={{border:'2px solid var(--red)'}}>
        <div className="card-body">
          <div style={{fontSize:14,fontWeight:700,marginBottom:12,display:'flex',alignItems:'center',gap:8}}><IconKey size={16} color="var(--red)"/> Vercel 環境変数を設定してください</div>
          <div style={{fontFamily:'monospace',fontSize:12,background:'var(--navy-deep)',color:'#a8d8a8',padding:'14px',borderRadius:'var(--radius)',lineHeight:2}}>
            {'NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...\nSUPABASE_SERVICE_ROLE_KEY=eyJhbGci...\nANTHROPIC_API_KEY=sk-ant-api03-...'}
          </div>
          <div style={{display:'flex',gap:10,marginTop:14,flexWrap:'wrap'}}>
            <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Vercel Dashboard ↗</a>
            <button className="btn btn-outline btn-sm" onClick={onRetry}>↻ 再確認</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── デモデータ ────────────────────────────────────────────────
const DEMO_STATS: TokenStats = {
  totalTokens:48320, totalCost:0.2847, callCount:47,
  byOperation:{ chat:{tokens:18420,cost:0.091,count:28}, generate:{tokens:15800,cost:0.112,count:8}, legal_check:{tokens:9200,cost:0.058,count:7}, special_terms:{tokens:3200,cost:0.018,count:3} },
  daily: Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return {date:d.toISOString().split('T')[0],tokens:Math.floor(Math.random()*8000+1500),cost:Math.random()*0.05+0.01}; }),
  recentCalls:[
    {id:'1',operation:'chat',model:'claude-sonnet-4-20250514',input_tokens:420,output_tokens:180,total_tokens:600,cost_usd:0.00396,response_ms:1240,created_at:new Date(Date.now()-3e5).toISOString()},
    {id:'2',operation:'generate',model:'claude-sonnet-4-20250514',input_tokens:850,output_tokens:1900,total_tokens:2750,cost_usd:0.031,response_ms:4820,created_at:new Date(Date.now()-8e5).toISOString()},
    {id:'3',operation:'legal_check',model:'claude-sonnet-4-20250514',input_tokens:520,output_tokens:680,total_tokens:1200,cost_usd:0.0118,response_ms:2100,created_at:new Date(Date.now()-15e5).toISOString()},
  ],
};
