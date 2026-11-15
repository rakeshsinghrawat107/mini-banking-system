import React, { useState } from 'react';
import {
  IconFileText,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconTransfer,
  IconRefreshCw
} from './Icons';

export default function LedgerView({ transactions, onRefresh }) {
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch =
      t.txn_ref.toLowerCase().includes(search.toLowerCase()) ||
      (t.from_account && t.from_account.toLowerCase().includes(search.toLowerCase())) ||
      (t.to_account && t.to_account.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Bank Transaction Ledger</h2>
          <p>Audited chronological record of all monetary events, ACID commits, and crash-rollback operations.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onRefresh}>
            <IconRefreshCw size={16} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      <div className="card-panel">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
            <input
              type="text"
              className="form-control"
              style={{ maxWidth: '300px' }}
              placeholder="Search reference or account..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['all', 'deposit', 'withdraw', 'transfer'].map(type => (
                <button
                  key={type}
                  className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilterType(type)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {filtered.length} records
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Txn Reference</th>
                  <th>Type</th>
                  <th>Source (From)</th>
                  <th>Destination (To)</th>
                  <th>Amount ($)</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.txn_ref || t.id}>
                    <td className="mono" style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.8rem' }}>
                      {t.txn_ref}
                    </td>
                    <td>
                      <span className={`badge badge-${t.type}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="mono" style={{ color: t.from_account ? '#fff' : 'var(--text-muted)' }}>
                      {t.from_account || '—'}
                    </td>
                    <td className="mono" style={{ color: t.to_account ? '#fff' : 'var(--text-muted)' }}>
                      {t.to_account || '—'}
                    </td>
                    <td className="mono" style={{ fontWeight: 700, color: t.type === 'deposit' ? 'var(--accent-success)' : '#fff' }}>
                      ${parseFloat(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      No ledger transactions found matching your criteria.
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
