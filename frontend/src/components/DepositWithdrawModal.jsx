import React, { useState } from 'react';
import { IconArrowDownLeft, IconArrowUpRight, IconX } from './Icons';

export default function DepositWithdrawModal({ isOpen, onClose, mode, account, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !account) return null;

  const isDeposit = mode === 'deposit';
  const balance = parseFloat(account.balance) || 0;
  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numAmount <= 0) {
      alert("Amount must be greater than $0.00");
      return;
    }
    if (!isDeposit && numAmount > balance) {
      alert(`Insufficient funds! Available balance is only $${balance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(account.account_number, numAmount, mode);
      setAmount('');
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>
            {isDeposit ? 'Deposit Funds' : 'Withdraw Funds'} — <span className="mono">{account.account_number}</span>
          </h3>
          <button className="notification-close" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account Holder</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{account.holder_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Available Balance</div>
              <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--teal-600)' }}>
                ${balance.toFixed(2)}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{isDeposit ? 'Deposit Amount' : 'Withdrawal Amount'} ($ USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control mono"
                style={{ fontSize: '1.25rem', fontWeight: 700 }}
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                autoFocus
              />
              <div className="amount-pills">
                {[10, 50, 100, 500].map(val => (
                  <button
                    key={val}
                    type="button"
                    className="amount-pill"
                    onClick={() => setAmount(val.toString())}
                  >
                    +${val}
                  </button>
                ))}
                {!isDeposit && balance > 0 && (
                  <button
                    key="max"
                    type="button"
                    className="amount-pill"
                    style={{ color: 'var(--accent-warning)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                    onClick={() => setAmount(balance.toString())}
                  >
                    All (${balance.toFixed(2)})
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${isDeposit ? 'btn-primary' : 'btn-danger'}`}
              disabled={loading || numAmount <= 0 || (!isDeposit && numAmount > balance)}
            >
              {loading ? 'Processing...' : isDeposit ? `Deposit $${numAmount.toFixed(2)}` : `Withdraw $${numAmount.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
