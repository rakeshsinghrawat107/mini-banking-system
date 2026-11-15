import React, { useState, useEffect, useCallback } from 'react';
import './style.css';
import { api } from './api';

import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import AccountsView from './components/AccountsView';
import TransferView from './components/TransferView';
import LedgerView from './components/LedgerView';
import WalRecoveryView from './components/WalRecoveryView';
import ConcurrencyLabView from './components/ConcurrencyLabView';
import TeamGuideView from './components/TeamGuideView';

import CreateAccountModal from './components/CreateAccountModal';
import DepositWithdrawModal from './components/DepositWithdrawModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sysInfo, setSysInfo] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [walLogs, setWalLogs] = useState([]);
  const [notification, setNotification] = useState(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [depWithModal, setDepWithModal] = useState({ open: false, mode: 'deposit', accountNo: '' });
  const [transferDefaultFrom, setTransferDefaultFrom] = useState('');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const loadData = useCallback(async () => {
    try {
      const [info, accs, txns, logs] = await Promise.all([
        api.getSystemInfo().catch(() => null),
        api.getAccounts().catch(() => []),
        api.getTransactions().catch(() => []),
        api.getWalLogs().catch(() => [])
      ]);

      if (info) {
        setSysInfo(info);
        setIsLive(true);
      } else {
        setIsLive(false);
      }

      setAccounts(Array.isArray(accs) ? accs : (accs.value || []));
      setTransactions(Array.isArray(txns) ? txns : (txns.value || []));
      setWalLogs(Array.isArray(logs) ? logs : (logs.value || []));
    } catch (err) {
      console.error("Failed to load banking data:", err);
      setIsLive(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000); // Poll every 6 seconds
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Create Account
  const handleCreateAccount = async (payload) => {
    try {
      const newAcc = await api.createAccount(payload);
      showNotification(`Account ${newAcc.account_number} created for ${newAcc.holder_name}!`, 'success');
      loadData();
      return newAcc;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  };

  // Handle Deposit / Withdraw
  const handleDepositWithdraw = async (accountNo, amount, mode) => {
    try {
      if (mode === 'deposit') {
        const res = await api.deposit(accountNo, amount);
        showNotification(`Deposited $${parseFloat(amount).toFixed(2)} to ${accountNo}! Balance: $${parseFloat(res.current_balance).toFixed(2)}`, 'success');
      } else {
        const res = await api.withdraw(accountNo, amount);
        showNotification(`Withdrew $${parseFloat(amount).toFixed(2)} from ${accountNo}! Balance: $${parseFloat(res.current_balance).toFixed(2)}`, 'success');
      }
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  };

  // Handle Transfer
  const handleTransfer = async (fromAcc, toAcc, amount) => {
    try {
      const res = await api.transfer(fromAcc, toAcc, amount);
      showNotification(`Transferred $${parseFloat(amount).toFixed(2)} from ${fromAcc} to ${toAcc}! Ref: ${res.txn_ref}`, 'success');
      loadData();
      return res;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  };

  // Handle ARIES Recovery
  const handleRunRecovery = async () => {
    try {
      const res = await api.runRecovery();
      showNotification(`ARIES Crash Recovery complete! Analyzed ${res.records_analyzed} records, undone ${res.uncommitted_undone} uncommitted transaction(s).`, 'success');
      loadData();
      return res;
    } catch (err) {
      showNotification(err.message, 'error');
      throw err;
    }
  };

  const selectedAccountForDepWith = accounts.find(a => a.account_number === depWithModal.accountNo);

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sysInfo={sysInfo}
        isLive={isLive}
      />

      <main className="main-content">
        {notification && (
          <div className={`notification-banner ${notification.type}`}>
            <div>{notification.message}</div>
            <button className="notification-close" onClick={() => setNotification(null)}>
              &times;
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            accounts={accounts}
            transactions={transactions}
            walLogs={walLogs}
            setActiveTab={setActiveTab}
            onOpenDeposit={(accNo) => setDepWithModal({ open: true, mode: 'deposit', accountNo: accNo })}
            onOpenWithdraw={(accNo) => setDepWithModal({ open: true, mode: 'withdraw', accountNo: accNo })}
            onOpenCreateAccount={() => setCreateModalOpen(true)}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsView
            accounts={accounts}
            onOpenCreateAccount={() => setCreateModalOpen(true)}
            onOpenDeposit={(accNo) => setDepWithModal({ open: true, mode: 'deposit', accountNo: accNo })}
            onOpenWithdraw={(accNo) => setDepWithModal({ open: true, mode: 'withdraw', accountNo: accNo })}
            onOpenTransfer={(accNo) => {
              setTransferDefaultFrom(accNo);
              setActiveTab('transfer');
            }}
          />
        )}

        {activeTab === 'transfer' && (
          <TransferView
            accounts={accounts}
            onExecuteTransfer={handleTransfer}
            defaultFrom={transferDefaultFrom}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerView
            transactions={transactions}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'wal' && (
          <WalRecoveryView
            walLogs={walLogs}
            onRunRecovery={handleRunRecovery}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'lab' && (
          <ConcurrencyLabView
            onExperimentCompleted={loadData}
          />
        )}

        {activeTab === 'team' && (
          <TeamGuideView />
        )}
      </main>

      {/* Modals */}
      <CreateAccountModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateAccount}
      />

      <DepositWithdrawModal
        isOpen={depWithModal.open}
        onClose={() => setDepWithModal({ open: false, mode: 'deposit', accountNo: '' })}
        mode={depWithModal.mode}
        account={selectedAccountForDepWith}
        onSubmit={handleDepositWithdraw}
      />
    </div>
  );
}
