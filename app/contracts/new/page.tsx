'use client';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_PROPERTIES, formatCurrency } from '@/lib/data';
import type { Property, Contract } from '@/lib/data';
import { getLocalProperties, saveLocalContract, getSettings } from '@/lib/store';
import {
  IconUpload, IconCSV, IconProperties, IconUser, IconContracts,
  IconCheck, IconSparkle, IconAlert, IconArrow, IconBack,
  IconSign, IconDownload, IconSend,
} from '@/components/Icons';

type Step = 1 | 2 | 3 | 4;
const STEPS = [
  { num: 1, label: '物件選択' },
  { num: 2, label: '契約情報入力' },
  { num: 3, label: '契約書プレビュー' },
  { num: 4, label: '完了' },
];

const CONTRACT_TYPES = [
  { value: 'lease', label: '賃貸借契約書', sub: '賃貸借・更新・解約' },
  { value: 'sale', label: '売買契約書', sub: '不動産売買・引渡し' },
  { value: 'mediation', label: '媒介契約書', sub: '一般・専任・専属専任' },
  { value: 'management', label: '管理委託契約書', sub: '賃貸管理・サブリース' },
];

// SVG icons for contract types
function ContractTypeIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? 'var(--navy)' : 'var(--gold)';
  if (type === 'lease') return (
    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10L12 3L21 10" /><path d="M5 10V21H19V10" /><path d="M9 21V14H15V21" />
    </svg>
  );
  if (type === 'sale') return (
    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9H21" /><path d="M9 3V9" /><path d="M8 13H16" /><path d="M8 17H13" />
    </svg>
  );
  if (type === 'mediation') return (
    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="8" r="3" /><circle cx="17" cy="8" r="3" />
      <path d="M3 21C3 18.2 4.8 16 7 16" /><path d="M21 21C21 18.2 19.2 16 17 16" />
      <path d="M12 16C9.8 16 8 18.2 8 21" /><path d="M12 16C14.2 16 16 18.2 16 21" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
  return (
    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2L20 8L20 22L4 22L4 2Z" /><path d="M14 2L14 8L20 8" />
      <path d="M8 13H16" /><path d="M8 17H16" /><path d="M8 9H11" />
    </svg>
  );
}

// Property type icon
function PropIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? 'var(--gold-light)' : 'var(--text-muted)';
  if (type === '一戸建て') return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10L12 3L21 10" /><path d="M5 10V21H9V15H15V21H19V10" />
    </svg>
  );
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="1" /><path d="M8 6H10" /><path d="M14 6H16" />
      <path d="M8 10H10" /><path d="M14 10H16" /><path d="M8 14H10" /><path d="M14 14H16" />
      <path d="M10 22V17H14V22" />
    </svg>
  );
}

const AI_SUGGESTIONS = {
  lease: [
    { type: 'warn', text: '礼金0円の場合、消費者保護の観点から特約事項に明記することを推奨します。' },
    { type: 'ok', text: '契約期間：2年間（普通借家）- 正常な範囲です。' },
    { type: 'ok', text: '解約予告期間：1ヶ月前通知 - 宅建業法に準拠しています。' },
    { type: 'warn', text: '原状回復：国土交通省ガイドライン準拠の文言追加を推奨します。' },
  ],
  sale: [
    { type: 'ok', text: '手付金：売買代金の5%以内 - 適正範囲内です。' },
    { type: 'warn', text: '瑕疵担保責任：引渡し後3ヶ月の記載がありません。追加を推奨します。' },
    { type: 'ok', text: '重要事項説明書：35条・37条書面 - 形式要件を満たしています。' },
  ],
  mediation: [
    { type: 'ok', text: '仲介手数料：賃料1ヶ月分（税別）- 法定上限内です。' },
    { type: 'ok', text: '媒介契約期間：3ヶ月 - 標準的な期間です。' },
  ],
  management: [
    { type: 'ok', text: '管理委託料：賃料の5% - 適正範囲です。' },
    { type: 'warn', text: 'サブリース契約の場合、賃料変動リスクを借主に説明する必要があります。' },
  ],
};

export default function NewContractPage() {
  const [step, setStep] = useState<Step>(1);
  const [contractType, setContractType] = useState<string>('lease');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [csvProperties, setCsvProperties] = useState<Property[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [aiChecked, setAiChecked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    tenantName: '', tenantEmail: '', tenantPhone: '', tenantAddress: '',
    rent: '', deposit: '', keyMoney: '', managementFee: '',
    startDate: '', endDate: '', agentName: '', agentLicense: '', specialTerms: '',
  });

  const [localProperties, setLocalProperties] = useState<Property[]>([]);
  useEffect(() => { setLocalProperties(getLocalProperties()); }, []);
  const allProperties = [...localProperties, ...SAMPLE_PROPERTIES.filter(sp => !localProperties.find(lp=>lp.id===sp.id)), ...csvProperties];

  const handleCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.trim());
      const parsed: Property[] = lines.slice(1).map((line, i) => {
        const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
        return {
          id: `csv-${i}`, name: obj['物件名'] || `物件${i+1}`,
          address: obj['住所'] || '', type: obj['種別'] || 'マンション',
          area: parseFloat(obj['面積'] || '0'), rent: parseInt(obj['賃料'] || '0'),
          price: parseInt(obj['売買価格'] || '0'), rooms: obj['間取り'] || '',
          floor: obj['階数'] || '', buildYear: obj['築年'] || '',
          owner: obj['オーナー'] || '', ownerEmail: obj['オーナーメール'] || '',
          ownerPhone: obj['オーナー電話'] || '',
        };
      });
      setCsvProperties(parsed);
      setShowCsvPreview(true);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleSelectProperty = (prop: Property) => {
    setSelectedProperty(prop);
    if (prop.rent) setForm(f => ({ ...f, rent: prop.rent!.toString(), deposit: (prop.rent! * 2).toString() }));
  };

  const [generatedText, setGeneratedText] = useState('');
  const [legalResult, setLegalResult] = useState<{risk_level:string;items:{type:string;category:string;text:string}[];summary:string}|null>(null);
  const [generateError, setGenerateError] = useState('');

  const handleGenerate = async () => {
    if (!selectedProperty) return;
    setIsGenerating(true);
    setGenerateError('');
    try {
      const genRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: contractType,
          propertyName: selectedProperty.name,
          propertyAddress: selectedProperty.address,
          tenantName: form.tenantName,
          rent: parseInt(form.rent) || undefined,
          deposit: parseInt(form.deposit) || undefined,
          keyMoney: parseInt(form.keyMoney) || undefined,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          specialTerms: form.specialTerms || undefined,
          agentName: form.agentName || undefined,
          agentLicense: form.agentLicense || undefined,
        }),
      });
      const genData = await genRes.json();
      if (!genRes.ok || genData.error) throw new Error(genData.error ?? 'AI生成エラー');
      setGeneratedText(genData.text ?? '');
      try {
        const legalRes = await fetch('/api/ai/legal-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: contractType, contractData: { property: selectedProperty.name, address: selectedProperty.address, tenant: form.tenantName, rent: form.rent, deposit: form.deposit, start: form.startDate, end: form.endDate, specialTerms: form.specialTerms } }),
        });
        const legalData = await legalRes.json();
        if (legalData.result) setLegalResult(legalData.result);
      } catch {}
      setAiChecked(true);
      setStep(3);
    } catch (e) {
      setGenerateError(String(e));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateContractNo = () => {
    const d = new Date();
    return `PS-${d.getFullYear()}-${String(allProperties.length + 5).padStart(4, '0')}`;
  };

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  const buildContract = (status: Contract['status']): Contract => {
    const settings = getSettings();
    const now = new Date().toISOString();
    const contractNo = `PS-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    return {
      id: `c-${Date.now()}`,
      contractNo,
      type: contractType as Contract['type'],
      status,
      propertyId: selectedProperty?.id ?? '',
      propertyName: selectedProperty?.name ?? '',
      propertyAddress: selectedProperty?.address ?? '',
      tenantName: form.tenantName,
      tenantEmail: form.tenantEmail,
      tenantPhone: form.tenantPhone,
      agentName: form.agentName || settings.agentName,
      agentLicense: form.agentLicense || settings.agentLicense,
      rent: parseInt(form.rent) || undefined,
      deposit: parseInt(form.deposit) || undefined,
      keyMoney: parseInt(form.keyMoney) || undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      specialTerms: form.specialTerms || undefined,
      createdAt: now,
      updatedAt: now,
      sentAt: status === 'pending' ? now : undefined,
      auditLog: [{ timestamp: now, event: '契約書作成', detail: `AI生成にて${status==='pending'?'署名依頼送信':'下書き保存'}`, userId: 'current' }],
      notes: generatedText ? generatedText.slice(0, 500) : undefined,
    };
  };

  const handleSendRequest = () => {
    const c = buildContract('pending');
    saveLocalContract(c);
    setStep(4);
  };

  const handleDraftSave = () => {
    const c = buildContract('draft');
    saveLocalContract(c);
    alert(`下書きとして保存しました（契約番号: ${c.contractNo}）`);
  };

  return (
    <AppLayout title="新規契約作成">
      {/* Steps */}
      <div className="steps" style={{ marginBottom: 24 }}>
        {STEPS.map((s) => (
          <div key={s.num} className={`step ${step > s.num ? 'done' : step === s.num ? 'active' : ''}`}>
            <div className="step-num">
              {step > s.num ? <IconCheck size={13} /> : s.num}
            </div>
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><div className="card-title">契約種別を選択</div></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {CONTRACT_TYPES.map((t) => (
                  <div key={t.value} onClick={() => setContractType(t.value)} style={{
                    border: `2px solid ${contractType === t.value ? 'var(--navy)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)', padding: '18px', cursor: 'pointer',
                    background: contractType === t.value ? 'var(--earth-pale)' : 'white',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ marginBottom: 10 }}><ContractTypeIcon type={t.value} active={contractType === t.value} /></div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3, color: contractType === t.value ? 'var(--navy-deep)' : 'var(--text-main)' }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CSV Upload */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title"><IconCSV size={15} /> CSVから物件をインポート</div>
            </div>
            <div className="card-body">
              <div className={`upload-zone ${dragOver ? 'dragover' : ''}`} style={{ marginBottom: 12 }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCSV(f); }}
                onClick={() => fileRef.current?.click()}>
                <input type="file" ref={fileRef} accept=".csv" style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSV(f); }} />
                <div className="upload-icon"><IconUpload size={22} color="var(--gold-light)" /></div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>CSVファイルをドロップ</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  物件名,住所,種別,面積,賃料,間取り,オーナー,オーナーメール
                </div>
                <button className="btn btn-outline btn-sm">ファイルを選択</button>
              </div>
              {csvProperties.length > 0 && (
                <div className="alert alert-success"><IconCheck size={13} /> {csvProperties.length}件の物件をCSVから読み込みました</div>
              )}
              {showCsvPreview && csvProperties.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-sub)' }}>CSVプレビュー</div>
                  <div className="csv-table-wrap">
                    <table className="data-table">
                      <thead><tr><th>物件名</th><th>住所</th><th>種別</th><th>面積</th><th>賃料/価格</th><th>間取り</th></tr></thead>
                      <tbody>
                        {csvProperties.slice(0, 5).map((p) => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>{p.name}</td><td>{p.address}</td><td>{p.type}</td>
                            <td>{p.area}㎡</td><td>{p.rent ? formatCurrency(p.rent) : p.price ? formatCurrency(p.price) : '-'}</td>
                            <td>{p.rooms}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Property list */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><IconProperties size={15} /> 物件を選択</div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{allProperties.length}件</span>
            </div>
            <div>
              {allProperties.map((prop) => (
                <div key={prop.id} onClick={() => handleSelectProperty(prop)} style={{
                  padding: '14px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  background: selectedProperty?.id === prop.id ? 'var(--earth-pale)' : 'white',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: selectedProperty?.id === prop.id ? 'var(--navy)' : 'var(--earth-pale)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${selectedProperty?.id === prop.id ? 'var(--navy)' : 'var(--border)'}`,
                  }}>
                    <PropIcon type={prop.type} active={selectedProperty?.id === prop.id} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{prop.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{prop.address}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2 }}>
                      {prop.area}㎡ / {prop.rooms}{prop.floor && ` / ${prop.floor}`}{prop.buildYear && ` / 築${prop.buildYear}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {prop.rent && <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy)' }}>{formatCurrency(prop.rent)}<span style={{ fontSize: 10, fontWeight: 400 }}>/月</span></div>}
                    {prop.price && <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy)' }}>{formatCurrency(prop.price)}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{prop.type}</div>
                  </div>
                  {selectedProperty?.id === prop.id && <IconCheck size={18} color="var(--green)" />}
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-lg" disabled={!selectedProperty} onClick={() => setStep(2)}>
              次へ：契約情報入力 <IconArrow size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && selectedProperty && (
        <div>
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <IconProperties size={14} />
            <div><strong>{selectedProperty.name}</strong> の{CONTRACT_TYPES.find(t => t.value === contractType)?.label}を作成します</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header"><div className="card-title"><IconUser size={14} /> 契約者情報</div></div>
              <div className="card-body">
                <div className="form-group"><label className="form-label">氏名（法人名）<span className="required">*</span></label>
                  <input className="form-input" placeholder="山田 太郎" value={form.tenantName} onChange={e => setForm(f => ({ ...f, tenantName: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">メールアドレス<span className="required">*</span></label>
                  <input className="form-input" type="email" placeholder="taro@example.com" value={form.tenantEmail} onChange={e => setForm(f => ({ ...f, tenantEmail: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">電話番号</label>
                  <input className="form-input" placeholder="090-1234-5678" value={form.tenantPhone} onChange={e => setForm(f => ({ ...f, tenantPhone: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">現住所</label>
                  <input className="form-input" placeholder="東京都渋谷区..." value={form.tenantAddress} onChange={e => setForm(f => ({ ...f, tenantAddress: e.target.value }))} /></div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title"><IconContracts size={14} /> 契約条件</div></div>
              <div className="card-body">
                {contractType === 'lease' && (<>
                  <div className="form-group"><label className="form-label">月額賃料（円）<span className="required">*</span></label>
                    <input className="form-input" type="number" placeholder="150000" value={form.rent} onChange={e => setForm(f => ({ ...f, rent: e.target.value }))} /></div>
                  <div className="form-grid form-grid-2">
                    <div className="form-group"><label className="form-label">敷金（円）</label>
                      <input className="form-input" type="number" placeholder="300000" value={form.deposit} onChange={e => setForm(f => ({ ...f, deposit: e.target.value }))} /></div>
                    <div className="form-group"><label className="form-label">礼金（円）</label>
                      <input className="form-input" type="number" placeholder="150000" value={form.keyMoney} onChange={e => setForm(f => ({ ...f, keyMoney: e.target.value }))} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">管理費（円）</label>
                    <input className="form-input" type="number" placeholder="5000" value={form.managementFee} onChange={e => setForm(f => ({ ...f, managementFee: e.target.value }))} /></div>
                </>)}
                <div className="form-grid form-grid-2">
                  <div className="form-group"><label className="form-label">契約開始日<span className="required">*</span></label>
                    <input className="form-input" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">契約終了日</label>
                    <input className="form-input" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
                </div>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <div className="card-title"><IconSign size={14} /> 宅地建物取引士 情報</div>
              <div className="alert alert-warn" style={{ margin: 0, padding: '5px 10px', fontSize: 11 }}>
                <IconAlert size={11} /> 宅建士の電子署名・記名が法律上必須です
              </div>
            </div>
            <div className="card-body">
              <div className="form-grid form-grid-2">
                <div className="form-group"><label className="form-label">宅建士 氏名<span className="required">*</span></label>
                  <input className="form-input" placeholder="鈴木 一郎" value={form.agentName} onChange={e => setForm(f => ({ ...f, agentName: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">宅建士 免許番号<span className="required">*</span></label>
                  <input className="form-input" placeholder="東京都知事（3）第123456号" value={form.agentLicense} onChange={e => setForm(f => ({ ...f, agentLicense: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">特約事項</label>
                <textarea className="form-textarea" rows={4} placeholder="ペット飼育不可。原状回復費用については国土交通省ガイドラインに従う。..."
                  value={form.specialTerms} onChange={e => setForm(f => ({ ...f, specialTerms: e.target.value }))} /></div>
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}><IconBack size={14} /> 戻る</button>
            <button className="btn btn-gold btn-lg" disabled={!form.tenantName || !form.tenantEmail || isGenerating} onClick={handleGenerate}>
              {isGenerating ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>◌</span> AI生成中...</>
                : <><IconSparkle size={16} /> AI契約書を生成</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && selectedProperty && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
            <div>
              <div className="contract-preview">
                <h1>{CONTRACT_TYPES.find(t => t.value === contractType)?.label}</h1>
                <div className="contract-date">契約番号：{generateContractNo()}<br />作成日：{today}</div>
                <div className="contract-parties">
                  <div><div className="party-label">貸主（甲）</div><div className="party-name">{selectedProperty.owner}</div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{selectedProperty.ownerPhone}</div></div>
                  <div><div className="party-label">借主（乙）</div><div className="party-name">{form.tenantName || '（未入力）'}</div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{form.tenantEmail}</div></div>
                </div>
                <h2>第1条（目的・物件の表示）</h2>
                <p>甲は乙に対し、以下の物件を賃貸し、乙はこれを賃借する。</p>
                <table><tbody>
                  <tr><th>物件名称</th><td>{selectedProperty.name}</td></tr>
                  <tr><th>所在地</th><td>{selectedProperty.address}</td></tr>
                  <tr><th>種別・構造</th><td>{selectedProperty.type}</td></tr>
                  <tr><th>専有面積</th><td>{selectedProperty.area}㎡</td></tr>
                  <tr><th>間取り</th><td>{selectedProperty.rooms}</td></tr>
                  {selectedProperty.floor && <tr><th>所在階</th><td>{selectedProperty.floor}</td></tr>}
                </tbody></table>
                <h2>第2条（契約期間）</h2>
                <table><tbody>
                  <tr><th>契約開始日</th><td>{form.startDate ? new Date(form.startDate).toLocaleDateString('ja-JP') : '未設定'}</td></tr>
                  <tr><th>契約終了日</th><td>{form.endDate ? new Date(form.endDate).toLocaleDateString('ja-JP') : '2年間'}</td></tr>
                  <tr><th>契約種別</th><td>普通借家契約</td></tr>
                </tbody></table>
                {contractType === 'lease' && (<>
                  <h2>第3条（賃料・諸費用）</h2>
                  <table><tbody>
                    <tr><th>月額賃料</th><td><strong>{form.rent ? `${parseInt(form.rent).toLocaleString()}円` : selectedProperty.rent ? `${selectedProperty.rent.toLocaleString()}円` : '未設定'}</strong></td></tr>
                    {form.managementFee && <tr><th>共益費・管理費</th><td>{parseInt(form.managementFee).toLocaleString()}円/月</td></tr>}
                    <tr><th>敷金</th><td>{form.deposit ? `${parseInt(form.deposit).toLocaleString()}円` : '0円'}</td></tr>
                    <tr><th>礼金</th><td>{form.keyMoney ? `${parseInt(form.keyMoney).toLocaleString()}円` : '0円'}</td></tr>
                    <tr><th>支払日</th><td>毎月末日（翌月分前払い）</td></tr>
                  </tbody></table>
                </>)}
                <h2>第4条（使用目的）</h2>
                <p>乙は本物件を居住の用に供するためにのみ使用し、その他の目的には使用しないものとする。</p>
                <h2>第5条（禁止事項）</h2>
                <p>乙は甲の書面による承諾を得ることなく、以下の行為を行ってはならない。①本物件の転貸又は賃借権の譲渡　②本物件の増改築、修繕、模様替え　③ペット（動物）の飼育</p>
                <h2>第6条（原状回復）</h2>
                <p>乙は契約終了時に、国土交通省「原状回復をめぐるトラブルとガイドライン」に基づき、乙の故意・過失による損傷を原状回復するものとする。</p>
                {form.specialTerms && (<><h2>特約事項</h2><p style={{ whiteSpace: 'pre-wrap' }}>{form.specialTerms}</p></>)}
                <h2>宅地建物取引士 記名</h2>
                <table><tbody>
                  <tr><th>宅建士 氏名</th><td>{form.agentName || '未入力'}</td></tr>
                  <tr><th>免許番号</th><td>{form.agentLicense || '未入力'}</td></tr>
                  <tr><th>所属業者</th><td>（株）プロップサイン不動産</td></tr>
                </tbody></table>
                <div className="seal-area">
                  {['貸主', '借主', '宅建士'].map((lbl) => (
                    <div key={lbl} className="seal-box">
                      <div className="seal-circle"><span style={{ fontSize: 10 }}>{lbl}・署名欄</span></div>
                      <div className="seal-label">{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI panel */}
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div className="card-title"><IconSparkle size={14} color="var(--gold)" /> AIリーガルチェック</div>
                  {aiChecked && <span className="status-badge status-signed">完了</span>}
                </div>
                <div className="card-body">
                  <div className="alert alert-warn" style={{ marginBottom: 12 }}>
                    <IconAlert size={12} />
                    <span style={{ fontSize: 11 }}>AIの提案は参考情報です。最終判断は宅建士が行ってください。</span>
                  </div>
                  {(AI_SUGGESTIONS[contractType as keyof typeof AI_SUGGESTIONS] || AI_SUGGESTIONS.lease).map((s, i) => (
                    <div key={i} className={`alert ${s.type === 'ok' ? 'alert-success' : 'alert-warn'}`} style={{ marginBottom: 8 }}>
                      {s.type === 'ok' ? <IconCheck size={12} /> : <IconAlert size={12} />}
                      <span style={{ fontSize: 11 }}>{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header"><div className="card-title">送信設定</div></div>
                <div className="card-body">
                  <div className="form-group"><label className="form-label">署名依頼先メール</label>
                    <input className="form-input" value={form.tenantEmail} readOnly style={{ background: 'var(--earth-pale)' }} /></div>
                  <div className="form-group"><label className="form-label">署名タイプ</label>
                    <select className="form-select"><option>立会人型（メール認証）</option><option>当事者型（電子証明書）</option></select></div>
                  <div className="form-group"><label className="form-label">有効期限</label>
                    <select className="form-select"><option>7日間</option><option>14日間</option><option>30日間</option></select></div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked /> SMSでもリマインド送信
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-primary btn-lg w-full" onClick={handleSendRequest}>
                  <IconSend size={15} /> 署名依頼を送信
                </button>
                <button className="btn btn-outline w-full" onClick={handleDraftSave}>
                  <IconDownload size={14} /> 下書き保存
                </button>
                <button className="btn btn-ghost btn-sm w-full" onClick={() => setStep(2)}>
                  <IconBack size={13} /> 編集に戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <IconCheck size={30} color="white" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Shippori Mincho, serif', marginBottom: 8, color: 'var(--navy-deep)' }}>署名依頼を送信しました</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            {form.tenantName}様のメールアドレス（{form.tenantEmail}）へ<br />電子署名依頼メールを送信しました。
          </div>
          <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: 24 }}>
            <IconContracts size={14} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>次のステップ</div>
              <div style={{ fontSize: 12 }}>1. 相手方がメール内のリンクをクリック<br />2. 契約書を閲覧・確認<br />3. 電子署名の実施<br />4. タイムスタンプ付与・締結完了通知</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href="/contracts" className="btn btn-primary"><IconArrow size={14} /> 契約書一覧へ</a>
            <button className="btn btn-outline" onClick={() => {
              setStep(1); setSelectedProperty(null); setAiChecked(false);
              setForm({ tenantName: '', tenantEmail: '', tenantPhone: '', tenantAddress: '', rent: '', deposit: '', keyMoney: '', managementFee: '', startDate: '', endDate: '', agentName: '', agentLicense: '', specialTerms: '' });
            }}>別の契約を作成</button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
