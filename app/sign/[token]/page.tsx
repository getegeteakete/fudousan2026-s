'use client';
import { useState, useRef, useEffect } from 'react';
import { use } from 'react';

interface ContractInfo {
  id: string; property_name: string; tenant_name: string; tenant_email: string;
  status: string; rent?: number; start_date?: string; type: string;
}

export default function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [contract, setContract] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [timestampHash, setTimestampHash] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setContract(d.contract);
      })
      .catch(() => setError('ネットワークエラーが発生しました'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0a1628'; ctx.lineWidth = 2.5;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }, [contract]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect();
    if ('touches' in e) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: (e as React.MouseEvent).clientX - r.left, y: (e as React.MouseEvent).clientY - r.top };
  };
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current; if (!c) return;
    setIsDrawing(true); lastPos.current = getPos(e, c);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const c = canvasRef.current; if (!c || !lastPos.current) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const pos = getPos(e, c);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
    lastPos.current = pos; setHasSig(true);
  };
  const endDraw = () => { setIsDrawing(false); lastPos.current = null; };
  const clearSig = () => {
    const c = canvasRef.current; if (!c) return;
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    setHasSig(false);
  };

  const handleSubmit = async () => {
    if (!hasSig || !agreed) return;
    setSubmitting(true);
    const signatureData = canvasRef.current?.toDataURL('image/png') ?? '';
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTimestampHash(data.timestampHash);
      setDone(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) return (
    <div style={centeredStyle}>
      <div style={spinnerStyle} />
      <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>契約書を読み込み中...</p>
    </div>
  );

  // Error
  if (error) return (
    <div style={centeredStyle}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff0f0', border: '2px solid var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>⚠</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>エラー</div>
      <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{error}</div>
    </div>
  );

  // Completed
  if (done) return (
    <div style={centeredStyle}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12L9 17L20 6" /></svg>
      </div>
      <div style={{ fontFamily: 'Shippori Mincho, serif', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>電子署名が完了しました</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
        ご署名いただきありがとうございます。<br />締結完了の通知メールをお送りします。
      </div>
      <div style={{ background: 'var(--earth-pale)', borderRadius: 12, padding: '14px 18px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-sub)', wordBreak: 'break-all', maxWidth: 380 }}>
        <div style={{ fontWeight: 700, marginBottom: 4, fontFamily: 'inherit', fontSize: 12 }}>タイムスタンプ（改ざん防止証明）</div>
        {timestampHash}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 16px' }}>
      {/* Security bar */}
      <div style={{ background: 'var(--navy-deep)', color: 'white', padding: '8px 20px', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap', fontSize: 11 }}>
        {['🔒 TLS 1.3 暗号化', '⏱ タイムスタンプ付与', '✓ 宅建業法準拠'].map(s => (
          <span key={s} style={{ color: 'var(--gold-light)' }}>{s}</span>
        ))}
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'Shippori Mincho, serif', fontSize: 20, fontWeight: 700, color: 'var(--navy-deep)', marginBottom: 4 }}>電子署名のご依頼</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>以下の契約書への署名をお願いします</div>
        </div>

        {/* Contract info */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header"><div className="card-title">契約内容確認</div></div>
          <div className="card-body">
            <table style={{ width: '100%', fontSize: 13 }}>
              <tbody>
                {[
                  ['物件名', contract?.property_name],
                  ['契約者', contract?.tenant_name],
                  ['契約種別', contract?.type === 'lease' ? '賃貸借契約書' : contract?.type === 'sale' ? '売買契約書' : '契約書'],
                  contract?.rent ? ['月額賃料', `${contract.rent.toLocaleString()}円`] : null,
                  contract?.start_date ? ['契約開始日', new Date(contract.start_date).toLocaleDateString('ja-JP')] : null,
                ].filter(Boolean).map(([k, v]) => (
                  <tr key={k as string} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 0', color: 'var(--text-muted)', width: '40%' }}>{k as string}</td>
                    <td style={{ padding: '10px 0', fontWeight: 600 }}>{v as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature pad */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <div className="card-title">電子署名パッド</div>
            <button className="btn btn-outline btn-sm" onClick={clearSig}>クリア</button>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>以下の枠内にサインしてください（マウス・指で描いてください）</p>
            <canvas ref={canvasRef} width={540} height={180}
              className={`sig-canvas ${hasSig ? 'active' : ''}`}
              style={{ width: '100%', touchAction: 'none', cursor: 'crosshair' }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
          </div>
        </div>

        {/* Agreement */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, lineHeight: 1.7 }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
              <span>
                契約書の内容を十分に確認し、宅地建物取引業法に基づく重要事項説明を受けた上で、
                本契約内容に同意し電子署名を実施します。
                <br />
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  本署名は法的効力を有し、RFC3161準拠のタイムスタンプが付与されます。
                </span>
              </span>
            </label>
          </div>
        </div>

        <button className="btn btn-success btn-lg w-full" disabled={!hasSig || !agreed || submitting} onClick={handleSubmit}
          style={{ fontSize: 16, padding: '14px' }}>
          {submitting ? '署名処理中...' : '✓ 電子署名を完了する'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'var(--text-muted)' }}>
          PropSign 不動産電子契約システム ｜ TLS 1.3 ｜ タイムスタンプ付与
        </div>
      </div>
    </div>
  );
}

const centeredStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', padding: 24,
  background: 'var(--bg)',
};
const spinnerStyle: React.CSSProperties = {
  width: 40, height: 40, border: '3px solid var(--border)',
  borderTop: '3px solid var(--navy)', borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};
