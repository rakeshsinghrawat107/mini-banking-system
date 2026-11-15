import React, { useState } from 'react';
import {
  IconDatabase,
  IconShieldCheck,
  IconAlertTriangle,
  IconRefreshCw,
  IconCheckCircle
} from './Icons';

export default function WalRecoveryView({ walLogs, onRunRecovery, onRefresh }) {
  const [recovering, setRecovering] = useState(false);
  const [stats, setStats] = useState(null);

  const handleTriggerRecovery = async () => {
    setRecovering(true);
    try {
      const res = await onRunRecovery();
      setStats(res);
    } catch (err) {
      // Handled by notification
    } finally {
      setRecovering(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Write-Ahead Logging (WAL) & ARIES Recovery</h2>
          <p>The foundation of Database Crash Recovery: changes are flushed to WAL with LSNs before mutating live data.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onRefresh}>
            <IconRefreshCw size={16} />
            <span>Refresh WAL</span>
          </button>
          <button
            className="btn btn-danger"
            onClick={handleTriggerRecovery}
            disabled={recovering}
          >
            <IconShieldCheck size={16} />
            <span>{recovering ? 'Running ARIES Engine...' : 'Run Crash Recovery'}</span>
          </button>
        </div>
      </div>

      {stats && (
        <div className="notification-banner success" style={{ marginBottom: '1.5rem' }}>
          <div>
            <strong>ARIES Recovery Protocol Completed:</strong> Analyzed {stats.records_analyzed} records &bull; {stats.committed_transactions} committed transactions verified &bull; Undone {stats.uncommitted_undone} partial loser transaction(s)
            {stats.rolled_back_refs?.length > 0 && (
              <span className="mono" style={{ marginLeft: '0.5rem' }}>
                [{stats.rolled_back_refs.join(', ')}]
              </span>
            )}
          </div>
          <button className="notification-close" onClick={() => setStats(null)}>
            &times;
          </button>
        </div>
      )}

      {/* ARIES 3-Phase Theory Box */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
            <span>1. Analysis Phase</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
            Scans WAL forward from the latest checkpoint. Identifies active (loser) transactions that started before the crash but never logged a <code className="mono">COMMIT</code>.
          </p>
        </div>

        <div className="stat-card" style={{ flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-success)', fontWeight: 700, fontSize: '0.85rem' }}>
            <span>2. Redo Phase</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
            Replays all logged updates to reconstruct the exact database state at the moment of failure, ensuring Durability (ACID).
          </p>
        </div>

        <div className="stat-card" style={{ flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-danger)', fontWeight: 700, fontSize: '0.85rem' }}>
            <span>3. Undo Phase</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
            Scans backward and reverses changes of all loser transactions using the recorded <code className="mono">old_balance</code>. Restores 100% money conservation!
          </p>
        </div>
      </div>

      {/* WAL Table */}
      <div className="card-panel">
        <div className="card-header">
          <h3>
            <IconDatabase size={18} style={{ color: 'var(--accent-amber)' }} />
            <span>Write-Ahead Log Stream (wal_logs)</span>
          </h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {walLogs.length} LSN records
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>LSN</th>
                  <th>Txn Reference</th>
                  <th>Action</th>
                  <th>Account ID</th>
                  <th>Old Balance</th>
                  <th>New Balance</th>
                  <th>Logged At</th>
                </tr>
              </thead>
              <tbody>
                {walLogs.map(log => (
                  <tr key={log.lsn}>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      #{log.lsn}
                    </td>
                    <td className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      {log.txn_ref}
                    </td>
                    <td>
                      <span className={`badge badge-${log.action?.toLowerCase()}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="mono" style={{ color: log.account_id ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {log.account_id ? `Account #${log.account_id}` : '—'}
                    </td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>
                      {log.old_balance !== null ? `$${parseFloat(log.old_balance).toFixed(2)}` : '—'}
                    </td>
                    <td className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.new_balance !== null ? `$${parseFloat(log.new_balance).toFixed(2)}` : '—'}
                    </td>
                    <td className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {log.logged_at}
                    </td>
                  </tr>
                ))}
                {walLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      No Write-Ahead Log entries recorded yet. Execute transfers to view real-time LSN logs.
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
