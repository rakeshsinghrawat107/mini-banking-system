import React, { useState } from 'react';
import {
  IconBank,
  IconUsers,
  IconTransfer,
  IconFileText,
  IconDatabase,
  IconCpu,
  IconShieldCheck,
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
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <IconX size={20} /> : <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>☰</span>}
        </button>

        <div
          className="header-brand-wrap"
          onClick={() => setActiveTab(userRole === 'customer' ? 'customer-portal' : 'dashboard')}
          title="Mini Banking System - Team GHOST"
        >
          <div className="brand-logo-icon">
            <IconBank size={18} />
          </div>
          <div className="brand-titles">
            <span className="brand-name">Mini Banking</span>
            <span className="brand-badge">Team GHOST</span>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <nav className="nav-links">
        {currentNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                setMobileOpen(false);
              }}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Status & Role Switcher */}
      <div className="header-right">
        <div className="system-health-tag">
          <span className="health-dot" />
          <span className="health-text mono">
            {isLive ? `${sysInfo?.database_mode === 'postgres' ? 'POSTGRES LIVE' : 'SQLITE LIVE'} • MUTEX READY` : 'ENGINE OFFLINE'}
          </span>
        </div>

        <select
          className="role-selector-header"
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
          <option value="admin">Portal: Bank Administrator</option>
          <optgroup label="Customer Accounts">
            {accounts.map(acc => (
              <option key={acc.account_number} value={acc.account_number}>
                Customer: {acc.holder_name} ({acc.account_number})
              </option>
            ))}
          </optgroup>
        </select>
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
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
