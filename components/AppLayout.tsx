'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconDashboard, IconContracts, IconNewContract, IconProperties,
  IconSecurity, IconSettings, IconBell, IconMenu, IconClose,
  IconLock, IconWifi, IconClock, IconSign,
} from './Icons';
import AIChatAssistant from './AIChatAssistant';

const NAV = [
  {
    section: '業務',
    items: [
      { href: '/dashboard', icon: IconDashboard, label: 'ダッシュボード' },
      { href: '/contracts', icon: IconContracts, label: '契約書管理', badge: '3' },
      { href: '/contracts/new', icon: IconNewContract, label: '新規契約作成' },
    ],
  },
  {
    section: 'マスタ',
    items: [
      { href: '/properties', icon: IconProperties, label: '物件管理' },
    ],
  },
  {
    section: '管理',
    items: [
      { href: '/security', icon: IconSecurity, label: 'セキュリティ' },
      { href: '/settings', icon: IconSettings, label: '設定' },
    ],
  },
];

export default function AppLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="app-layout">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

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
                const active = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${active ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={17} strokeWidth={active ? 2 : 1.6} />
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

      <div className="main-content">
        <div className="security-bar">
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', letterSpacing: '0.12em' }}>PROPSIGN</span>
          <span className="security-item ok" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconLock size={10} /> TLS 1.3</span>
          <span className="security-item ok" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconSecurity size={10} /> 電子帳簿保存法準拠</span>
          <span className="security-item ok" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconWifi size={10} /> タイムスタンプ接続中</span>
          <span className="security-item" style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconClock size={10} /> {time}
          </span>
        </div>

        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
            </button>
            <span className="topbar-title">{title}</span>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-icon" title="通知"><IconBell size={18} /></button>
            <Link href="/contracts/new" className="btn btn-gold btn-sm">
              <IconSign size={14} /> 新規契約
            </Link>
          </div>
        </div>

        <div className="page-body">{children}</div>
      </div>

      <AIChatAssistant />
    </div>
  );
}
