'use client';
import AppLayout from '@/components/AppLayout';
import {
  IconSecurity, IconLock, IconCheck, IconAlert, IconClock,
  IconKey, IconWifi, IconDatabase, IconEye, IconContracts, IconUser,
} from '@/components/Icons';

const ACCESS_LOG = [
  { time: '2024-12-15 14:32:11', user: '山田 一郎', action: 'ログイン', ip: '192.168.1.10', status: 'ok' },
  { time: '2024-12-15 14:35:22', user: '山田 一郎', action: '契約書PS-2024-0003 閲覧', ip: '192.168.1.10', status: 'ok' },
  { time: '2024-12-15 14:40:05', user: '山田 一郎', action: '新規契約 PS-2024-0006 作成', ip: '192.168.1.10', status: 'ok' },
  { time: '2024-12-15 09:15:44', user: '鈴木 花子', action: 'ログイン', ip: '192.168.1.22', status: 'ok' },
  { time: '2024-12-14 16:20:33', user: 'システム', action: 'タイムスタンプ付与 PS-2024-0002', ip: '10.0.0.1', status: 'ok' },
  { time: '2024-12-14 11:05:18', user: '不明', action: 'ログイン試行失敗', ip: '203.104.22.11', status: 'warn' },
  { time: '2024-12-13 18:30:00', user: 'システム', action: '日次バックアップ完了', ip: '10.0.0.1', status: 'ok' },
];

const SECURITY_ITEMS = [
  { icon: <IconLock size={18} />, title: 'TLS 1.3 暗号化', desc: '全通信をAES-256で暗号化。中間者攻撃を防止。', ok: true },
  { icon: <IconKey size={18} />, title: '多要素認証（MFA）', desc: 'SMS/認証アプリによる2段階認証を全ユーザーに強制。', ok: true },
  { icon: <IconClock size={18} />, title: 'RFC3161 タイムスタンプ', desc: '契約書の存在時刻・非改ざん性を第三者機関が証明。', ok: true },
  { icon: <IconDatabase size={18} />, title: '電子帳簿保存法準拠', desc: '2024年1月義務化対応。検索要件・7年保存を満たす。', ok: true },
  { icon: <IconSecurity size={18} />, title: 'PKI 電子署名', desc: '公開鍵基盤（PKI）による電子署名。法的効力担保。', ok: true },
  { icon: <IconEye size={18} />, title: '操作ログ記録', desc: '全アクセス・操作を改ざん不可な形で記録・保管。', ok: true },
  { icon: <IconContracts size={18} />, title: 'バックアップ', desc: '日次・週次・月次の自動バックアップ。復元テスト済み。', ok: true },
  { icon: <IconWifi size={18} />, title: '不正アクセス検知', desc: 'IPレート制限・ブルートフォース検知を実装。', ok: true },
];

export default function SecurityPage() {
  return (
    <AppLayout title="セキュリティ管理">
      {/* Status banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy-deep) 0%, var(--navy-light) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '22px 28px', marginBottom: 22, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        border: '1px solid rgba(184,148,74,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(39,174,96,0.2)', border: '2px solid var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCheck size={22} color="var(--green-light)" />
          </div>
          <div>
            <div style={{ fontFamily: 'Shippori Mincho, serif', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>セキュリティ状態：正常</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>全8項目のセキュリティチェックをパスしています</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>最終チェック日時</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold-light)', fontFamily: 'monospace' }}>
            {new Date().toLocaleString('ja-JP')}
          </div>
        </div>
      </div>

      {/* Security grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 22 }}>
        {SECURITY_ITEMS.map((item) => (
          <div key={item.title} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: item.ok ? 'var(--green-pale)' : 'var(--red-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.ok ? 'var(--green)' : 'var(--red)' }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</span>
                  <IconCheck size={12} color={item.ok ? 'var(--green)' : 'var(--red)'} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { title: '宅建業法（2022年改正）', items: ['35条書面 電子交付', '37条書面 電子交付', '宅建士 電子記名', 'クーリングオフ通知'] },
          { title: '電子帳簿保存法', items: ['タイムスタンプ付与', '改ざん防止措置', '3項目検索機能', '7年間保存'] },
          { title: '電子署名法', items: ['PKI 電子署名', 'RFC3161 タイムスタンプ', '立会人型・当事者型', '法的効力の担保'] },
        ].map((law) => (
          <div key={law.title} className="card">
            <div className="card-header"><div className="card-title" style={{ fontSize: 12 }}>{law.title}</div></div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              {law.items.map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                  <IconCheck size={12} color="var(--green)" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MFA settings */}
      <div className="card" style={{ marginBottom: 22 }}>
        <div className="card-header">
          <div className="card-title"><IconUser size={14} /> MFA・アカウント設定</div>
          <button className="btn btn-primary btn-sm"><IconLock size={13} /> 設定変更</button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { label: 'MFA ステータス', value: '有効', ok: true },
              { label: 'セッション有効期限', value: '8時間', ok: true },
              { label: 'パスワードポリシー', value: '12文字以上・複雑性要求', ok: true },
              { label: 'IPアドレス制限', value: '社内IP限定（オプション）', ok: false },
              { label: 'シングルサインオン', value: 'Google/Microsoft連携可', ok: true },
              { label: 'API アクセス制御', value: 'OAuth 2.0 / JWT', ok: true },
            ].map((item) => (
              <div key={item.label} style={{ padding: '10px 14px', background: item.ok ? 'var(--green-pale)' : 'var(--earth-pale)', borderRadius: 'var(--radius)', border: `1px solid ${item.ok ? '#a8dfc0' : 'var(--border)'}` }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.ok ? 'var(--green)' : 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {item.ok && <IconCheck size={11} />}{item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Access log */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><IconEye size={14} /> アクセス・操作ログ</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm">CSV エクスポート</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>日時</th><th>ユーザー</th><th>操作</th><th>IPアドレス</th><th>状態</th></tr></thead>
            <tbody>
              {ACCESS_LOG.map((log, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{log.time}</td>
                  <td style={{ fontWeight: 600, fontSize: 12 }}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IconUser size={11} color="var(--text-muted)" />{log.user}</span></td>
                  <td style={{ fontSize: 12 }}>{log.action}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{log.ip}</td>
                  <td>
                    {log.status === 'ok'
                      ? <span className="status-badge status-completed"><IconCheck size={10} /> 正常</span>
                      : <span className="status-badge status-expired"><IconAlert size={10} /> 警告</span>}
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
