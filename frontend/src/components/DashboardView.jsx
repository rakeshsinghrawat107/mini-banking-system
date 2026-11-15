import React from 'react';
import {
  IconUsers,
  IconDatabase,
  IconLock,
  IconActivity,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconTransfer,
  IconZap,
  IconPlus,
  IconChevronRight
} from './Icons';

export default function DashboardView({
  accounts,
  transactions,
  walLogs,
  setActiveTab,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenCreateAccount
}) {
  const totalBalance = accounts.reduce((acc, a) => acc + (parseFloat(a.balance) || 0), 0);
  const totalTxnCount = transactions.length;
  const recentTxns = transactions.slice(0, 5);
  const recentWal = walLogs.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Executive Banking Dashboard</h2>
          <p>Real-time oversight of financial balances, fine-grained account mutex locks, and Write-Ahead Logging (WAL).</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onOpenCreateAccount}>
            <IconPlus size={16} />
            <span>New Account</span>
          </button>
          <button className="btn btn-primary" onClick={() => setActiveTab('transfer')}>
            <IconTransfer size={16} />
            <span>Transfer Funds</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-label">Total System Liquidity</div>
            <div className="stat-value mono">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="stat-sub">Across {accounts.length} monitored accounts</div>
          </div>
          <div className="stat-icon green">
            <IconActivity size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-label">Active Bank Accounts</div>
            <div className="stat-value mono">{accounts.length}</div>
            <div className="stat-sub">100% Verified Non-Negative</div>
          </div>
          <div className="stat-icon blue">
            <IconUsers size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-label">Ledger Transactions</div>
            <div className="stat-value mono">{totalTxnCount}</div>
            <div className="stat-sub">Atomic ACID Transfers</div>
          </div>
          <div className="stat-icon purple">
            <IconTransfer size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-label">WAL Log Entries (LSNs)</div>
            <div className="stat-value mono">{walLogs.length}</div>
            <div className="stat-sub">ARIES Protocol Crash Protection</div>
          </div>
          <div className="stat-icon amber">
            <IconDatabase size={22} />
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        
        {/* Account Balances Panel */}
        <div className="card-panel">
          <div className="card-header">
            <h3>
              <IconUsers size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Monitored Customer Balances</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('accounts')}>
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: '0.5rem 1rem' }}>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Holder Name</th>
                    <th>Balance</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(acc => (
                    <tr key={acc.account_number}>
                      <td className="mono" style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {acc.account_number}
                      </td>
                      <td>
                        <strong>{acc.holder_name}</strong>
                      </td>
                      <td className="mono" style={{ fontWeight: 600, color: '#fff' }}>
                        ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Deposit"
                            onClick={() => onOpenDeposit(acc.account_number)}
                          >
                            + Deposit
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Withdraw"
                            onClick={() => onOpenWithdraw(acc.account_number)}
                          >
                            - Withdraw
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="card-panel">
          <div className="card-header">
            <h3>
              <IconActivity size={18} style={{ color: 'var(--accent-cyan)' }} />
              <span>Real-Time Activity Feed</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('ledger')}>
              Full History
            </button>
          </div>
          <div className="card-body" style={{ padding: '0.75rem 1.25rem' }}>
            {recentTxns.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No transactions recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {recentTxns.map(t => (
                  <div
                    key={t.txn_ref || t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: t.type === 'deposit' ? 'var(--accent-success-soft)' : t.type === 'withdraw' ? 'var(--accent-danger-soft)' : 'var(--accent-primary-soft)',
                          color: t.type === 'deposit' ? 'var(--accent-success)' : t.type === 'withdraw' ? 'var(--accent-danger)' : 'var(--accent-primary)'
                        }}
                      >
                        {t.type === 'deposit' ? <IconArrowDownLeft size={16} /> : t.type === 'withdraw' ? <IconArrowUpRight size={16} /> : <IconTransfer size={16} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>
                          {t.type === 'transfer' ? `${t.from_account} -> ${t.to_account}` : `${t.type.toUpperCase()}: ${t.to_account || t.from_account}`}
                        </div>
                        <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {t.txn_ref}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontWeight: 700, fontSize: '0.9rem', color: t.type === 'deposit' ? 'var(--accent-success)' : '#fff' }}>
                        {t.type === 'deposit' ? '+' : t.type === 'withdraw' ? '-' : ''}${parseFloat(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <span className={`badge badge-${t.status}`}>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
