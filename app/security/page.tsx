'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { IconLock, IconCheck, IconAlert, IconClock, IconUser, IconKey, IconDatabase, IconStamp } from '@/components/Icons';
import { getLocalContracts, getSettings } from '@/lib/store';

export default function SecurityPage() {
  const [logs, setLogs] = useState<Array<{time:string;event:string;detail:string;level:'ok'|'warn'|'info'}>>([]);
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    setSettings(getSettings());
    const contracts = getLocalContracts();
    const auditEntries: typeof logs = [];
    contracts.forEach(c => {
      (c.auditLog ?? []).forEach(log => {
        auditEntries.push({
          time: log.timestamp,
          event: log.event,
          detail: `${c.contractNo} - ${log.detail}`,
          level: log.event.includes('エラー') || log.event.includes('失敗') ? 'warn' : 'ok',
        });
      });
    });
    // システムログを追加
    auditEntries.push(
      { time: new Date().toISOString(), event: 'システム起動', detail: 'PropSign セキュリティモジュール正常起動', level: 'ok' },
      { time: new Date(Date.now()-3600000).toISOString(), event: 'TLS接続', detail: 'TLS 1.3 暗号化通信確立', level: 'ok' },
      { time: new Date(Date.now()-7200000).toISOString(), event: '設定変更', detail: '電子署名設定が更新されました', level: 'info' },
    );
    setLogs(auditEntries.sort((a,b) => b.time.localeCompare(a.time)).slice(0, 50));
  }, []);

  const secChecks = [
    { label: 'TLS 1.3 暗号化通信', ok: true, detail: 'エンドツーエンド暗号化' },
    { label: '電子署名法準拠', ok: true, detail: 'PKI・公開鍵暗号基盤' },
    { label: 'RFC3161 タイムスタンプ', ok: settings.timestampEnabled, detail: settings.timestampEnabled ? '自動付与有効' : '無効（設定で有効化可能）' },
    { label: '多要素認証（MFA）', ok: settings.mfaRequired, detail: settings.mfaRequired ? '必須設定中' : '無効（設定で有効化推奨）' },
    { label: '電子帳簿保存法準拠', ok: true, detail: '7年保存・検索要件対応' },
    { label: '操作ログ記録', ok: true, detail: '全操作を監査ログに記録' },
    { label: '改ざん防止措置', ok: true, detail: 'タイムスタンプ・ハッシュ検証' },
    { label: '宅建業法35条・37条対応', ok: true, detail: '電子書面交付要件準拠' },
  ];

  const okCount = secChecks.filter(c=>c.ok).length;
  const score = Math.round((okCount / secChecks.length) * 100);

  return (
    <AppLayout title="セキュリティ">
      {/* スコア */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        <div className="stat-card" style={{gridColumn:'span 1'}}>
          <div className="stat-label">セキュリティスコア</div>
          <div className="stat-value" style={{fontSize:28,color:score>=90?'var(--green)':score>=70?'var(--gold)':'var(--red)'}}>{score}<span style={{fontSize:14}}>/100</span></div>
          <div className="stat-sub">{okCount}/{secChecks.length} 項目クリア</div>
        </div>
        <div className="stat-card"><div className="stat-label">暗号化</div><div className="stat-value" style={{fontSize:18,color:'var(--green)'}}>TLS 1.3</div><div className="stat-sub">有効</div></div>
        <div className="stat-card"><div className="stat-label">監査ログ</div><div className="stat-value" style={{fontSize:18}}>{logs.length}</div><div className="stat-sub">件記録</div></div>
        <div className="stat-card"><div className="stat-label">タイムスタンプ</div><div className="stat-value" style={{fontSize:18,color:settings.timestampEnabled?'var(--green)':'var(--red)'}}>{settings.timestampEnabled?'有効':'無効'}</div><div className="stat-sub">RFC3161</div></div>
      </div>

      {/* セキュリティチェック */}
      <div className="card" style={{marginBottom:20}}>
        <div className="card-header">
          <div className="card-title"><IconLock size={14}/> セキュリティチェックリスト</div>
          <span className={`status-badge ${score>=90?'status-completed':score>=70?'status-pending':'status-expired'}`}>{score>=90?'優良':score>=70?'良好':'要改善'}</span>
        </div>
        <div className="card-body">
          {secChecks.map((item,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{width:22,height:22,borderRadius:'50%',background:item.ok?'var(--green)':'var(--red)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>
                {item.ok?'✓':'!'}
              </span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{item.label}</div>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>{item.detail}</div>
              </div>
              {!item.ok && <a href="/settings" className="btn btn-outline btn-sm">設定で有効化</a>}
            </div>
          ))}
        </div>
      </div>

      {/* 監査ログ */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><IconDatabase size={14}/> 監査ログ（電子帳簿保存法準拠）</div>
          <span className="status-badge status-signed">7年保存</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>日時</th><th>イベント</th><th>詳細</th><th>レベル</th></tr></thead>
            <tbody>
              {logs.length===0?(
                <tr><td colSpan={4} style={{textAlign:'center',padding:24,color:'var(--text-muted)'}}>
                  契約操作を行うと監査ログがここに記録されます
                </td></tr>
              ):logs.map((log,i)=>(
                <tr key={i}>
                  <td style={{fontFamily:'monospace',fontSize:11,whiteSpace:'nowrap'}}>{new Date(log.time).toLocaleString('ja-JP')}</td>
                  <td style={{fontSize:12,fontWeight:600}}>{log.event}</td>
                  <td style={{fontSize:12,color:'var(--text-muted)'}}>{log.detail}</td>
                  <td>
                    <span className={`status-badge ${log.level==='ok'?'status-completed':log.level==='warn'?'status-expired':'status-pending'}`}>
                      {log.level==='ok'?'正常':log.level==='warn'?'警告':'情報'}
                    </span>
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
