'use client';
import { useState, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_PROPERTIES, formatCurrency } from '@/lib/data';
import type { Property } from '@/lib/data';
import Link from 'next/link';
import { IconUpload, IconProperties, IconPlus, IconSearch, IconDownload, IconCheck, IconNewContract } from '@/components/Icons';

function PropIcon({ type }: { type: string }) {
  if (type === '一戸建て') return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10L12 3L21 10" /><path d="M5 10V21H9V15H15V21H19V10" />
    </svg>
  );
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M8 6H10" /><path d="M14 6H16" /><path d="M8 10H10" /><path d="M14 10H16" />
      <path d="M8 14H10" /><path d="M14 14H16" /><path d="M10 22V17H14V22" />
    </svg>
  );
}

export default function PropertiesPage() {
  const [csvProperties, setCsvProperties] = useState<Property[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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

  const allProperties = [...SAMPLE_PROPERTIES, ...csvProperties];
  const filtered = allProperties.filter(p => !search || p.name.includes(search) || p.address.includes(search));

  return (
    <AppLayout title="物件管理">
      {/* CSV Upload */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title"><IconUpload size={15} /> CSVバルクインポート</div>
          <button className="btn btn-outline btn-sm"><IconDownload size={13} /> テンプレートDL</button>
        </div>
        <div className="card-body">
          <div className={`upload-zone`} style={{ marginBottom: showCsvPreview ? 16 : 0 }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCSV(f); }}
            onClick={() => fileRef.current?.click()}>
            <input type="file" ref={fileRef} accept=".csv" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSV(f); }} />
            <div className="upload-icon"><IconUpload size={22} color="var(--gold-light)" /></div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>CSVファイルをドロップ</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              物件名,住所,種別,面積,賃料,売買価格,間取り,階数,築年,オーナー,オーナーメール,オーナー電話
            </div>
            <button className="btn btn-outline btn-sm">ファイルを選択</button>
          </div>
          {csvProperties.length > 0 && (
            <div className="alert alert-success">
              <IconCheck size={13} /> {csvProperties.length}件の物件をCSVから読み込みました
            </div>
          )}
          {showCsvPreview && csvProperties.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-sub)' }}>インポートプレビュー</div>
              <div className="csv-table-wrap">
                <table className="data-table">
                  <thead><tr><th>物件名</th><th>住所</th><th>種別</th><th>面積</th><th>賃料/価格</th><th>間取り</th><th>オーナー</th></tr></thead>
                  <tbody>
                    {csvProperties.slice(0, 10).map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td><td>{p.address}</td><td>{p.type}</td>
                        <td>{p.area}㎡</td><td>{p.rent ? formatCurrency(p.rent) : p.price ? formatCurrency(p.price) : '-'}</td>
                        <td>{p.rooms}</td><td>{p.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm"><IconCheck size={13} /> {csvProperties.length}件を登録する</button>
                <button className="btn btn-outline btn-sm" onClick={() => { setCsvProperties([]); setShowCsvPreview(false); }}>キャンセル</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property list */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}><IconSearch size={14} /></span>
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="物件名・住所で検索..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length}件</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map((prop) => (
          <div key={prop.id} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--navy-deep) 0%, var(--navy-light) 100%)', padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(184,148,74,0.15)', border: '1px solid rgba(184,148,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PropIcon type={prop.type} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 3, fontFamily: 'Shippori Mincho, serif' }}>{prop.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{prop.address}</div>
              </div>
            </div>
            <div className="card-body" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: '種別', value: prop.type },
                  { label: '面積', value: `${prop.area}㎡` },
                  { label: '間取り', value: prop.rooms || '-' },
                  { label: '階数', value: prop.floor || '-' },
                  { label: '築年', value: prop.buildYear ? `築${prop.buildYear}` : '-' },
                  { label: 'オーナー', value: prop.owner || '-' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {(prop.rent || prop.price) && (
                <div style={{ padding: '8px 12px', background: 'var(--earth-pale)', borderRadius: 'var(--radius)', marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{prop.rent ? '賃料' : '売買価格'}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>
                    {prop.rent ? formatCurrency(prop.rent) : formatCurrency(prop.price!)}
                  </span>
                  {prop.rent && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/月</span>}
                </div>
              )}
              <Link href="/contracts/new" className="btn btn-primary btn-sm w-full">
                <IconNewContract size={13} /> この物件で契約作成
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
