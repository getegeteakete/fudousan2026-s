'use client';
import { useState, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_PROPERTIES, formatCurrency } from '@/lib/data';
import type { Property } from '@/lib/data';
import {
  Upload, FileSpreadsheet, Building2, User, FileText,
  CheckCircle, Sparkles, AlertCircle, ChevronRight, X
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1, label: '物件選択' },
  { num: 2, label: '契約情報入力' },
  { num: 3, label: '契約書プレビュー' },
  { num: 4, label: '完了' },
];

const AI_SUGGESTIONS = {
  lease: [
    { type: 'warn', text: '礼金の記載について：礼金0円の場合、消費者保護の観点から特約事項に明記することを推奨します。' },
    { type: 'ok', text: '契約期間：2年間（普通借家）- 正常な範囲です。' },
    { type: 'ok', text: '解約予告期間：1ヶ月前通知 - 宅建業法に準拠しています。' },
    { type: 'warn', text: '原状回復：国土交通省ガイドライン準拠の文言追加を推奨します。' },
  ],
  sale: [
    { type: 'ok', text: '手付金：売買代金の5%以内 - 適正範囲内です。' },
    { type: 'warn', text: '瑕疵担保責任：引渡し後3ヶ月の記載がありません。追加を推奨します。' },
    { type: 'ok', text: '重要事項説明書：36条・37条書面 - 形式要件を満たしています。' },
  ],
  mediation: [
    { type: 'ok', text: '仲介手数料：賃料1ヶ月分（税別）- 法定上限内です。' },
    { type: 'ok', text: '媒介契約期間：3ヶ月 - 標準的な期間です。' },
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
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    tenantAddress: '',
    rent: '',
    deposit: '',
    keyMoney: '',
    managementFee: '',
    startDate: '',
    endDate: '',
    agentName: '',
    agentLicense: '',
    specialTerms: '',
  });

  const allProperties = [...SAMPLE_PROPERTIES, ...csvProperties];

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
          id: `csv-${i}`,
          name: obj['物件名'] || obj['name'] || `物件${i + 1}`,
          address: obj['住所'] || obj['address'] || '',
          type: obj['種別'] || obj['type'] || 'マンション',
          area: parseFloat(obj['面積'] || obj['area'] || '0'),
          rent: parseInt(obj['賃料'] || obj['rent'] || '0'),
          price: parseInt(obj['売買価格'] || obj['price'] || '0'),
          rooms: obj['間取り'] || obj['rooms'] || '',
          floor: obj['階数'] || obj['floor'] || '',
          buildYear: obj['築年'] || obj['buildYear'] || '',
          owner: obj['オーナー'] || obj['owner'] || '',
          ownerEmail: obj['オーナーメール'] || obj['ownerEmail'] || '',
          ownerPhone: obj['オーナー電話'] || obj['ownerPhone'] || '',
        };
      });
      setCsvProperties(parsed);
      setShowCsvPreview(true);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleSelectProperty = (prop: Property) => {
    setSelectedProperty(prop);
    // Auto-fill form from property
    if (prop.rent) setForm(f => ({ ...f, rent: prop.rent!.toString(), deposit: (prop.rent! * 2).toString() }));
    if (prop.price) setForm(f => ({ ...f, deposit: Math.floor(prop.price! * 0.1).toString() }));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setAiChecked(true);
      setStep(3);
    }, 2000);
  };

  const generateContractNo = () => {
    const d = new Date();
    return `PS-${d.getFullYear()}-${String(SAMPLE_PROPERTIES.length + csvProperties.length + 5).padStart(4, '0')}`;
  };

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <AppLayout title="新規契約作成">
      {/* Steps */}
      <div className="steps" style={{ marginBottom: 24 }}>
        {STEPS.map((s) => (
          <div key={s.num} className={`step ${step > s.num ? 'done' : step === s.num ? 'active' : ''}`}>
            <div className="step-num">
              {step > s.num ? <CheckCircle size={14} /> : s.num}
            </div>
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Property Selection */}
      {step === 1 && (
        <div>
          {/* Contract type */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">契約種別を選択</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { value: 'lease', label: '賃貸借契約書', sub: '賃貸借・更新・解約', icon: '🏠' },
                  { value: 'sale', label: '売買契約書', sub: '不動産売買・引渡し', icon: '🏢' },
                  { value: 'mediation', label: '媒介契約書', sub: '一般・専任・専属専任', icon: '🤝' },
                  { value: 'management', label: '管理委託契約書', sub: '賃貸管理・サブリース', icon: '📋' },
                ].map((t) => (
                  <div
                    key={t.value}
                    onClick={() => setContractType(t.value)}
                    style={{
                      border: `2px solid ${contractType === t.value ? 'var(--navy)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      padding: '16px',
                      cursor: 'pointer',
                      background: contractType === t.value ? '#eef2ff' : 'white',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CSV Upload */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">
                <FileSpreadsheet size={15} style={{ display: 'inline', marginRight: 6 }} />
                CSVから物件をインポート
              </div>
            </div>
            <div className="card-body">
              <div
                className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                style={{ marginBottom: 12 }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleCSV(f);
                }}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileRef}
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSV(f); }}
                />
                <div className="upload-icon"><Upload size={22} /></div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>CSVファイルをドロップ</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  物件名,住所,種別,面積,賃料,間取り,オーナー,オーナーメール
                </div>
                <button className="btn btn-outline btn-sm">ファイルを選択</button>
              </div>

              {csvProperties.length > 0 && (
                <div className="alert alert-success">
                  <CheckCircle size={14} />
                  {csvProperties.length}件の物件をCSVから読み込みました
                </div>
              )}

              {showCsvPreview && csvProperties.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
                    CSVプレビュー（インポートされた物件）
                  </div>
                  <div className="csv-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>物件名</th>
                          <th>住所</th>
                          <th>種別</th>
                          <th>面積</th>
                          <th>賃料/価格</th>
                          <th>間取り</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvProperties.slice(0, 5).map((p) => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td>{p.address}</td>
                            <td>{p.type}</td>
                            <td>{p.area}㎡</td>
                            <td>{p.rent ? formatCurrency(p.rent) : p.price ? formatCurrency(p.price) : '-'}</td>
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
              <div className="card-title">
                <Building2 size={15} style={{ display: 'inline', marginRight: 6 }} />
                物件を選択
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{allProperties.length}件</span>
            </div>
            <div>
              {allProperties.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => handleSelectProperty(prop)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selectedProperty?.id === prop.id ? '#eef2ff' : 'white',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: selectedProperty?.id === prop.id ? 'var(--navy)' : 'var(--bg-base)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {prop.type === '一戸建て' ? '🏡' : '🏢'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{prop.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{prop.address}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {prop.area}㎡ / {prop.rooms}
                      {prop.floor && ` / ${prop.floor}`}
                      {prop.buildYear && ` / 築${prop.buildYear}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {prop.rent && (
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)' }}>
                        {formatCurrency(prop.rent)}<span style={{ fontSize: 11, fontWeight: 400 }}>/月</span>
                      </div>
                    )}
                    {prop.price && (
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)' }}>
                        {formatCurrency(prop.price)}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{prop.type}</div>
                  </div>
                  {selectedProperty?.id === prop.id && (
                    <CheckCircle size={18} style={{ color: 'var(--green-ok)', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary btn-lg"
              disabled={!selectedProperty}
              onClick={() => setStep(2)}
            >
              次へ：契約情報入力 <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Contract Details */}
      {step === 2 && selectedProperty && (
        <div>
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <Building2 size={14} />
            <div>
              <strong>{selectedProperty.name}</strong> の{
                contractType === 'lease' ? '賃貸借契約書' :
                contractType === 'sale' ? '売買契約書' : '契約書'
              }を作成します
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Tenant info */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><User size={14} style={{ display: 'inline', marginRight: 6 }} />契約者情報</div>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">氏名（法人名）<span className="required">*</span></label>
                  <input className="form-input" placeholder="山田 太郎" value={form.tenantName}
                    onChange={e => setForm(f => ({ ...f, tenantName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">メールアドレス<span className="required">*</span></label>
                  <input className="form-input" type="email" placeholder="taro@example.com" value={form.tenantEmail}
                    onChange={e => setForm(f => ({ ...f, tenantEmail: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">電話番号</label>
                  <input className="form-input" placeholder="090-1234-5678" value={form.tenantPhone}
                    onChange={e => setForm(f => ({ ...f, tenantPhone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">現住所</label>
                  <input className="form-input" placeholder="東京都渋谷区..." value={form.tenantAddress}
                    onChange={e => setForm(f => ({ ...f, tenantAddress: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Contract terms */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><FileText size={14} style={{ display: 'inline', marginRight: 6 }} />契約条件</div>
              </div>
              <div className="card-body">
                {contractType === 'lease' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">月額賃料（円）<span className="required">*</span></label>
                      <input className="form-input" type="number" placeholder="150000" value={form.rent}
                        onChange={e => setForm(f => ({ ...f, rent: e.target.value }))} />
                    </div>
                    <div className="form-grid form-grid-2">
                      <div className="form-group">
                        <label className="form-label">敷金（円）</label>
                        <input className="form-input" type="number" placeholder="300000" value={form.deposit}
                          onChange={e => setForm(f => ({ ...f, deposit: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">礼金（円）</label>
                        <input className="form-input" type="number" placeholder="150000" value={form.keyMoney}
                          onChange={e => setForm(f => ({ ...f, keyMoney: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">管理費（円）</label>
                      <input className="form-input" type="number" placeholder="5000" value={form.managementFee}
                        onChange={e => setForm(f => ({ ...f, managementFee: e.target.value }))} />
                    </div>
                  </>
                )}
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">契約開始日<span className="required">*</span></label>
                    <input className="form-input" type="date" value={form.startDate}
                      onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">契約終了日</label>
                    <input className="form-input" type="date" value={form.endDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agent info */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <div className="card-title">宅地建物取引士 情報</div>
              <div className="alert alert-warn" style={{ margin: 0, padding: '6px 12px', fontSize: 12 }}>
                <AlertCircle size={12} />
                宅建士の電子署名・記名が法律上必須です
              </div>
            </div>
            <div className="card-body">
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">宅建士 氏名<span className="required">*</span></label>
                  <input className="form-input" placeholder="鈴木 一郎" value={form.agentName}
                    onChange={e => setForm(f => ({ ...f, agentName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">宅建士 免許番号<span className="required">*</span></label>
                  <input className="form-input" placeholder="東京都知事（3）第123456号" value={form.agentLicense}
                    onChange={e => setForm(f => ({ ...f, agentLicense: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">特約事項</label>
                <textarea className="form-textarea" rows={4} placeholder="ペット飼育不可。原状回復費用については国土交通省ガイドラインに従う。..."
                  value={form.specialTerms}
                  onChange={e => setForm(f => ({ ...f, specialTerms: e.target.value }))} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← 戻る</button>
            <button
              className="btn btn-gold btn-lg"
              disabled={!form.tenantName || !form.tenantEmail || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                  AI生成中...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> AI契約書を生成
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && selectedProperty && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
            {/* Contract preview */}
            <div>
              <div className="contract-preview">
                <h1>
                  {contractType === 'lease' ? '賃貸借契約書' :
                   contractType === 'sale' ? '不動産売買契約書' :
                   contractType === 'mediation' ? '媒介契約書' : '管理委託契約書'}
                </h1>
                <div className="contract-date">
                  契約番号：{generateContractNo()}<br />
                  作成日：{today}
                </div>

                <div className="contract-parties">
                  <div className="party-box">
                    <div className="party-label">貸主（甲）</div>
                    <div className="party-name">{selectedProperty.owner}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {selectedProperty.ownerPhone}
                    </div>
                  </div>
                  <div className="party-box">
                    <div className="party-label">借主（乙）</div>
                    <div className="party-name">{form.tenantName || '（未入力）'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {form.tenantEmail}
                    </div>
                  </div>
                </div>

                <h2>第1条（目的・物件の表示）</h2>
                <p>甲は乙に対し、以下の物件を賃貸し、乙はこれを賃借する。</p>
                <table>
                  <tbody>
                    <tr><th>物件名称</th><td>{selectedProperty.name}</td></tr>
                    <tr><th>所在地</th><td>{selectedProperty.address}</td></tr>
                    <tr><th>種別・構造</th><td>{selectedProperty.type}</td></tr>
                    <tr><th>専有面積</th><td>{selectedProperty.area}㎡</td></tr>
                    <tr><th>間取り</th><td>{selectedProperty.rooms}</td></tr>
                    {selectedProperty.floor && <tr><th>所在階</th><td>{selectedProperty.floor}</td></tr>}
                  </tbody>
                </table>

                <h2>第2条（契約期間）</h2>
                <table>
                  <tbody>
                    <tr><th>契約開始日</th><td>{form.startDate ? new Date(form.startDate).toLocaleDateString('ja-JP') : '未設定'}</td></tr>
                    <tr><th>契約終了日</th><td>{form.endDate ? new Date(form.endDate).toLocaleDateString('ja-JP') : '2年間'}</td></tr>
                    <tr><th>契約種別</th><td>普通借家契約</td></tr>
                  </tbody>
                </table>

                {contractType === 'lease' && (
                  <>
                    <h2>第3条（賃料・諸費用）</h2>
                    <table>
                      <tbody>
                        <tr><th>月額賃料</th><td><strong>{form.rent ? `${parseInt(form.rent).toLocaleString()}円` : selectedProperty.rent ? `${selectedProperty.rent.toLocaleString()}円` : '未設定'}</strong></td></tr>
                        {form.managementFee && <tr><th>共益費・管理費</th><td>{parseInt(form.managementFee).toLocaleString()}円/月</td></tr>}
                        <tr><th>敷金</th><td>{form.deposit ? `${parseInt(form.deposit).toLocaleString()}円` : '0円'}</td></tr>
                        <tr><th>礼金</th><td>{form.keyMoney ? `${parseInt(form.keyMoney).toLocaleString()}円` : '0円'}</td></tr>
                        <tr><th>支払日</th><td>毎月末日（翌月分前払い）</td></tr>
                      </tbody>
                    </table>
                  </>
                )}

                <h2>第4条（使用目的）</h2>
                <p>乙は本物件を居住の用に供するためにのみ使用し、その他の目的には使用しないものとする。</p>

                <h2>第5条（禁止事項）</h2>
                <p>乙は甲の書面による承諾を得ることなく、以下の行為を行ってはならない。</p>
                <p>①本物件の転貸又は賃借権の譲渡　②本物件の増改築、修繕、模様替え　③ペット（動物）の飼育　④危険物・異臭の持ち込み</p>

                <h2>第6条（原状回復）</h2>
                <p>乙は契約終了時に、国土交通省「原状回復をめぐるトラブルとガイドライン」に基づき、乙の故意・過失による損傷を原状回復するものとする。</p>

                {form.specialTerms && (
                  <>
                    <h2>特約事項</h2>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{form.specialTerms}</p>
                  </>
                )}

                <h2>宅地建物取引士 記名</h2>
                <table>
                  <tbody>
                    <tr><th>宅建士 氏名</th><td>{form.agentName || '未入力'}</td></tr>
                    <tr><th>免許番号</th><td>{form.agentLicense || '未入力'}</td></tr>
                    <tr><th>所属業者</th><td>（株）プロップサイン不動産</td></tr>
                  </tbody>
                </table>

                <div className="seal-area">
                  <div className="seal-box">
                    <div className="seal-circle">
                      <span style={{ fontSize: 10 }}>甲・署名欄</span>
                    </div>
                    <div className="seal-label">貸主</div>
                  </div>
                  <div className="seal-box">
                    <div className="seal-circle">
                      <span style={{ fontSize: 10 }}>乙・署名欄</span>
                    </div>
                    <div className="seal-label">借主</div>
                  </div>
                  <div className="seal-box">
                    <div className="seal-circle">
                      <span style={{ fontSize: 10 }}>宅建士</span>
                    </div>
                    <div className="seal-label">宅建士</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Check panel */}
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} style={{ color: '#7c3aed' }} />
                    AIリーガルチェック
                  </div>
                  {aiChecked && <span className="status-badge status-signed">チェック完了</span>}
                </div>
                <div className="card-body">
                  <div className="alert alert-warn" style={{ marginBottom: 12 }}>
                    <AlertCircle size={12} />
                    <span style={{ fontSize: 11 }}>AIの提案は参考情報です。最終判断は宅建士が行ってください。</span>
                  </div>
                  {(AI_SUGGESTIONS[contractType as keyof typeof AI_SUGGESTIONS] || AI_SUGGESTIONS.lease).map((s, i) => (
                    <div key={i} className={`alert ${s.type === 'ok' ? 'alert-success' : 'alert-warn'}`} style={{ marginBottom: 8 }}>
                      {s.type === 'ok' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      <span style={{ fontSize: 11 }}>{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div className="card-title">送信設定</div>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">署名依頼先メール</label>
                    <input className="form-input" value={form.tenantEmail} readOnly style={{ background: '#f7f8fc' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">署名タイプ</label>
                    <select className="form-select">
                      <option>立会人型（メール認証）</option>
                      <option>当事者型（電子証明書）</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">有効期限</label>
                    <select className="form-select">
                      <option>7日間</option>
                      <option>14日間</option>
                      <option>30日間</option>
                    </select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked />
                    SMSでもリマインド送信
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-primary btn-lg w-full" onClick={() => setStep(4)}>
                  📧 署名依頼を送信
                </button>
                <button className="btn btn-outline w-full">
                  💾 下書き保存
                </button>
                <button className="btn btn-outline btn-sm w-full" onClick={() => setStep(2)}>
                  ← 編集に戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <div style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--green-ok)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 20px',
          }}>✓</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>署名依頼を送信しました</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            {form.tenantName}様のメールアドレス（{form.tenantEmail}）へ<br />
            電子署名依頼メールを送信しました。
          </div>
          <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: 24 }}>
            <CheckCircle size={14} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>次のステップ</div>
              <div style={{ fontSize: 12 }}>
                1. 相手方がメール内のリンクをクリック<br />
                2. 契約書を閲覧・確認<br />
                3. 電子署名の実施<br />
                4. タイムスタンプ付与・締結完了通知
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href="/contracts" className="btn btn-primary">契約書一覧へ</a>
            <button className="btn btn-outline" onClick={() => {
              setStep(1);
              setSelectedProperty(null);
              setAiChecked(false);
              setForm({ tenantName: '', tenantEmail: '', tenantPhone: '', tenantAddress: '', rent: '', deposit: '', keyMoney: '', managementFee: '', startDate: '', endDate: '', agentName: '', agentLicense: '', specialTerms: '' });
            }}>
              別の契約を作成
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
