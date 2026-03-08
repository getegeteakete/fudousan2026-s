'use client';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_PROPERTIES, formatCurrency } from '@/lib/data';
import type { Property } from '@/lib/data';
import { IconUpload, IconProperties, IconPlus, IconSearch, IconDownload, IconCheck, IconNewContract, IconAlert } from '@/components/Icons';
import { getLocalProperties, saveLocalProperties } from '@/lib/store';

export default function PropertiesPage() {
  const [csvProperties, setCsvProperties] = useState<Property[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState(false);
  const [allProps, setAllProps] = useState<Property[]>([]);
  const [csvError, setCsvError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const local = getLocalProperties();
    const localIds = new Set(local.map(p=>p.id));
    setAllProps([...local, ...SAMPLE_PROPERTIES.filter(p=>!localIds.has(p.id))]);
  }, []);

  const handleCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { setCsvError('CSVの形式が正しくありません（ヘッダー行+データ行が必要です）'); return; }
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,''));
      const parsed: Property[] = lines.slice(1).map((line, i) => {
        const vals = line.split(',').map(v => v.trim().replace(/"/g,''));
        const obj: Record<string,string> = {};
        headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
        return {
          id: `csv-${Date.now()}-${i}`,
          name: obj['物件名'] || `物件${i+1}`,
          address: obj['住所'] || obj['所在地'] || '',
          type: obj['種別'] || obj['タイプ'] || 'マンション',
          area: parseFloat(obj['面積'] || obj['専有面積'] || '0'),
          rent: obj['賃料'] ? parseInt(obj['賃料'].replace(/[^0-9]/g,'')) : undefined,
          price: obj['売買価格'] ? parseInt(obj['売買価格'].replace(/[^0-9]/g,'')) : undefined,
          rooms: obj['間取り'] || '',
          floor: obj['階数'] || '',
          buildYear: obj['築年'] || obj['築年数'] || '',
          owner: obj['オーナー'] || obj['貸主'] || '',
          ownerEmail: obj['オーナーメール'] || obj['メール'] || '',
          ownerPhone: obj['オーナー電話'] || obj['電話'] || '',
        };
      }).filter(p => p.name && p.name !== '物件0');
      setCsvProperties(parsed);
      setShowCsvPreview(true);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImportConfirm = () => {
    saveLocalProperties(csvProperties);
    const local = getLocalProperties();
    const localIds = new Set(local.map(p=>p.id));
    setAllProps([...local, ...SAMPLE_PROPERTIES.filter(p=>!localIds.has(p.id))]);
    setCsvProperties([]);
    setShowCsvPreview(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const filtered = allProps.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q);
  });

  return (
    <AppLayout title="物件管理">
      {csvError && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{csvError}</div>}
      {saved && <div className="alert alert-success" style={{marginBottom:16}}><IconCheck size={14}/> {csvProperties.length||''}件の物件をインポートしました</div>}

      {/* CSV インポート */}
      <div className="card" style={{marginBottom:20}}>
        <div className="card-header">
          <div className="card-title"><IconUpload size={15}/> CSVバルクインポート</div>
          <a href="#" onClick={e=>{e.preventDefault();
            const csv = '物件名,住所,種別,面積,賃料,間取り,築年,オーナー,オーナーメール,オーナー電話\nサンプル物件,東京都渋谷区1-1,マンション,45.5,120000,1LDK,2020年,山田太郎,yamada@example.com,090-1234-5678';
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv'})); a.download='物件インポートサンプル.csv'; a.click();
          }} style={{fontSize:12,color:'var(--blue)'}}>
            サンプルCSVをダウンロード
          </a>
        </div>
        <div className="card-body">
          <div
            style={{border:`2px dashed ${dragOver?'var(--gold)':'var(--border)'}`,borderRadius:'var(--radius-lg)',padding:32,textAlign:'center',cursor:'pointer',background:dragOver?'rgba(184,148,74,0.04)':'transparent',transition:'all 0.2s'}}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)handleCSV(f);}}
            onClick={()=>fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}}
              onChange={e=>{const f=e.target.files?.[0];if(f)handleCSV(f);e.target.value='';}}/>
            <IconUpload size={28} color="var(--text-muted)"/>
            <div style={{marginTop:8,fontSize:13,color:'var(--text-muted)'}}>CSVファイルをドラッグ＆ドロップ、またはクリックして選択</div>
            <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>物件名・住所・賃料・オーナー情報などを一括登録できます</div>
          </div>

          {showCsvPreview && csvProperties.length > 0 && (
            <div style={{marginTop:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{fontWeight:700,fontSize:13}}>{csvProperties.length}件のプレビュー</div>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn btn-outline btn-sm" onClick={()=>{setCsvProperties([]);setShowCsvPreview(false);}}>キャンセル</button>
                  <button className="btn btn-primary btn-sm" onClick={handleImportConfirm}><IconCheck size={13}/> インポート確定</button>
                </div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table className="data-table">
                  <thead><tr><th>物件名</th><th>住所</th><th>種別</th><th>面積</th><th>賃料</th><th>オーナー</th></tr></thead>
                  <tbody>
                    {csvProperties.slice(0,10).map((p,i)=>(
                      <tr key={i}>
                        <td style={{fontWeight:600,fontSize:12}}>{p.name}</td>
                        <td style={{fontSize:12}}>{p.address}</td>
                        <td><span className="status-badge">{p.type}</span></td>
                        <td style={{fontSize:12}}>{p.area}㎡</td>
                        <td style={{fontFamily:'monospace',fontSize:12}}>{p.rent?formatCurrency(p.rent):'—'}</td>
                        <td style={{fontSize:12}}>{p.owner}</td>
                      </tr>
                    ))}
                    {csvProperties.length>10&&<tr><td colSpan={6} style={{textAlign:'center',fontSize:12,color:'var(--text-muted)'}}>他{csvProperties.length-10}件…</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 物件一覧 */}
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
        <div style={{position:'relative',flex:1}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',display:'flex'}}><IconSearch size={14}/></span>
          <input className="form-input" style={{paddingLeft:32}} placeholder="物件名・住所・オーナーで検索…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <span style={{fontSize:12,color:'var(--text-muted)',whiteSpace:'nowrap'}}>{filtered.length}件</span>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
        {filtered.map(prop => (
          <div key={prop.id} className="card" style={{cursor:'pointer',transition:'box-shadow 0.2s'}}
            onMouseEnter={e=>(e.currentTarget.style.boxShadow='var(--shadow-hover)')}
            onMouseLeave={e=>(e.currentTarget.style.boxShadow='')}>
            <div className="card-body">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700,lineHeight:1.4}}>{prop.name}</div>
                <span className="status-badge" style={{background:'var(--earth-pale)',color:'var(--navy)',flexShrink:0,marginLeft:8}}>{prop.type}</span>
              </div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:10}}>{prop.address}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10,fontSize:12}}>
                <div><span style={{color:'var(--text-muted)'}}>面積</span> {prop.area}㎡</div>
                <div><span style={{color:'var(--text-muted)'}}>間取り</span> {prop.rooms||'—'}</div>
                {prop.rent && <div style={{gridColumn:'1/-1'}}><span style={{color:'var(--text-muted)'}}>賃料</span> <strong style={{color:'var(--navy)'}}>{formatCurrency(prop.rent)}</strong><span style={{fontSize:10,color:'var(--text-muted)'}}>/月</span></div>}
                {prop.price && <div style={{gridColumn:'1/-1'}}><span style={{color:'var(--text-muted)'}}>売買価格</span> <strong style={{color:'var(--navy)'}}>{formatCurrency(prop.price)}</strong></div>}
              </div>
              <div style={{borderTop:'1px solid var(--border)',paddingTop:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>{prop.owner||'オーナー未設定'}</div>
                <a href={`/contracts/new?propertyId=${prop.id}`} className="btn btn-outline btn-sm">
                  <IconNewContract size={12}/> 契約作成
                </a>
              </div>
            </div>
          </div>
        ))}
        {filtered.length===0&&(
          <div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'var(--text-muted)'}}>
            <IconProperties size={32}/><br/>物件が見つかりません
          </div>
        )}
      </div>
    </AppLayout>
  );
}
