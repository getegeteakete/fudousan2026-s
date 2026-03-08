'use client';
import { useState, useRef, useEffect } from 'react';
import { use } from 'react';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_CONTRACTS, STATUS_LABELS, TYPE_LABELS, formatCurrency, formatDate } from '@/lib/data';
import type { Contract } from '@/lib/data';
import Link from 'next/link';
import {
  IconBack, IconContracts, IconClock, IconSecurity, IconDownload, IconSend,
  IconCheck, IconAlert, IconSign, IconLock, IconWifi, IconKey,
} from '@/components/Icons';

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const contract = SAMPLE_CONTRACTS.find(c => c.id === id);
  const [tab, setTab] = useState<'overview' | 'preview' | 'sign' | 'audit'>('overview');
  const [signed, setSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0a1628';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [tab]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas || !lastPos.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasSig(true);
  };
  const endDraw = () => { setIsDrawing(false); lastPos.current = null; };
  const clearSig = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  };

  if (!contract) {
    return (
      <AppLayout title="契約書詳細">
        <div className="alert alert-danger"><IconAlert size={14} /> 契約書が見つかりません</div>
        <Link href="/contracts" className="btn btn-outline" style={{ marginTop: 16 }}><IconBack size={14} /> 一覧に戻る</Link>
      </AppLayout>
    );
  }

  const statusClass: Record<string, string> = {
    draft: 'status-draft', pending: 'status-pending', signed: 'status-signed',
    completed: 'status-completed', expired: 'status-expired',
  };

  return (
    <AppLayout title={`契約書：${contract.contractNo}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <Link href="/contracts" className="btn btn-outline btn-sm"><IconBack size={13} /> 一覧</Link>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'Shippori Mincho, serif' }}>{contract.propertyName}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contract.contractNo} / {TYPE_LABELS[contract.type]}</div>
        </div>
        <span className={`status-badge ${statusClass[contract.status]}`} style={{ marginLeft: 'auto' }}>{STATUS_LABELS[contract.status]}</span>
      </div>

      <div className="tabs">
        {[{ key: 'overview', label: '概要' }, { key: 'preview', label: '契約書プレビュー' }, { key: 'sign', label: '電子署名' }, { key: 'audit', label: '監査ログ' }].map(t => (
          <div key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as typeof tab)}>{t.label}</div>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header"><div className="card-title"><IconContracts size={14} /> 物件情報</div></div>
            <div className="card-body">
              <table className="data-table"><tbody>
                <tr><td style={{ color: 'var(--text-muted)', width: 120 }}>物件名</td><td style={{ fontWeight: 600 }}>{contract.propertyName}</td></tr>
                <tr><td style={{ color: 'var(--text-muted)' }}>所在地</td><td>{contract.propertyAddress}</td></tr>
                {contract.rent && <tr><td style={{ color: 'var(--text-muted)' }}>月額賃料</td><td style={{ fontWeight: 700, color: 'var(--navy)' }}>{formatCurrency(contract.rent)}</td></tr>}
                {contract.deposit && <tr><td style={{ color: 'var(--text-muted)' }}>敷金</td><td>{formatCurrency(contract.deposit)}</td></tr>}
                {contract.keyMoney !== undefined && <tr><td style={{ color: 'var(--text-muted)' }}>礼金</td><td>{formatCurrency(contract.keyMoney)}</td></tr>}
                <tr><td style={{ color: 'var(--text-muted)' }}>契約開始</td><td>{formatDate(contract.startDate)}</td></tr>
                {contract.endDate && <tr><td style={{ color: 'var(--text-muted)' }}>契約終了</td><td>{formatDate(contract.endDate)}</td></tr>}
              </tbody></table>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title"><IconSign size={14} /> 当事者情報</div></div>
            <div className="card-body">
              <table className="data-table"><tbody>
                <tr><td style={{ color: 'var(--text-muted)', width: 120 }}>借主/買主</td><td style={{ fontWeight: 600 }}>{contract.tenantName}</td></tr>
                <tr><td style={{ color: 'var(--text-muted)' }}>メール</td><td>{contract.tenantEmail}</td></tr>
                <tr><td style={{ color: 'var(--text-muted)' }}>電話</td><td>{contract.tenantPhone}</td></tr>
                <tr><td style={{ color: 'var(--text-muted)' }}>担当宅建士</td><td style={{ fontWeight: 600 }}>{contract.agentName}</td></tr>
                <tr><td style={{ color: 'var(--text-muted)' }}>免許番号</td><td style={{ fontSize: 12 }}>{contract.agentLicense}</td></tr>
              </tbody></table>
            </div>
          </div>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header"><div className="card-title"><IconSecurity size={14} /> セキュリティ情報</div></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { label: 'タイムスタンプ', value: contract.signedAt ? '付与済み' : '未付与', ok: !!contract.signedAt, icon: <IconClock size={12} /> },
                  { label: '署名者IPアドレス', value: contract.signerIp || '未署名', ok: !!contract.signerIp, icon: <IconWifi size={12} /> },
                  { label: '改ざん検証', value: contract.status === 'completed' ? '検証済み' : '待機中', ok: contract.status === 'completed', icon: <IconSecurity size={12} /> },
                  { label: '電子帳簿保存法', value: '準拠済み', ok: true, icon: <IconCheck size={12} /> },
                  { label: '通信暗号化', value: 'TLS 1.3', ok: true, icon: <IconLock size={12} /> },
                  { label: '保存期間', value: '7年間（法定）', ok: true, icon: <IconKey size={12} /> },
                ].map((item) => (
                  <div key={item.label} style={{ padding: '12px 14px', background: item.ok ? 'var(--green-pale)' : 'var(--earth-pale)', borderRadius: 'var(--radius)', border: `1px solid ${item.ok ? '#a8dfc0' : 'var(--border)'}` }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>{item.icon}{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.ok ? 'var(--green)' : 'var(--text-main)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'preview' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
            <button className="btn btn-outline btn-sm"><IconDownload size={14} /> PDF ダウンロード</button>
            {contract.status === 'pending' && <button className="btn btn-primary btn-sm"><IconSend size={14} /> リマインド送信</button>}
          </div>
          <div className="contract-preview">
            <h1>{TYPE_LABELS[contract.type]}</h1>
            <div className="contract-date">契約番号：{contract.contractNo}<br />作成日：{formatDate(contract.createdAt)}</div>
            <div className="contract-parties">
              <div><div className="party-label">貸主（甲）</div><div className="party-name">物件オーナー</div></div>
              <div><div className="party-label">借主（乙）</div><div className="party-name">{contract.tenantName}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{contract.tenantEmail}</div></div>
            </div>
            <h2>第1条（目的・物件の表示）</h2>
            <table><tbody>
              <tr><th>物件名称</th><td>{contract.propertyName}</td></tr>
              <tr><th>所在地</th><td>{contract.propertyAddress}</td></tr>
            </tbody></table>
            <h2>第2条（賃料・費用）</h2>
            <table><tbody>
              {contract.rent && <tr><th>月額賃料</th><td><strong>{formatCurrency(contract.rent)}</strong></td></tr>}
              {contract.deposit && <tr><th>敷金</th><td>{formatCurrency(contract.deposit)}</td></tr>}
              {contract.keyMoney !== undefined && <tr><th>礼金</th><td>{formatCurrency(contract.keyMoney)}</td></tr>}
              <tr><th>契約開始日</th><td>{formatDate(contract.startDate)}</td></tr>
              {contract.endDate && <tr><th>契約終了日</th><td>{formatDate(contract.endDate)}</td></tr>}
            </tbody></table>
            {contract.specialTerms && (<><h2>特約事項</h2><p>{contract.specialTerms}</p></>)}
            <h2>宅地建物取引士 記名</h2>
            <table><tbody>
              <tr><th>宅建士 氏名</th><td>{contract.agentName}</td></tr>
              <tr><th>免許番号</th><td>{contract.agentLicense}</td></tr>
            </tbody></table>
            <div className="seal-area">
              {[
                { lbl: '貸主', signed: contract.status === 'completed' },
                { lbl: '借主', signed: ['signed', 'completed'].includes(contract.status) },
                { lbl: '宅建士', signed: true },
              ].map(({ lbl, signed: s }) => (
                <div key={lbl} className="seal-box">
                  <div className={`seal-circle ${s ? 'signed' : ''}`}>{s ? <IconCheck size={16} color="var(--red)" /> : lbl}</div>
                  <div className="seal-label">{lbl}</div>
                </div>
              ))}
            </div>
            {contract.signedAt && (
              <div style={{ marginTop: 20, padding: '10px 14px', background: 'var(--green-pale)', borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--green)' }}>
                電子署名完了：{formatDate(contract.signedAt)} ｜ タイムスタンプ付与済み ｜ IP: {contract.signerIp}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'sign' && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {signed || contract.status === 'completed' || contract.status === 'signed' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <IconCheck size={32} color="white" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Shippori Mincho, serif', marginBottom: 8 }}>電子署名が完了しています</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{contract.signedAt ? `署名日時：${formatDate(contract.signedAt)}` : '署名済み'}</div>
            </div>
          ) : (
            <>
              <div className="alert alert-warn" style={{ marginBottom: 20 }}>
                <IconAlert size={14} />
                <div><strong>電子署名の前に必ずお読みください</strong><br /><span style={{ fontSize: 12 }}>署名することで契約内容に同意したことになります。内容をよく確認してから署名してください。</span></div>
              </div>
              <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>セキュリティ状態</span>
                {[{ label: 'TLS暗号化', icon: <IconLock size={10} /> }, { label: 'タイムスタンプ', icon: <IconClock size={10} /> }, { label: '接続確認', icon: <IconWifi size={10} /> }].map(item => (
                  <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gold-light)' }}>{item.icon} {item.label}</span>
                ))}
              </div>
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><IconSign size={14} /> 電子署名パッド</div>
                  <button className="btn btn-outline btn-sm" onClick={clearSig}>クリア</button>
                </div>
                <div className="card-body">
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>以下の枠内にマウスまたは指でサインしてください。</p>
                  <canvas ref={canvasRef} width={520} height={180} className={`sig-canvas ${hasSig ? 'active' : ''}`}
                    style={{ width: '100%', touchAction: 'none' }}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
                  <div style={{ marginTop: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                      <input type="checkbox" id="agree" style={{ marginTop: 2 }} />
                      <span>契約書の内容を確認し、宅地建物取引業法に基づく重要事項説明を受けた上で、本契約内容に同意し電子署名を実施します。本署名は法的効力を有することを理解しています。</span>
                    </label>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <button className="btn btn-success btn-lg w-full" disabled={!hasSig} onClick={() => setSigned(true)}>
                  <IconCheck size={16} /> 電子署名を完了する
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><IconSecurity size={14} /> 操作・監査ログ</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>電子帳簿保存法準拠 ｜ 改ざん不可記録</div>
          </div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              <IconLock size={13} />
              <span style={{ fontSize: 12 }}>すべての操作がタイムスタンプ付きで記録され、7年間保存されます。</span>
            </div>
            {[...contract.auditLog].reverse().map((entry, i) => (
              <div key={i} className="audit-entry">
                <div className="audit-time">
                  {new Date(entry.timestamp).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}{' '}
                  {new Date(entry.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="audit-event">{entry.event}</div>
                  <div className="audit-detail">{entry.detail}</div>
                  {entry.ip && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>IP: {entry.ip}{entry.userId && ` | ユーザー: ${entry.userId}`}</div>}
                </div>
                <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 4, background: entry.event.includes('署名') ? 'var(--green)' : entry.event.includes('送信') ? 'var(--blue)' : 'var(--border-dark)' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
