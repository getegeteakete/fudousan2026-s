'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { SAMPLE_CONTRACTS, STATUS_LABELS, TYPE_LABELS, formatDate } from '@/lib/data';
import type { ContractStatus, ContractType, Contract } from '@/lib/data';
import Link from 'next/link';
import { IconSearch, IconPlus, IconDownload, IconArrow, IconContracts } from '@/components/Icons';
import { getLocalContracts } from '@/lib/store';

const statusClass: Record<ContractStatus, string> = {
  draft:'status-draft', pending:'status-pending', signed:'status-signed',
  completed:'status-completed', expired:'status-expired',
};

export default function ContractsPage() {
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus|'all'>('all');
  const [typeFilter, setTypeFilter]   = useState<ContractType|'all'>('all');
  const [contracts, setContracts]     = useState<Contract[]>([]);

  useEffect(() => {
    // localStorage の作成分 + サンプルデータをマージ（IDで重複排除）
    const local = getLocalContracts();
    const localIds = new Set(local.map(c => c.id));
    const merged = [...local, ...SAMPLE_CONTRACTS.filter(c => !localIds.has(c.id))];
    setContracts(merged);
  }, []);

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase();
    const ms = !search || c.propertyName.toLowerCase().includes(q) || c.tenantName.toLowerCase().includes(q) || c.contractNo.toLowerCase().includes(q);
    const mst = statusFilter==='all' || c.status===statusFilter;
    const mt  = typeFilter==='all'   || c.type===typeFilter;
    return ms && mst && mt;
  });

  return (
    <AppLayout title="契約書管理">
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:'1 1 200px',minWidth:200}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',display:'flex'}}><IconSearch size={14}/></span>
          <input className="form-input" style={{paddingLeft:32}} placeholder="物件名・契約者名・契約番号で検索…"
            value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="form-select" style={{width:'auto',minWidth:130}} value={statusFilter}
          onChange={e=>setStatusFilter(e.target.value as ContractStatus|'all')}>
          <option value="all">全ステータス</option>
          {Object.entries(STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        <select className="form-select" style={{width:'auto',minWidth:130}} value={typeFilter}
          onChange={e=>setTypeFilter(e.target.value as ContractType|'all')}>
          <option value="all">全契約種別</option>
          {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        <Link href="/contracts/new" className="btn btn-primary" style={{marginLeft:'auto'}}>
          <IconPlus size={14}/> 新規作成
        </Link>
      </div>

      <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>
        {filtered.length}件表示中（全{contracts.length}件）
        {getLocalContracts().length > 0 && <span style={{marginLeft:8,color:'var(--green)'}}>● {getLocalContracts().length}件ローカル保存済み</span>}
      </div>

      <div className="card" style={{overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>契約番号</th><th>物件名</th><th>契約者</th><th>種別</th>
                <th>ステータス</th><th>更新日</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'var(--text-muted)'}}>
                  <IconContracts size={28}/><br/>該当する契約書がありません
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td style={{fontFamily:'monospace',fontSize:12,fontWeight:600}}>{c.contractNo}</td>
                  <td>
                    <div style={{fontWeight:600,fontSize:13}}>{c.propertyName}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)'}}>{c.propertyAddress}</div>
                  </td>
                  <td>
                    <div style={{fontSize:13}}>{c.tenantName}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)'}}>{c.tenantEmail}</div>
                  </td>
                  <td><span className="status-badge" style={{background:'var(--earth-pale)',color:'var(--navy)'}}>{TYPE_LABELS[c.type]}</span></td>
                  <td><span className={`status-badge ${statusClass[c.status]}`}>{STATUS_LABELS[c.status]}</span></td>
                  <td style={{fontSize:12,color:'var(--text-muted)'}}>{formatDate(c.updatedAt)}</td>
                  <td>
                    <Link href={`/contracts/${c.id}`} className="btn btn-outline btn-sm">
                      詳細 <IconArrow size={12}/>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
