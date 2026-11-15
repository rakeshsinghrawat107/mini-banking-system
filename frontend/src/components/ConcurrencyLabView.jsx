import React, { useState } from 'react';
import {
  IconCpu,
  IconLock,
  IconZap,
  IconAlertTriangle,
  IconCheckCircle,
  IconRefreshCw,
  IconShieldCheck
} from './Icons';
import { api } from '../api';

export default function ConcurrencyLabView({ onExperimentCompleted }) {
  const [raceLoading, setRaceLoading] = useState(false);
  const [raceResult, setRaceResult] = useState(null);

  const [deadlockLoading, setDeadlockLoading] = useState(false);
  const [deadlockResult, setDeadlockResult] = useState(null);

  const [crashLoading, setCrashLoading] = useState(false);
  const [crashResult, setCrashResult] = useState(null);

  // Experiment 1: Race Condition
  const runRaceExperiment = async () => {
    setRaceLoading(true);
    try {
      const data = await api.getRaceDemo();
      setRaceResult(data);
    } catch (err) {
      alert(`Error running race demo: ${err.message}`);
    } finally {
      setRaceLoading(false);
    }
  };

  // Experiment 2: Deadlock
  const runDeadlockExperiment = async () => {
    setDeadlockLoading(true);
    try {
      const data = await api.getDeadlockDemo();
      setDeadlockResult(data);
    } catch (err) {
      alert(`Error running deadlock demo: ${err.message}`);
    } finally {
      setDeadlockLoading(false);
    }
  };

  // Experiment 3: Crash Recovery
  const runCrashExperiment = async () => {
    setCrashLoading(true);
    try {
      const data = await api.getCrashDemo();
      setCrashResult(data);
      if (onExperimentCompleted) onExperimentCompleted();
    } catch (err) {
      alert(`Error running crash recovery demo: ${err.message}`);
    } finally {
      setCrashLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Operating System & DBMS Concurrency Lab</h2>
          <p>Interactive verification laboratory demonstrating race conditions, Wait-For Graph deadlock cycles, and ARIES recovery.</p>
        </div>
      </div>

      {/* Experiment 1: Race Condition */}
      <div className="lab-card">
        <div className="lab-card-header">
          <div className="lab-title-area">
            <h4>
              <IconCpu size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>Experiment 1: Concurrent Balance Updates & Race Conditions</span>
            </h4>
            <p>
              Workload: 10 concurrent threads each performing ten $10 withdrawals on a starting balance of $1,000.00. Expected final balance: <strong>$0.00</strong>.
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={runRaceExperiment}
            disabled={raceLoading}
          >
            <IconZap size={14} />
            <span>{raceLoading ? 'Simulating Threads...' : 'Run Race Test'}</span>
          </button>
        </div>

        {raceResult && (
          <div className="lab-result-box">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              
              <div style={{ background: 'var(--accent-danger-soft)', border: '1px solid var(--danger-border)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: 'var(--danger-text)', fontWeight: 700, fontSize: '0.85rem' }}>
                  Without Mutex Locking (Race Condition Active)
                </div>
                <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger-text)', marginTop: '0.35rem' }}>
                  ${parseFloat(raceResult.without_mutex_result).toFixed(2)}
                </div>
                <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  CORRUPTED by lost updates during context switches!
                </div>
              </div>

              <div style={{ background: 'var(--accent-success-soft)', border: '1px solid var(--success-border)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: 'var(--success-text)', fontWeight: 700, fontSize: '0.85rem' }}>
                  With Account Mutex Locking (std::mutex)
                </div>
                <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-text)', marginTop: '0.35rem' }}>
                  ${parseFloat(raceResult.with_mutex_result).toFixed(2)}
                </div>
                <div style={{ color: 'var(--accent-success)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  EXACT 100% mathematical consistency preserved!
                </div>
              </div>

            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong>OS Principle:</strong> Critical section mutual exclusion guarantees that no thread overwrites another thread's intermediate state during rapid CPU context switches.
            </div>
          </div>
        )}
      </div>

      {/* Experiment 2: Deadlock Detection & Prevention */}
      <div className="lab-card">
        <div className="lab-card-header">
          <div className="lab-title-area">
            <h4>
              <IconLock size={20} style={{ color: 'var(--accent-warning)' }} />
              <span>Experiment 2: Wait-For Graph (WFG) & Lexicographical Deadlock Prevention</span>
            </h4>
            <p>
              Simulates two concurrent transfers with opposite lock order dependencies (ACC1001 &rarr; ACC1002 vs ACC1002 &rarr; ACC1001) inducing circular wait.
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={runDeadlockExperiment}
            disabled={deadlockLoading}
          >
            <IconLock size={14} />
            <span>{deadlockLoading ? 'Detecting Cycle...' : 'Run Deadlock Test'}</span>
          </button>
        </div>

        {deadlockResult && (
          <div className="lab-result-box">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="lab-metric-row">
                <span style={{ color: 'var(--text-secondary)' }}>Detected Circular Wait Cycle:</span>
                <span className="mono" style={{ color: 'var(--accent-danger)', fontWeight: 700 }}>
                  {deadlockResult.wfg_cycle_detected.join(' -> ')}
                </span>
              </div>
              <div className="lab-metric-row">
                <span style={{ color: 'var(--text-secondary)' }}>WFG 3-Color DFS Resolution:</span>
                <span className="badge badge-abort">{deadlockResult.resolution}</span>
              </div>
              <div className="lab-metric-row">
                <span style={{ color: 'var(--text-secondary)' }}>Prevention Mechanism:</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{deadlockResult.prevention_mechanism}</span>
              </div>
              <div className="lab-metric-row">
                <span style={{ color: 'var(--text-secondary)' }}>Global Order Enforced:</span>
                <span className="mono" style={{ color: 'var(--accent-success)' }}>{deadlockResult.order_enforced}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Experiment 3: Crash Recovery */}
      <div className="lab-card">
        <div className="lab-card-header">
          <div className="lab-title-area">
            <h4>
              <IconShieldCheck size={20} style={{ color: 'var(--accent-cyan)' }} />
              <span>Experiment 3: Mid-Transfer Crash Injection & ARIES WAL Undo Recovery</span>
            </h4>
            <p>
              Simulates a sudden power outage after money was debited from Account A, but before being credited to Account B.
            </p>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={runCrashExperiment}
            disabled={crashLoading}
          >
            <IconAlertTriangle size={14} />
            <span>{crashLoading ? 'Recovering...' : 'Inject Crash & Recover'}</span>
          </button>
        </div>

        {crashResult && (
          <div className="lab-result-box">
            <div style={{ marginBottom: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {crashResult.crash_scenario}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Corrupted Balance Post-Crash</div>
                <div className="mono" style={{ fontSize: '1.25rem', color: 'var(--accent-danger)', fontWeight: 700 }}>
                  ${crashResult.state_before_recovery.ACC1001_balance.toFixed(2)}
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-default)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Restored Balance via ARIES Undo</div>
                <div className="mono" style={{ fontSize: '1.25rem', color: 'var(--accent-success)', fontWeight: 700 }}>
                  ${crashResult.state_after_recovery.ACC1001_restored_balance.toFixed(2)}
                </div>
              </div>
            </div>

            <div style={{ color: 'var(--accent-success)', fontSize: '0.8rem', fontWeight: 600 }}>
              &check; {crashResult.consistency_guarantee}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
