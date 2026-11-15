import React from 'react';
import {
  IconBank,
  IconUsers,
  IconTransfer,
  IconFileText,
  IconDatabase,
  IconCpu,
  IconShieldCheck,
  IconActivity
} from './Icons';

export default function Navbar({ activeTab, setActiveTab, sysInfo, isLive }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconBank },
    { id: 'accounts', label: 'Accounts', icon: IconUsers },
    { id: 'transfer', label: 'Transfer', icon: IconTransfer },
    { id: 'ledger', label: 'Ledger', icon: IconFileText },
    { id: 'wal', label: 'WAL & Recovery', icon: IconDatabase },
    { id: 'lab', label: 'OS & Concurrency Lab', icon: IconCpu },
    { id: 'team', label: 'Team Viva Guide', icon: IconShieldCheck },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand-section">
          <div className="brand-logo">
            <IconBank size={22} />
          </div>
          <div className="brand-meta">
            <h1>Mini Banking Transaction System</h1>
            <div className="university-tag">
              <span>Graphic Era Hill University</span>
              <span>•</span>
              <span className="team-badge">Team GHOST</span>
            </div>
          </div>
        </div>

        <nav className="nav-links">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="nav-status">
          <div className={`status-pill ${sysInfo?.database_mode === 'postgres' ? 'postgres' : ''}`}>
            <span className="status-dot"></span>
            <span>{isLive ? 'ONLINE' : 'CONNECTING...'}</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span className="mono" style={{ textTransform: 'uppercase' }}>
              {sysInfo?.database_mode || 'SQLITE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
