'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Building2, PenLine, ShieldCheck,
  Settings, Menu, X, Bell, Lock, Wifi, Clock, ChevronRight
} from 'lucide-react';

const NAV = [
  {
    section: 'メイン',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'ダッシュボード' },
      { href: '/contracts', icon: FileText, label: '契約書管理', badge: '3' },
      { href: '/contracts/new', icon: PenLine, label: '新規契約作成' },
    ]
  },
  {
    section: 'マスタ',
    items: [
      { href: '/properties', icon: Building2, label: '物件管理' },
    ]
  },
  {
    section: 'セキュリティ・設定',
    items: [
      { href: '/security', icon: ShieldCheck, label: 'セキュリティ監査' },
      { href: '/settings', icon: Settings, label: '設定' },
    ]
  },
];

export default function AppLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('ja-JP'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="app-layout">
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">判</div>
          <div className="app-name">PropSign</div>
          <div className="app-sub">不動産電子契約システム</div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="nav-section">
                <div className="nav-section-label">{group.section}</div>
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${active ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={16} />
                    {item.label}
                    {item.badge && <span className="badge">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">山</div>
            <div>
              <div className="user-name">山田 一郎</div>
              <div className="user-role">宅地建物取引士</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Security bar */}
        <div className="security-bar">
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>■ PropSign</span>
          <span className="security-item ok"><Lock size={10} /> TLS 1.3 暗号化通信</span>
          <span className="security-item ok"><ShieldCheck size={10} /> 電子帳簿保存法 準拠</span>
          <span className="security-item ok"><Wifi size={10} /> タイムスタンプ サービス接続中</span>
          <span className="security-item" style={{ marginLeft: 'auto', fontSize: '10px', fontFamily: 'monospace' }}>
            <Clock size={10} /> {time}
          </span>
        </div>

        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <span className="topbar-title">{title}</span>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-outline btn-icon" title="通知">
              <Bell size={16} />
            </button>
            <Link href="/contracts/new" className="btn btn-gold btn-sm">
              <PenLine size={14} />
              新規作成
            </Link>
          </div>
        </div>

        {/* Page body */}
        <div className="page-body">
          {children}
        </div>
      </div>
    </div>
  );
}
