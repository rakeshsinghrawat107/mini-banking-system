import React, { useState } from 'react';
import {
  IconBank,
  IconUsers,
  IconTransfer,
  IconFileText,
  IconDatabase,
  IconCpu,
  IconShieldCheck,
  IconLock,
  IconX
} from './Icons';

export default function Navbar({
  activeTab,
  setActiveTab,
  sysInfo,
  isLive,
  userRole,
  setUserRole,
  selectedAccountNo,
  setSelectedAccountNo,
  accounts
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconBank },
    { id: 'accounts', label: 'Accounts', icon: IconUsers },
    { id: 'transfer', label: 'Transfer', icon: IconTransfer },
    { id: 'ledger', label: 'Ledger', icon: IconFileText },
    { id: 'wal', label: 'WAL & Recovery', icon: IconDatabase },
    { id: 'lab', label: 'OS & Concurrency Lab', icon: IconCpu },
    { id: 'team', label: 'Team Viva Guide', icon: IconShieldCheck },
  ];

  const customerNavItems = [
    { id: 'customer-portal', label: 'My Account', icon: IconBank },
    { id: 'transfer', label: 'Transfer Funds', icon: IconTransfer },
    { id: 'ledger', label: 'My Transactions', icon: IconFileText },
    { id: 'team', label: 'Project Info', icon: IconShieldCheck },
  ];

  const currentNavItems = userRole === 'admin' ? adminNavItems : customerNavItems;

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

        {/* Desktop Navigation Links */}
        <nav className="nav-links">
          {currentNavItems.map(item => {
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

        {/* Status & Role Switcher */}
        <div className="nav-status">
          {/* Role Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <select
              className="form-control"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', width: 'auto', background: 'var(--bg-card)' }}
              value={userRole === 'admin' ? 'admin' : selectedAccountNo}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'admin') {
                  setUserRole('admin');
                  if (activeTab === 'customer-portal') setActiveTab('dashboard');
                } else {
                  setUserRole('customer');
                  setSelectedAccountNo(val);
                  setActiveTab('customer-portal');
                }
              }}
            >
              <option value="admin">Role: Bank Administrator</option>
              <optgroup label="Customer Portal Accounts">
                {accounts.map(acc => (
                  <option key={acc.account_number} value={acc.account_number}>
                    Customer: {acc.holder_name} ({acc.account_number})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className={`status-pill ${sysInfo?.database_mode === 'postgres' ? 'postgres' : ''}`}>
            <span className="status-dot"></span>
            <span>{isLive ? 'ONLINE' : 'OFFLINE'}</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span className="mono" style={{ textTransform: 'uppercase' }}>
              {sysInfo?.database_mode || 'SQLITE'}
            </span>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="btn btn-secondary btn-sm mobile-hamburger"
            style={{ display: 'none' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <IconX size={18} /> : <span>☰</span>}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="mobile-drawer">
          {currentNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
