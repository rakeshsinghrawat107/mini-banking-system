import React from 'react';
import {
  IconBank,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconTransfer,
  IconFileText,
  IconShieldCheck
} from './Icons';

export default function CustomerPortalView({
  account,
  transactions,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onExportCsv
}) {
  if (!account) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
        No account selected. Please select a customer account from the top right role switcher.
      </div>
    );
  }

  const balance = parseFloat(account.balance) || 0;
  const myTxns = transactions.filter(
    t => t.from_account === account.account_number || t.to_account === account.account_number
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Customer Online Banking Portal</h2>
          <p>Welcome back, <strong>{account.holder_name}</strong> &bull; Secure banking backed by ACID transactions.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => onExportCsv(myTxns, account.account_number)}>
            <IconFileText size={16} />
            <span>Export Statement (CSV)</span>
          </button>
        </div>
      </div>

      {/* Account Hero Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Available Checking Balance
          </div>
          <div className="mono" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <span className="mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
              {account.account_number}
            </span>
            <span className={`badge badge-${account.status}`}>{account.status}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{account.email}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => onOpenDeposit(account.account_number)}>
            <IconArrowDownLeft size={16} />
            <span>Deposit</span>
          </button>
          <button className="btn btn-secondary" onClick={() => onOpenWithdraw(account.account_number)}>
            <IconArrowUpRight size={16} />
            <span>Withdraw</span>
          </button>
          <button className="btn btn-secondary" onClick={() => onOpenTransfer(account.account_number)}>
            <IconTransfer size={16} />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Personal Transactions Table */}
      <div className="card-panel">
        <div className="card-header">
          <h3>
            <IconFileText size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>My Recent Activity ({myTxns.length} records)</span>
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={() => onExportCsv(myTxns, account.account_number)}>
            Download CSV
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Txn Reference</th>
                  <th>Type</th>
                  <th>Counterparty</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {myTxns.map(t => {
                  const isCredit = t.to_account === account.account_number;
                  return (
                    <tr key={t.txn_ref || t.id}>
                      <td className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                        {t.txn_ref}
                      </td>
                      <td>
                        <span className={`badge badge-${t.type}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="mono">
                        {t.type === 'transfer' ? (isCredit ? `From: ${t.from_account}` : `To: ${t.to_account}`) : 'Bank Direct'}
                      </td>
                      <td className="mono" style={{ fontWeight: 700, color: isCredit ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                        {isCredit ? '+' : '-'}${parseFloat(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`badge badge-${t.status}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {t.created_at}
                      </td>
                    </tr>
                  );
                })}
                {myTxns.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      No transactions recorded for this account yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
