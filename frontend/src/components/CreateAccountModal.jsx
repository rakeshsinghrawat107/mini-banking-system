import React, { useState } from 'react';
import { IconPlus, IconX } from './Icons';

export default function CreateAccountModal({ isOpen, onClose, onCreate }) {
  const [holderName, setHolderName] = useState('');
  const [email, setEmail] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('1000');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!holderName.trim()) return;

    setLoading(true);
    try {
      await onCreate({
        holder_name: holderName.trim(),
        email: email.trim(),
        initial_deposit: parseFloat(initialDeposit) || 0.0
      });
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
          <h3>Open New Bank Account</h3>
          <button className="notification-close" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Account Holder Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Aditi Sharma"
                value={holderName}
                onChange={e => setHolderName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                className="form-control"
                placeholder="aditi@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Opening Deposit ($ USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.00"
                className="form-control mono"
                placeholder="1000.00"
                value={initialDeposit}
                onChange={e => setInitialDeposit(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !holderName.trim()}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
