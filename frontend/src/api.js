// Mini Banking Transaction System - API Client
// Graphic Era Hill University - Team GHOST

export const API_BASE = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.port === '5000' ? '' : 'http://localhost:5000');

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  getSystemInfo: () => request('/api/system').catch(() => request('/')),
  getAccounts: () => request('/api/accounts'),
  getAccount: (accNo) => request(`/api/accounts/${encodeURIComponent(accNo)}`),
  createAccount: (payload) => request('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  deposit: (accountNumber, amount) => request('/api/accounts/deposit', {
    method: 'POST',
    body: JSON.stringify({ account_number: accountNumber, amount: parseFloat(amount) })
  }),
  withdraw: (accountNumber, amount) => request('/api/accounts/withdraw', {
    method: 'POST',
    body: JSON.stringify({ account_number: accountNumber, amount: parseFloat(amount) })
  }),
  transfer: (fromAccount, toAccount, amount) => request('/api/accounts/transfer', {
    method: 'POST',
    body: JSON.stringify({
      from_account: fromAccount,
      to_account: toAccount,
      amount: parseFloat(amount)
    })
  }),
  getTransactions: () => request('/api/transactions'),
  getWalLogs: () => request('/api/wal'),
  runRecovery: () => request('/api/recovery/run', {
    method: 'POST'
  }),
  getRaceDemo: () => request('/api/demo/race'),
  getDeadlockDemo: () => request('/api/demo/deadlock'),
  getCrashDemo: () => request('/api/demo/crash')
};
