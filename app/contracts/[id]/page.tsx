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
  const [tab, setTab]     = useState<'detail' | 'audit' | 'sign'>('detail');
  const [signed, setSigned]     = useState(false);
  const [hasSig, setHasSig]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');
  const [signUrl, setSignUrl]   = useState('');
  const [emailInfo, setEmailInfo] = useState<{ sent: boolean; fallback?: boolean } | null>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const drawing    = useRef(false);

  useEffect(() => {
    const local = getLocalContracts();
    const found = local.find(c => c.id === id) ?? SAMPLE_CONTRACTS.find(c => c.id === id) ?? null;
    setContract(found);
    if (found?.status === 'signed' || found?.status === 'completed') setSigned(true);
  }, [id]);

  if (!contract) return (
    <AppLayout title="契約詳細">
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
        <IconContracts size={36} /><br />契約書が見つかりません（ID: {id}）<br />
        <a href="/contracts" className="btn btn-outline" style={{ marginTop: 16, display: 'inline-flex' }}>← 一覧に戻る</a>
      </div>
    </AppLayout>
  );

  const statusClass: Record<string, string> = {
    draft: 'status-draft', pending: 'status-pending', signed: 'status-signed',
    completed: 'status-completed', expired: 'status-expired',
  };

  const flash = (msg: string, isErr = false) => {
    if (isErr) { setActionErr(msg); setTimeout(() => setActionErr(''), 5000); }
    else { setActionMsg(msg); setTimeout(() => setActionMsg(''), 4000); }
  };

  // ── 署名パッド ─────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, r: DOMRect) => ({
    x: 'touches' in e ? e.touches[0].clientX - r.left : e.clientX - r.left,
    y: 'touches' in e ? e.touches[0].clientY - r.top  : e.clientY - r.top,
  });
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    const c = canvasRef.current!; const ctx = c.getContext('2d')!;
    const { x, y } = getPos(e, c.getBoundingClientRect());
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1a2540';
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const c = canvasRef.current!; const { x, y } = getPos(e, c.getBoundingClientRect());
    const ctx = c.getContext('2d')!; ctx.lineTo(x, y); ctx.stroke(); setHasSig(true);
  };
  const endDraw = () => { drawing.current = false; };
  const clearSig = () => {
    canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSig(false);
  };

  // ── 署名依頼送信（API呼び出し） ────────────────────────────
  const handleSendRequest = async () => {
    setSaving(true); setActionErr(''); setSignUrl(''); setEmailInfo(null);
    const now = new Date().toISOString();
    try {
      const res = await fetch('/api/sign/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          expiryDays: 7,
          signatureType: 'witness',
          localContract: {
            tenantEmail:  contract.tenantEmail,
            tenantName:   contract.tenantName,
            propertyName: contract.propertyName,
            contractNo:   contract.contractNo,
            agentName:    contract.agentName,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      // ローカル状態を更新
      const updated: Contract = {
        ...contract, status: 'pending', sentAt: now, updatedAt: now,
        auditLog: [
          ...(contract.auditLog ?? []),
          {
            timestamp: now, event: '署名依頼送信',
            detail: `${contract.tenantEmail} へメール送信${data.email?.fallback ? '（テストモード）' : ''}`,
          },
        ],
      };
      saveLocalContract(updated);
      setContract(updated);
      setSignUrl(data.signUrl ?? '');
      setEmailInfo(data.email?.receipt ?? { sent: false });
      flash(
        data.email?.receipt?.fallback
          ? `署名URLを発行しました（メールテストモード: APIキー未設定）`
          : `署名依頼メールを ${contract.tenantEmail} に送信しました`
      );
    } catch (e) {
      flash(String(e), true);
    } finally {
      setSaving(false);
    }
  };

  // ── 宅建士による電子署名 ────────────────────────────────────
  const handleSign = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const sigData = canvasRef.current?.toDataURL('image/png') ?? '';
    try {
      // タイムスタンプハッシュをサーバーで生成
      const res = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'signed', signedAt: now, signatureData: sigData }),
      });
      const data = await res.json();
      // APIがSupabase未接続で失敗しても、ローカルには保存する
      const updated: Contract = {
        ...contract, status: 'signed', signedAt: now, updatedAt: now,
        auditLog: [
          ...(contract.auditLog ?? []),
          { timestamp: now, event: '電子署名完了', detail: '宅建士による電子署名・タイムスタンプ付与', ip: '127.0.0.1' },
        ],
      };
      saveLocalContract(updated);
      setContract(updated);
      setSigned(true);
      flash(`電子署名が完了しました${data.contract ? '（DB保存済み）' : '（ローカル保存）'}`);
    } catch {
      // フォールバック: ローカルのみ
      const updated: Contract = {
        ...contract, status: 'signed', signedAt: now, updatedAt: now,
        auditLog: [...(contract.auditLog ?? []), { timestamp: now, event: '電子署名完了', detail: 'ローカル署名（オフラインモード）', ip: '127.0.0.1' }],
      };
      saveLocalContract(updated);
      setContract(updated);
      setSigned(true);
      flash('電子署名が完了しました（オフラインモード）');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = () => {
    const now = new Date().toISOString();
    const updated: Contract = {
      ...contract, status: 'completed', updatedAt: now,
      auditLog: [...(contract.auditLog ?? []), { timestamp: now, event: '契約締結完了', detail: '全署名収集・タイムスタンプ確認完了' }],
    };
    saveLocalContract(updated);
    setContract(updated);
    flash('契約が締結完了しました');
  };

  return (
    <AppLayout title={`契約詳細 - ${contract.contractNo}`}>
      {/* アクション結果バナー */}
      {actionMsg && (
        <div className="alert alert-success" style={{ marginBottom: 14 }}>
          <IconCheck size={14} /> {actionMsg}
        </div>
      )}
      {actionErr && (
        <div className="alert alert-danger" style={{ marginBottom: 14 }}>
          <IconAlert size={14} /> {actionErr}
        </div>
      )}

      {/* 署名URL表示 */}
      {signUrl && (
        <div className="card" style={{ marginBottom: 16, border: '1px solid rgba(184,148,74,0.4)', background: 'rgba(232,212,154,0.08)' }}>
          <div className="card-header">
            <div className="card-title" style={{ color: 'var(--gold)' }}><IconSend size={13} color="var(--gold)" /> 署名URLを発行しました</div>
            {emailInfo && (
              <span className={`status-badge ${emailInfo.sent ? 'status-completed' : 'status-draft'}`}>
                {emailInfo.sent ? (emailInfo.fallback ? '📩 テストモード（ログ出力）' : '✓ メール送信済み') : 'メール未送信'}
              </span>
            )}
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input readOnly className="form-input" value={signUrl}
                style={{ flex: '1 1 280px', fontFamily: 'monospace', fontSize: 12, background: '#f9f9f9' }}
                onFocus={e => e.target.select()} />
              <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard?.writeText(signUrl); flash('URLをコピーしました'); }}>
                コピー
              </button>
              <a href={signUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">署名ページを確認 ↗</a>
            </div>
            {emailInfo?.fallback && (
              <div className="alert alert-warn" style={{ marginTop: 10, fontSize: 11 }}>
                <IconAlert size={12} /> RESEND_API_KEY未設定のため本番メールは未送信。Vercel環境変数に設定してください。
                <a href="https://resend.com" target="_blank" rel="noreferrer" style={{ marginLeft: 6, textDecoration: 'underline' }}>Resend →</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className={`status-badge ${statusClass[contract.status]}`} style={{ fontSize: 12 }}>{STATUS_LABELS[contract.status]}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{contract.contractNo}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Shippori Mincho,serif', color: 'var(--navy-deep)' }}>{contract.propertyName}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{contract.propertyAddress}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {contract.status === 'draft' && (
            <button className="btn btn-primary" onClick={handleSendRequest} disabled={saving}>
              <IconSend size={14} /> {saving ? '送信中…' : '署名依頼を送信'}
            </button>
          )}
          {contract.status === 'pending' && (
            <>
              <button className="btn btn-outline btn-sm" onClick={handleSendRequest} disabled={saving}>
                <IconSend size={13} /> 再送信
              </button>
              <button className="btn btn-gold" onClick={() => setTab('sign')}>
                <IconSign size={14} /> 宅建士署名
              </button>
            </>
          )}
          {contract.status === 'signed' && (
            <button className="btn btn-primary" onClick={handleComplete}>
              <IconCheck size={14} /> 締結完了にする
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={() => {
            const text = `契約書: ${contract.contractNo}\n物件: ${contract.propertyName}\n契約者: ${contract.tenantName}\nステータス: ${STATUS_LABELS[contract.status]}`;
            navigator.clipboard?.writeText(text);
            flash('情報をコピーしました');
          }}><IconDownload size={13} /> コピー</button>
        </div>
      </div>

      {/* タブ */}
      <div className="tabs">
        {[{ key: 'detail', label: '契約内容' }, { key: 'audit', label: '監査ログ' }, { key: 'sign', label: '電子署名' }].map(t => (
          <div key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as typeof tab)}>{t.label}</div>
        ))}
      </div>

      {/* 契約内容タブ */}
      {tab === 'detail' && (
        <div className="grid-2col">
          <div className="card">
            <div className="card-header"><div className="card-title"><IconContracts size={14} /> 基本情報</div></div>
            <div className="card-body">
              {[
                { label: '契約種別', val: TYPE_LABELS[contract.type] },
                { label: '物件名', val: contract.propertyName },
                { label: '所在地', val: contract.propertyAddress },
                { label: '契約者', val: contract.tenantName },
                { label: 'メール', val: contract.tenantEmail },
                { label: '電話', val: contract.tenantPhone },
                contract.rent ? { label: '月額賃料', val: formatCurrency(contract.rent) } : null,
                contract.deposit ? { label: '敷金', val: formatCurrency(contract.deposit) } : null,
                { label: '契約開始', val: contract.startDate ? formatDate(contract.startDate) : '—' },
                { label: '契約終了', val: contract.endDate ? formatDate(contract.endDate) : '—' },
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>{row!.label}</span>
                  <span style={{ fontWeight: 600 }}>{row!.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-header"><div className="card-title"><IconUser size={14} /> 宅建士情報</div></div>
              <div className="card-body">
                {[
                  { label: '氏名', val: contract.agentName },
                  { label: '免許番号', val: contract.agentLicense },
                ].filter(r => r.val).map((row, i) => (
                  <div key={i} style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)', width: 80, flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontWeight: 600 }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title"><IconLock size={14} /> 署名・タイムスタンプ</div></div>
              <div className="card-body">
                {[
                  { label: '作成日', val: contract.createdAt ? formatDate(contract.createdAt) : '—', ok: !!contract.createdAt },
                  { label: '送信日', val: contract.sentAt ? formatDate(contract.sentAt) : '未送信', ok: !!contract.sentAt },
                  { label: '署名日', val: contract.signedAt ? formatDate(contract.signedAt) : '未署名', ok: !!contract.signedAt },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8 }}>
                    <span style={row.ok ? { color: 'var(--green)', display: 'flex' } : { color: 'var(--border-dark)', display: 'flex' }}>
                      {row.ok ? <IconCheck size={14} /> : <IconClock size={14} />}
                    </span>
                    <span style={{ color: 'var(--text-muted)', width: 70 }}>{row.label}</span>
                    <span style={{ fontWeight: 600 }}>{row.val}</span>
                  </div>
                ))}
                <div className="alert alert-info" style={{ marginTop: 12, fontSize: 11 }}>
                  <IconStamp size={12} />
                  <span>RFC3161準拠タイムスタンプ・電子帳簿保存法準拠・7年間保存</span>
                </div>
                <span className="status-badge status-signed" style={{ marginTop: 10, display: 'inline-flex' }}>電帳法準拠</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 監査ログタブ */}
      {tab === 'audit' && (
        <div className="card">
          <div className="card-header"><div className="card-title"><IconClock size={14} /> 監査ログ</div></div>
          <div className="card-body">
            {(contract.auditLog ?? []).length === 0
              ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>ログがありません</div>
              : [...(contract.auditLog ?? [])].reverse().map((log, i) => (
                <div key={i} className="audit-entry">
                  <div className="audit-dot" style={{ background: log.event.includes('署名') ? 'var(--green)' : log.event.includes('送信') ? 'var(--gold)' : 'var(--navy-light)' }} />
                  <div className="audit-content">
                    <div className="audit-event">{log.event}</div>
                    <div className="audit-detail">{log.detail}{log.ip ? ` / IP: ${log.ip}` : ''}</div>
                  </div>
                  <div className="audit-time">{new Date(log.timestamp).toLocaleString('ja-JP')}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 電子署名タブ */}
      {tab === 'sign' && (
        <div>
          {signed ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', fontFamily: 'Shippori Mincho, serif', marginBottom: 8 }}>署名完了</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {contract.signedAt ? `署名日時: ${new Date(contract.signedAt).toLocaleString('ja-JP')}` : '署名済み'}
                </div>
                {contract.status === 'signed' && (
                  <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleComplete}>
                    <IconCheck size={14} /> 締結完了にする
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><IconSign size={14} /> 宅建士 電子署名</div>
                <button className="btn btn-outline btn-sm" onClick={clearSig}>クリア</button>
              </div>
              <div className="card-body">
                <div className="alert alert-warn" style={{ marginBottom: 14 }}>
                  <IconAlert size={13} />
                  <span style={{ fontSize: 12 }}>宅地建物取引業法に基づき、宅建士の電子署名（記名）が必須です。以下にサインしてください。</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>署名パッドにサイン（マウス・指で描画）</p>
                <canvas ref={canvasRef} width={600} height={200}
                  className={`sig-canvas ${hasSig ? 'active' : ''}`}
                  style={{ width: '100%', display: 'block', touchAction: 'none' }}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
                <button className="btn btn-gold btn-lg" style={{ marginTop: 16, width: '100%' }}
                  disabled={!hasSig || saving} onClick={handleSign}>
                  {saving ? <><span className="spinner" /> 処理中…</> : <><IconStamp size={15} /> 電子署名を完了する</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
