'use client';
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [company, setCompany] = useState({
    name: '株式会社プロップサイン不動産',
    license: '東京都知事（3）第999999号',
    address: '東京都渋谷区道玄坂1-12-1',
    phone: '03-0000-0000',
    email: 'info@propsign.example.com',
    agentName: '山田 一郎',
    agentLicense: '東京都知事（3）第123456号',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppLayout title="設定">
      {saved && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          <CheckCircle size={14} /> 設定を保存しました
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">会社情報</div></div>
          <div className="card-body">
            {[
              { label: '会社名', key: 'name', ph: '株式会社〇〇不動産' },
              { label: '宅建業者免許番号', key: 'license', ph: '東京都知事（X）第XXXXXX号' },
              { label: '所在地', key: 'address', ph: '東京都...' },
              { label: '電話番号', key: 'phone', ph: '03-XXXX-XXXX' },
              { label: 'メールアドレス', key: 'email', ph: 'info@company.com' },
            ].map((f) => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input className="form-input" placeholder={f.ph} value={company[f.key as keyof typeof company]}
                  onChange={e => setCompany(c => ({ ...c, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">デフォルト宅建士</div></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">宅建士 氏名</label>
              <input className="form-input" value={company.agentName}
                onChange={e => setCompany(c => ({ ...c, agentName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">宅建士 免許番号</label>
              <input className="form-input" value={company.agentLicense}
                onChange={e => setCompany(c => ({ ...c, agentLicense: e.target.value }))} />
            </div>
            <div className="alert alert-info" style={{ marginTop: 12 }}>
              <span style={{ fontSize: 12 }}>新規契約作成時にデフォルト値として使用されます。個別に変更も可能です。</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">通知設定</div></div>
          <div className="card-body">
            {[
              { label: '署名完了時にメール通知', defaultChecked: true },
              { label: '署名期限3日前にリマインド', defaultChecked: true },
              { label: '新規契約受信時に通知', defaultChecked: false },
              { label: 'セキュリティアラートをメール通知', defaultChecked: true },
            ].map((item, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
                <input type="checkbox" defaultChecked={item.defaultChecked} />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">署名デフォルト設定</div></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">デフォルト署名タイプ</label>
              <select className="form-select">
                <option>立会人型（メール認証）</option>
                <option>当事者型（電子証明書）</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">署名有効期限</label>
              <select className="form-select">
                <option>7日間</option>
                <option>14日間</option>
                <option>30日間</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">自動リマインド</label>
              <select className="form-select">
                <option>期限3日前</option>
                <option>期限1日前</option>
                <option>毎日</option>
                <option>リマインドしない</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-lg" onClick={handleSave}>
          設定を保存
        </button>
      </div>
    </AppLayout>
  );
}
