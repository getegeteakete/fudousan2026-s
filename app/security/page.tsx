'use client';
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Shield, Lock, CheckCircle, AlertCircle, Clock, Key, Wifi, Database, Eye, FileText } from 'lucide-react';

const SECURITY_ITEMS = [
  { category: '通信セキュリティ', items: [
    { label: 'TLS 1.3 暗号化通信', status: 'ok', detail: '全通信においてTLS 1.3による暗号化を実施' },
    { label: 'HSTS (HTTP Strict Transport Security)', status: 'ok', detail: 'HTTPSのみへの強制リダイレクト' },
    { label: 'CSP (Content Security Policy)', status: 'ok', detail: 'XSS攻撃からの保護' },
  ]},
  { category: '認証・アクセス制御', items: [
    { label: '多要素認証 (MFA)', status: 'ok', detail: 'SMS・認証アプリによる2段階認証' },
    { label: 'セッション管理', status: 'ok', detail: '30分無操作で自動ログアウト' },
    { label: '権限ベースアクセス制御 (RBAC)', status: 'ok', detail: '営業担当 / 宅建士 / 管理者の3役割' },
    { label: 'ブルートフォース保護', status: 'ok', detail: '5回連続失敗でアカウントロック' },
  ]},
  { category: '電子署名・タイムスタンプ', items: [
    { label: 'PKI電子署名', status: 'ok', detail: 'ISO 32000 準拠 | 電子署名法対応' },
    { label: 'RFC 3161 タイムスタンプ', status: 'ok', detail: '日本データ通信協会 認定TSA連携' },
    { label: '署名検証API', status: 'ok', detail: '署名の有効性をリアルタイム検証' },
  ]},
  { category: 'データ保護・保存', items: [
    { label: '電子帳簿保存法 準拠', status: 'ok', detail: '2024年1月義務化対応 | 7年間保存保証' },
    { label: 'AES-256 データ暗号化', status: 'ok', detail: '保存データの暗号化 (at rest)' },
    { label: '自動バックアップ', status: 'ok', detail: '日次バックアップ | 別リージョン冗長化' },
    { label: '改ざん検知', status: 'ok', detail: 'SHA-256 ハッシュによる整合性確認' },
  ]},
  { category: '法規制準拠', items: [
    { label: '宅建業法（2022年改正）対応', status: 'ok', detail: '35条・37条書面 電子交付対応' },
    { label: '電子署名法 準拠', status: 'ok', detail: '総務省・法務省・経産省・財務省 認定' },
    { label: '個人情報保護法 (PIPA)', status: 'ok', detail: '個人情報の適切な取扱いと保護' },
    { label: 'クーリングオフ書面', status: 'warn', detail: '一部取引では書面交付が必要（紙対応フロー確認推奨）' },
  ]},
];

const AUDIT_LOG = [
  { time: '2025-03-08 09:15:32', user: '山田 一郎', event: 'ログイン', ip: '10.0.0.1', result: 'success' },
  { time: '2025-03-08 09:18:05', user: '山田 一郎', event: '契約書 PS-2025-0003 閲覧', ip: '10.0.0.1', result: 'success' },
  { time: '2025-03-08 09:25:11', user: '山田 一郎', event: '新規契約作成', ip: '10.0.0.1', result: 'success' },
  { time: '2025-03-07 16:40:22', user: '鈴木 花子', event: 'ログイン', ip: '10.0.0.5', result: 'success' },
  { time: '2025-03-07 16:42:00', user: '鈴木 花子', event: '契約書 PS-2025-0002 送信', ip: '10.0.0.5', result: 'success' },
  { time: '2025-03-07 11:30:15', user: '不明', event: 'ログイン試行', ip: '198.51.100.x', result: 'failed' },
  { time: '2025-03-07 11:30:18', user: '不明', event: 'ログイン試行', ip: '198.51.100.x', result: 'failed' },
  { time: '2025-03-07 11:30:21', user: '不明', event: 'ログイン試行', ip: '198.51.100.x', result: 'blocked' },
];

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<'status' | 'log' | 'mfa'>('status');

  return (
    <AppLayout title="セキュリティ監査">
      <div className="tabs">
        {[
          { key: 'status', label: 'セキュリティ状態' },
          { key: 'log', label: 'アクセスログ' },
          { key: 'mfa', label: 'MFA設定' },
        ].map(t => (
          <div key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key as typeof activeTab)}>
            {t.label}
          </div>
        ))}
      </div>

      {activeTab === 'status' && (
        <div>
          {/* Score */}
          <div style={{
            background: 'linear-gradient(135deg, var(--navy), var(--navy-light))',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 28px',
            marginBottom: 24,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              border: '4px solid var(--gold)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>A+</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>スコア</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>セキュリティ評価：優良</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                19/20 チェック項目クリア。1件の注意事項があります。
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                {[
                  { icon: <Lock size={12} />, label: 'TLS 1.3' },
                  { icon: <Shield size={12} />, label: 'MFA有効' },
                  { icon: <Database size={12} />, label: 'AES-256' },
                  { icon: <Clock size={12} />, label: 'RFC3161 TS' },
                ].map(item => (
                  <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4ade80' }}>
                    {item.icon} {item.label} ✓
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Security checklist */}
          {SECURITY_ITEMS.map((group) => (
            <div key={group.category} className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title">{group.category}</div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {group.items.filter(i => i.status === 'ok').length}/{group.items.length} クリア
                </span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {group.items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                    borderBottom: i < group.items.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    {item.status === 'ok' ? (
                      <CheckCircle size={16} style={{ color: 'var(--green-ok)', flexShrink: 0 }} />
                    ) : (
                      <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.detail}</div>
                    </div>
                    <span className={`status-badge ${item.status === 'ok' ? 'status-completed' : 'status-pending'}`}>
                      {item.status === 'ok' ? '有効' : '要確認'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'log' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">アクセス・操作ログ</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>直近30日間 | 電子帳簿保存法 7年保存</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>日時</th>
                  <th>ユーザー</th>
                  <th>操作内容</th>
                  <th>IPアドレス</th>
                  <th>結果</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOG.map((entry, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{entry.time}</td>
                    <td style={{ fontWeight: 600 }}>{entry.user}</td>
                    <td>{entry.event}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{entry.ip}</td>
                    <td>
                      <span className={`status-badge ${
                        entry.result === 'success' ? 'status-completed' :
                        entry.result === 'blocked' ? 'status-expired' : 'status-pending'
                      }`}>
                        {entry.result === 'success' ? '成功' : entry.result === 'blocked' ? 'ブロック' : '失敗'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'mfa' && (
        <div style={{ maxWidth: 560 }}>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title"><Key size={14} style={{ display: 'inline', marginRight: 6 }} />多要素認証 (MFA)</div>
              <span className="status-badge status-completed">有効</span>
            </div>
            <div className="card-body">
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                <CheckCircle size={14} />
                MFAが有効です。アカウントは二段階認証で保護されています。
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { method: 'SMS認証', detail: '090-****-5678', enabled: true },
                  { method: '認証アプリ (TOTP)', detail: 'Google Authenticator / Authy', enabled: true },
                  { method: 'メール認証', detail: 'yamada@estate.example.com', enabled: false },
                ].map((m) => (
                  <div key={m.method} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    background: m.enabled ? '#f0fdf4' : 'var(--bg-base)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.method}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.detail}</div>
                    </div>
                    <span className={`status-badge ${m.enabled ? 'status-signed' : 'status-draft'}`}>
                      {m.enabled ? '有効' : '無効'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">セッション管理</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'セッションタイムアウト', value: '30分（非操作時）' },
                  { label: '最大同時セッション数', value: '3デバイス' },
                  { label: '強制ログアウト', value: 'いつでも全デバイスから可能' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-danger btn-sm" style={{ marginTop: 16 }}>
                全デバイスからログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
