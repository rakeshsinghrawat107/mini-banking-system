import React, { useState } from 'react';
import {
  IconTransfer,
  IconLock,
  IconShieldCheck,
  IconDatabase,
  IconZap,
  IconCheckCircle
} from './Icons';

export default function TransferView({ accounts, onExecuteTransfer, defaultFrom = '' }) {
  const [fromAcc, setFromAcc] = useState(defaultFrom || (accounts[0]?.account_number || ''));
  const [toAcc, setToAcc] = useState(accounts[1]?.account_number || '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const senderObj = accounts.find(a => a.account_number === fromAcc);
  const receiverObj = accounts.find(a => a.account_number === toAcc);

  const senderBalance = senderObj ? parseFloat(senderObj.balance) : 0;
  const numAmount = parseFloat(amount) || 0;

  // OS Concept: Lexicographical Lock Hierarchy
  const firstLock = fromAcc && toAcc ? (fromAcc < toAcc ? fromAcc : toAcc) : 'N/A';
  const secondLock = fromAcc && toAcc ? (fromAcc < toAcc ? toAcc : fromAcc) : 'N/A';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromAcc || !toAcc) return;
    if (fromAcc === toAcc) {
      alert("Sender and receiver accounts must be distinct!");
      return;
    }
    if (numAmount <= 0) {
      alert("Transfer amount must be strictly greater than $0.00");
      return;
    }
    if (numAmount > senderBalance) {
      alert(`Insufficient funds! Available balance is only $${senderBalance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await onExecuteTransfer(fromAcc, toAcc, numAmount);
      setReceipt(res);
      setAmount('');
    } catch (err) {
      // Error handled by parent toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Atomic Fund Transfer Terminal</h2>
          <p>Executes multi-account transfers inside a synchronized critical section backed by Write-Ahead Logging (WAL).</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        
        {/* Transfer Form Card */}
        <div className="card-panel">
          <div className="card-header">
            <h3>
              <IconTransfer size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Initiate Inter-Account Transfer</span>
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Debit Source Account (From)</label>
                  <select
                    className="form-control"
                    value={fromAcc}
                    onChange={e => {
                      setFromAcc(e.target.value);
                      setReceipt(null);
                    }}
                  >
                    {accounts.map(a => (
                      <option key={a.account_number} value={a.account_number}>
                        {a.account_number} — {a.holder_name} (${parseFloat(a.balance).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  {senderObj && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Available Balance: <strong className="mono" style={{ color: 'var(--text-primary)' }}>${senderBalance.toFixed(2)}</strong>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Credit Destination Account (To)</label>
                  <select
                    className="form-control"
                    value={toAcc}
                    onChange={e => {
                      setToAcc(e.target.value);
                      setReceipt(null);
                    }}
                  >
                    {accounts.map(a => (
                      <option key={a.account_number} value={a.account_number} disabled={a.account_number === fromAcc}>
                        {a.account_number} — {a.holder_name} (${parseFloat(a.balance).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  {receiverObj && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Destination Holder: <strong style={{ color: 'var(--text-primary)' }}>{receiverObj.holder_name}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Transfer Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control mono"
                  style={{ fontSize: '1.25rem', fontWeight: 700 }}
                  placeholder="0.00"
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value);
                    setReceipt(null);
                  }}
                  required
                />
                <div className="amount-pills">
                  {[10, 50, 100, 500, 1000].map(val => (
                    <button
                      key={val}
                      type="button"
                      className="amount-pill"
                      onClick={() => setAmount(val.toString())}
                    >
                      +${val}
                    </button>
                  ))}
                  {senderBalance > 0 && (
                    <button
                      key="max"
                      type="button"
                      className="amount-pill"
                      style={{ color: 'var(--accent-warning)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                      onClick={() => setAmount(senderBalance.toString())}
                    >
                      MAX (${senderBalance.toFixed(2)})
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem' }}
                  disabled={loading || numAmount <= 0 || fromAcc === toAcc || numAmount > senderBalance}
                >
                  {loading ? 'Executing Atomic Transfer...' : `Confirm Transfer of $${numAmount.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Operating System Safeguards Inspector */}
        <div className="card-panel">
          <div className="card-header">
            <h3>
              <IconLock size={18} style={{ color: 'var(--accent-warning)' }} />
              <span>OS Concurrency & Deadlock Safeguards</span>
            </h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-warning)', fontWeight: 600, fontSize: '0.85rem' }}>
                  <IconLock size={16} />
                  <span>Lexicographical Lock Hierarchy (Coffman Condition 4)</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                  To prevent circular wait deadlocks (Transfer A-&gt;B vs Transfer B-&gt;A), mutex locks are always acquired in strictly sorted alphabetical order:
                </p>
                <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.825rem' }}>
                  <span style={{ background: '#ffffff', padding: '0.35rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-default)', color: 'var(--teal-700)', fontWeight: 600 }}>
                    1st Lock: {firstLock}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                  <span style={{ background: '#ffffff', padding: '0.35rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-default)', color: 'var(--teal-700)', fontWeight: 600 }}>
                    2nd Lock: {secondLock}
                  </span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-success)', fontWeight: 600, fontSize: '0.85rem' }}>
                  <IconDatabase size={16} />
                  <span>Write-Ahead Logging (WAL) Sequence</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                  State changes are written to the Write-Ahead Log before updating live account tables:
                </p>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div>1. <span style={{ color: 'var(--accent-primary)' }}>START</span> txn_ref</div>
                  <div>2. <span style={{ color: 'var(--accent-danger)' }}>DEBIT</span> {fromAcc} (${senderBalance.toFixed(2)} &rarr; ${(senderBalance - numAmount).toFixed(2)})</div>
                  <div>3. <span style={{ color: 'var(--accent-success)' }}>CREDIT</span> {toAcc}</div>
                  <div>4. <span style={{ color: 'var(--accent-success)' }}>COMMIT</span> txn_ref</div>
                </div>
              </div>

              {receipt && (
                <div style={{ background: 'var(--accent-success-soft)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-success)', fontWeight: 700 }}>
                    <IconCheckCircle size={18} />
                    <span>Transfer Executed Successfully!</span>
                  </div>
                  <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                    <div>Ref: <strong>{receipt.txn_ref}</strong></div>
                    <div>From: {receipt.from_account} (New Balance: ${parseFloat(receipt.from_balance).toFixed(2)})</div>
                    <div>To: {receipt.to_account} (New Balance: ${parseFloat(receipt.to_balance).toFixed(2)})</div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
