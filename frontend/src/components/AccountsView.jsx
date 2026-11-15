import React, { useState } from 'react';
import {
  IconUsers,
  IconPlus,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconTransfer,
  IconLock
} from './Icons';

export default function AccountsView({
  accounts,
  onOpenCreateAccount,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer
}) {
  const [search, setSearch] = useState('');

  const filtered = accounts.filter(a =>
    a.account_number.toLowerCase().includes(search.toLowerCase()) ||
    a.holder_name.toLowerCase().includes(search.toLowerCase()) ||
    (a.email && a.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Bank Accounts Directory</h2>
          <p>Every account is protected by an independent OS mutex (`std::mutex`) ensuring thread-safe balance operations.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={onOpenCreateAccount}>
            <IconPlus size={16} />
            <span>Create Account</span>
          </button>
        </div>
      </div>

      <div className="card-panel">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '400px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by account number, name, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {accounts.length} accounts
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Account No.</th>
                  <th>Account Holder</th>
                  <th>Email</th>
                  <th>Current Balance</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(acc => (
                  <tr key={acc.account_number}>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {acc.account_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{acc.holder_name}</div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {acc.email || 'N/A'}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                      ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`badge badge-${acc.status}`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {acc.created_at}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onOpenDeposit(acc.account_number)}
                          title="Deposit funds"
                        >
                          <IconArrowDownLeft size={14} style={{ color: 'var(--accent-success)' }} />
                          <span>Deposit</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onOpenWithdraw(acc.account_number)}
                          title="Withdraw funds"
                        >
                          <IconArrowUpRight size={14} style={{ color: 'var(--accent-danger)' }} />
                          <span>Withdraw</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onOpenTransfer(acc.account_number)}
                          title="Transfer to another account"
                        >
                          <IconTransfer size={14} style={{ color: 'var(--accent-primary)' }} />
                          <span>Transfer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      No bank accounts matched your search.
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
