'use client';
import { useState, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_PROPERTIES, formatCurrency } from '@/lib/data';
import type { Property } from '@/lib/data';
import { Upload, Building2, Plus, Search, Download, CheckCircle } from 'lucide-react';

const CSV_TEMPLATE = `物件名,住所,種別,面積,賃料,売買価格,間取り,階数,築年,オーナー,オーナーメール,オーナー電話
サンプルマンション 101号室,東京都新宿区西新宿1-1-1,マンション,35.5,85000,,1K,1階,2020年,山田 太郎,yamada@example.com,03-1234-5678
サンプル一戸建て,東京都世田谷区三軒茶屋2-2-2,一戸建て,90.0,,45000000,3LDK,,2015年,田中 花子,tanaka@example.com,090-9876-5432`;

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>(SAMPLE_PROPERTIES);
  const [search, setSearch] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [newProp, setNewProp] = useState({
    name: '', address: '', type: 'マンション', area: '', rent: '', price: '', rooms: '',
    floor: '', buildYear: '', owner: '', ownerEmail: '', ownerPhone: '',
  });

  const filtered = properties.filter(p =>
    !search || p.name.includes(search) || p.address.includes(search) || p.owner.includes(search)
  );

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
          id: `import-${Date.now()}-${i}`,
          name: obj['物件名'] || `物件${i + 1}`,
          address: obj['住所'] || '',
          type: obj['種別'] || 'マンション',
          area: parseFloat(obj['面積'] || '0'),
          rent: obj['賃料'] ? parseInt(obj['賃料']) : undefined,
          price: obj['売買価格'] ? parseInt(obj['売買価格']) : undefined,
          rooms: obj['間取り'] || '',
          floor: obj['階数'] || '',
          buildYear: obj['築年'] || '',
          owner: obj['オーナー'] || '',
          ownerEmail: obj['オーナーメール'] || '',
          ownerPhone: obj['オーナー電話'] || '',
        };
      });
      setProperties(prev => [...prev, ...parsed]);
      setUploadMsg(`✓ ${parsed.length}件の物件をインポートしました`);
      setTimeout(() => setUploadMsg(''), 4000);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const downloadTemplate = () => {
    const blob = new Blob(['\uFEFF' + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'property_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const addProperty = () => {
    const prop: Property = {
      id: `manual-${Date.now()}`,
      name: newProp.name,
      address: newProp.address,
      type: newProp.type,
      area: parseFloat(newProp.area) || 0,
      rent: newProp.rent ? parseInt(newProp.rent) : undefined,
      price: newProp.price ? parseInt(newProp.price) : undefined,
      rooms: newProp.rooms,
      floor: newProp.floor,
      buildYear: newProp.buildYear,
      owner: newProp.owner,
      ownerEmail: newProp.ownerEmail,
      ownerPhone: newProp.ownerPhone,
    };
    setProperties(prev => [prop, ...prev]);
    setShowModal(false);
    setNewProp({ name: '', address: '', type: 'マンション', area: '', rent: '', price: '', rooms: '', floor: '', buildYear: '', owner: '', ownerEmail: '', ownerPhone: '' });
  };

  return (
    <AppLayout title="物件管理">
      {/* Header actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="物件名・住所・オーナー検索..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-outline btn-sm" onClick={downloadTemplate}>
          <Download size={14} /> CSVテンプレート
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> CSVインポート
        </button>
        <input type="file" ref={fileRef} accept=".csv" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleCSV(f); }} />
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> 物件追加
        </button>
      </div>

      {uploadMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={14} /> {uploadMsg}
        </div>
      )}

      {/* CSV Upload zone */}
      <div
        className={`upload-zone ${dragOver ? 'dragover' : ''}`}
        style={{ marginBottom: 20 }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCSV(f); }}
        onClick={() => fileRef.current?.click()}
      >
        <div className="upload-icon"><Upload size={22} /></div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>物件CSVをドロップしてインポート</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          物件名,住所,種別,面積,賃料,売買価格,間取り,階数,築年,オーナー,オーナーメール,オーナー電話
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CSVインポート後、契約書作成画面で物件情報を自動挿入できます</div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">登録物件数</div>
          <div className="stat-value">{properties.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">賃貸物件</div>
          <div className="stat-value">{properties.filter(p => p.rent).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">売買物件</div>
          <div className="stat-value">{properties.filter(p => p.price && !p.rent).length}</div>
        </div>
        <div className="stat-card navy">
          <div className="stat-label">検索結果</div>
          <div className="stat-value">{filtered.length}</div>
          <div className="stat-sub">件</div>
        </div>
      </div>

      {/* Property grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map((prop) => (
          <div key={prop.id} className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}>
            <div style={{
              background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{ fontSize: 32 }}>{prop.type === '一戸建て' ? '🏡' : '🏢'}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{prop.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{prop.type}</div>
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>📍 {prop.address}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {[
                  prop.area + '㎡',
                  prop.rooms,
                  prop.floor,
                  prop.buildYear && `築${prop.buildYear}`,
                ].filter(Boolean).map((tag, i) => (
                  <span key={i} style={{ fontSize: 11, background: 'var(--bg-base)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                    {tag}
                  </span>
                ))}
              </div>
              {prop.rent && (
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
                  {formatCurrency(prop.rent)}<span style={{ fontSize: 12, fontWeight: 400 }}>/月</span>
                </div>
              )}
              {prop.price && !prop.rent && (
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
                  {formatCurrency(prop.price)}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                👤 {prop.owner} | {prop.ownerPhone}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Building2 size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>物件が見つかりません</div>
        </div>
      )}

      {/* Add property modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">物件を追加</div>
              <button className="btn btn-icon btn-outline" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">物件名<span className="required">*</span></label>
                  <input className="form-input" placeholder="グランドハイツ渋谷 301号室" value={newProp.name}
                    onChange={e => setNewProp(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">住所<span className="required">*</span></label>
                  <input className="form-input" placeholder="東京都渋谷区道玄坂2-10-12" value={newProp.address}
                    onChange={e => setNewProp(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">種別</label>
                  <select className="form-select" value={newProp.type} onChange={e => setNewProp(p => ({ ...p, type: e.target.value }))}>
                    <option>マンション</option><option>一戸建て</option><option>土地</option><option>事務所</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">面積（㎡）</label>
                  <input className="form-input" type="number" placeholder="45.5" value={newProp.area}
                    onChange={e => setNewProp(p => ({ ...p, area: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">月額賃料（円）</label>
                  <input className="form-input" type="number" placeholder="120000" value={newProp.rent}
                    onChange={e => setNewProp(p => ({ ...p, rent: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">売買価格（円）</label>
                  <input className="form-input" type="number" placeholder="45000000" value={newProp.price}
                    onChange={e => setNewProp(p => ({ ...p, price: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">間取り</label>
                  <input className="form-input" placeholder="1LDK" value={newProp.rooms}
                    onChange={e => setNewProp(p => ({ ...p, rooms: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">築年</label>
                  <input className="form-input" placeholder="2020年" value={newProp.buildYear}
                    onChange={e => setNewProp(p => ({ ...p, buildYear: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">オーナー名</label>
                  <input className="form-input" placeholder="山田 太郎" value={newProp.owner}
                    onChange={e => setNewProp(p => ({ ...p, owner: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">オーナーメール</label>
                  <input className="form-input" type="email" placeholder="owner@example.com" value={newProp.ownerEmail}
                    onChange={e => setNewProp(p => ({ ...p, ownerEmail: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>キャンセル</button>
              <button className="btn btn-primary" disabled={!newProp.name || !newProp.address} onClick={addProperty}>
                追加する
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
