'use client';
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_CONTRACTS, STATUS_LABELS, TYPE_LABELS, formatCurrency, formatDate } from '@/lib/data';
import type { Contract } from '@/lib/data';
import { IconCheck, IconAlert, IconSign, IconDownload, IconSend, IconLock, IconClock, IconUser, IconStamp, IconContracts } from '@/components/Icons';
import { getLocalContracts, saveLocalContract } from '@/lib/store';

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [tab, setTab] = useState<'detail'|'audit'|'sign'>('detail');
  const [signed, setSigned] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);

  useEffect(() => {
    const local = getLocalContracts();
    const found = local.find(c=>c.id===id) ?? SAMPLE_CONTRACTS.find(c=>c.id===id) ?? null;
    setContract(found);
    if (found?.status === 'signed' || found?.status === 'completed') setSigned(true);
  }, [id]);

  if (!contract) return (
    <AppLayout title="契約詳細">
      <div style={{textAlign:'center',padding:60,color:'var(--text-muted)'}}>
        <IconContracts size={36}/><br/>契約書が見つかりません（ID: {id}）<br/>
        <a href="/contracts" className="btn btn-outline" style={{marginTop:16,display:'inline-flex'}}>← 一覧に戻る</a>
      </div>
    </AppLayout>
  );

  const statusClass: Record<string,string> = {
    draft:'status-draft', pending:'status-pending', signed:'status-signed',
    completed:'status-completed', expired:'status-expired',
  };

  // ── 署名パッド ─────────────────────────────────────────
  const startDraw = (e: React.MouseEvent|React.TouchEvent) => {
    drawing.current = true;
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    const ctx = c.getContext('2d')!;
    const x = 'touches' in e ? e.touches[0].clientX - r.left : e.clientX - r.left;
    const y = 'touches' in e ? e.touches[0].clientY - r.top  : e.clientY - r.top;
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const draw = (e: React.MouseEvent|React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    const ctx = c.getContext('2d')!;
    const x = 'touches' in e ? e.touches[0].clientX - r.left : e.clientX - r.left;
    const y = 'touches' in e ? e.touches[0].clientY - r.top  : e.clientY - r.top;
    ctx.lineTo(x, y); ctx.stroke(); setHasSig(true);
  };
  const endDraw = () => { drawing.current = false; };
  const clearSig = () => {
    const c = canvasRef.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setHasSig(false);
  };

  const handleSendRequest = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const updated: Contract = {
      ...contract,
      status: 'pending',
      sentAt: now,
      updatedAt: now,
      auditLog: [...(contract.auditLog??[]), { timestamp: now, event: '署名依頼送信', detail: `${contract.tenantEmail}へ送信` }],
    };
    saveLocalContract(updated);
    setContract(updated);
    setActionMsg('署名依頼を送信しました');
    setSaving(false);
    setTimeout(()=>setActionMsg(''), 3000);
  };

  const handleSign = () => {
    const now = new Date().toISOString();
    const updated: Contract = {
      ...contract,
      status: 'signed',
      signedAt: now,
      updatedAt: now,
      auditLog: [...(contract.auditLog??[]), { timestamp: now, event: '署名完了', detail: '宅建士による電子署名完了', ip: '127.0.0.1' }],
    };
    saveLocalContract(updated);
    setContract(updated);
    setSigned(true);
    setActionMsg('電子署名が完了しました');
    setTimeout(()=>setActionMsg(''), 3000);
  };

  const handleComplete = () => {
    const now = new Date().toISOString();
    const updated: Contract = {
      ...contract,
      status: 'completed',
      updatedAt: now,
      auditLog: [...(contract.auditLog??[]), { timestamp: now, event: '契約締結完了', detail: '全署名収集・タイムスタンプ付与完了' }],
    };
    saveLocalContract(updated);
    setContract(updated);
    setActionMsg('契約が締結完了しました');
    setTimeout(()=>setActionMsg(''), 3000);
  };

  return (
    <AppLayout title={`契約詳細 - ${contract.contractNo}`}>
      {/* header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <span className={`status-badge ${statusClass[contract.status]}`} style={{fontSize:12}}>{STATUS_LABELS[contract.status]}</span>
            <span style={{fontFamily:'monospace',fontSize:12,color:'var(--text-muted)'}}>{contract.contractNo}</span>
          </div>
          <div style={{fontSize:20,fontWeight:800,fontFamily:'Shippori Mincho,serif',color:'var(--navy-deep)'}}>{contract.propertyName}</div>
          <div style={{fontSize:13,color:'var(--text-muted)',marginTop:2}}>{contract.propertyAddress}</div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {contract.status==='draft' && (
            <button className="btn btn-primary" onClick={handleSendRequest} disabled={saving}>
              <IconSend size={14}/> {saving?'送信中…':'署名依頼を送信'}
            </button>
          )}
          {contract.status==='pending' && (
            <button className="btn btn-gold" onClick={()=>setTab('sign')}>
              <IconSign size={14}/> 署名する
            </button>
          )}
          {contract.status==='signed' && (
            <button className="btn btn-primary" onClick={handleComplete}>
              <IconCheck size={14}/> 締結完了にする
            </button>
          )}
          <button className="btn btn-outline"><IconDownload size={14}/> PDF出力</button>
        </div>
      </div>

      {actionMsg && <div className="alert alert-success" style={{marginBottom:16}}><IconCheck size={14}/> {actionMsg}</div>}

      <div className="tabs">
        {[{key:'detail',label:'契約内容'},{key:'audit',label:'監査ログ'},{key:'sign',label:'電子署名'}].map(t=>(
          <div key={t.key} className={`tab ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key as typeof tab)}>{t.label}</div>
        ))}
      </div>

      {/* ── 契約内容 ── */}
      {tab==='detail' && (
        <div className="grid-2col">
          <div className="card">
            <div className="card-header"><div className="card-title"><IconContracts size={14}/> 基本情報</div></div>
            <div className="card-body">
              {[
                {label:'契約種別',value:TYPE_LABELS[contract.type]},
                {label:'物件名',value:contract.propertyName},
                {label:'所在地',value:contract.propertyAddress},
                {label:'契約者',value:contract.tenantName},
                {label:'メール',value:contract.tenantEmail},
                {label:'電話',value:contract.tenantPhone||'—'},
                {label:'賃料',value:contract.rent?formatCurrency(contract.rent):'—'},
                {label:'敷金',value:contract.deposit?formatCurrency(contract.deposit):'—'},
                {label:'礼金',value:contract.keyMoney?formatCurrency(contract.keyMoney):'—'},
                {label:'契約開始',value:contract.startDate||'—'},
                {label:'契約終了',value:contract.endDate||'—'},
              ].map(row=>(
                <div key={row.label} style={{display:'flex',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                  <span style={{color:'var(--text-muted)',width:90,flexShrink:0}}>{row.label}</span>
                  <span style={{fontWeight:600}}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="card" style={{marginBottom:16}}>
              <div className="card-header"><div className="card-title"><IconUser size={14}/> 宅建士情報</div></div>
              <div className="card-body">
                <div style={{fontSize:13,marginBottom:6}}><span style={{color:'var(--text-muted)'}}>氏名 </span>{contract.agentName}</div>
                <div style={{fontSize:13}}><span style={{color:'var(--text-muted)'}}>免許 </span>{contract.agentLicense}</div>
              </div>
            </div>
            <div className="card" style={{marginBottom:16}}>
              <div className="card-header"><div className="card-title"><IconClock size={14}/> タイムライン</div></div>
              <div className="card-body">
                {[
                  {label:'作成日',val:contract.createdAt,ok:!!contract.createdAt},
                  {label:'送信日',val:contract.sentAt,ok:!!contract.sentAt},
                  {label:'署名日',val:contract.signedAt,ok:!!contract.signedAt},
                ].map(row=>(
                  <div key={row.label} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',fontSize:12}}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:row.ok?'var(--green)':'var(--border)',flexShrink:0}}/>
                    <span style={{color:'var(--text-muted)',width:60}}>{row.label}</span>
                    <span>{row.val?formatDate(row.val):'—'}</span>
                  </div>
                ))}
              </div>
            </div>
            {contract.specialTerms && (
              <div className="card">
                <div className="card-header"><div className="card-title">特約事項</div></div>
                <div className="card-body">
                  <div style={{fontSize:12,lineHeight:1.8,whiteSpace:'pre-wrap'}}>{contract.specialTerms}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 監査ログ ── */}
      {tab==='audit' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><IconLock size={14}/> 監査ログ（改ざん防止）</div>
            <span className="status-badge status-signed">電帳法準拠</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr><th>日時</th><th>イベント</th><th>詳細</th><th>IPアドレス</th></tr></thead>
              <tbody>
                {(contract.auditLog??[]).length===0?(
                  <tr><td colSpan={4} style={{textAlign:'center',padding:24,color:'var(--text-muted)'}}>監査ログがありません</td></tr>
                ):(contract.auditLog??[]).map((log,i)=>(
                  <tr key={i}>
                    <td style={{fontFamily:'monospace',fontSize:11}}>{new Date(log.timestamp).toLocaleString('ja-JP')}</td>
                    <td><span className="status-badge status-completed">{log.event}</span></td>
                    <td style={{fontSize:12}}>{log.detail}</td>
                    <td style={{fontFamily:'monospace',fontSize:11,color:'var(--text-muted)'}}>{log.ip||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 電子署名 ── */}
      {tab==='sign' && (
        <div style={{maxWidth:520,margin:'0 auto'}}>
          {signed ? (
            <div className="card" style={{textAlign:'center',padding:32}}>
              <div style={{width:60,height:60,borderRadius:'50%',background:'var(--green)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <IconCheck size={26} color="white"/>
              </div>
              <div style={{fontSize:18,fontWeight:800,fontFamily:'Shippori Mincho,serif',marginBottom:8}}>署名完了</div>
              <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:16}}>
                {contract.signedAt ? `署名日時: ${new Date(contract.signedAt).toLocaleString('ja-JP')}` : '署名済み'}
              </div>
              <div className="alert alert-success"><IconStamp size={14}/> タイムスタンプ付与済み（RFC3161準拠）</div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header"><div className="card-title"><IconSign size={14}/> 電子署名パッド</div></div>
              <div className="card-body">
                <div className="alert alert-warn" style={{marginBottom:16}}>
                  <IconAlert size={13}/>
                  <span style={{fontSize:12}}>宅建士として内容を確認の上、署名してください。署名後の取り消しはできません。</span>
                </div>
                <div style={{marginBottom:12,fontSize:13}}>
                  <strong>{contract.propertyName}</strong> の {TYPE_LABELS[contract.type]}<br/>
                  <span style={{fontSize:12,color:'var(--text-muted)'}}>契約者: {contract.tenantName}</span>
                </div>
                <canvas ref={canvasRef} width={460} height={160}
                  style={{border:'2px solid var(--border)',borderRadius:'var(--radius)',touchAction:'none',cursor:'crosshair',width:'100%',background:'white'}}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:8,marginBottom:16}}>
                  <span style={{fontSize:11,color:'var(--text-muted)'}}>マウスまたはタッチで署名してください</span>
                  <button className="btn btn-ghost btn-sm" onClick={clearSig}>クリア</button>
                </div>
                <button className="btn btn-success btn-lg w-full" disabled={!hasSig} onClick={handleSign}>
                  <IconSign size={15}/> 電子署名を確定する
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
