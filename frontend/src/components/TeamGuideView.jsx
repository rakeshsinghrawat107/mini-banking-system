import React from 'react';
import {
  IconShieldCheck,
  IconUsers,
  IconDatabase,
  IconCpu,
  IconBank,
  IconLock
} from './Icons';

export default function TeamGuideView() {
  const members = [
    {
      name: "Rohit Negi",
      id: "24011999",
      role: "Team Leader & System Architecture",
      email: "rn2919544@gmail.com",
      deliverables: "End-to-end integration, CLI main dispatcher, HTTP REST server (ThreadPool: 8), automated verification runner.",
      files: "src/main.cpp, src/routes.cpp, Makefile, server.py, verify_system.py"
    },
    {
      name: "Sumit Singh Mahar",
      id: "240111491",
      role: "DBMS & Transactions Developer",
      email: "sumitsinghmahar123@gmail.com",
      deliverables: "PostgreSQL / Supabase relational schema, parameterized SQL statements ($1, $2), ACID Transaction RAII wrapper (BEGIN, COMMIT, ROLLBACK).",
      files: "sql/schema.sql, sql/seed.sql, src/db.hpp, src/db.cpp"
    },
    {
      name: "Mohd Faiz",
      id: "240111916",
      role: "OS & Recovery Developer",
      email: "faizmohd0220@gmail.com",
      deliverables: "Granular per-account mutex locks, sorted lock hierarchy (deadlock prevention), Wait-For Graph cycle detection, Write-Ahead Logging & ARIES recovery engine.",
      files: "src/concurrency.hpp, src/deadlock.hpp, src/recovery.cpp"
    },
    {
      name: "Priyanka Bartwal",
      id: "240121452",
      role: "Banking Operations Developer",
      email: "bartwal190606@gmail.com",
      deliverables: "Core business logic: account creation, balance checking, deposit, withdrawal, multi-account transfers, overdraft protection.",
      files: "src/banking.hpp, src/banking.cpp, src/common.hpp"
    }
  ];

  const vivaQuestions = [
    {
      q: "How does the system eliminate race conditions when multiple clients withdraw simultaneously?",
      a: "By allocating an independent std::mutex to each bank account. Any balance modification executes inside a scoped lock_guard / unique_lock, serializing conflicting access without blocking independent accounts."
    },
    {
      q: "How does your system prevent circular wait deadlocks (Transfer A->B vs B->A)?",
      a: "We break Coffman's 4th condition (Circular Wait) through lexicographical lock ordering: locks are always acquired in strictly sorted order (std::min(A, B) locked first, followed by std::max(A, B)). Both threads acquire locks in the exact same global order, making circular waiting mathematically impossible."
    },
    {
      q: "What protocol does the Crash Recovery engine implement, and how does it guarantee money conservation?",
      a: "It implements the ARIES recovery protocol. Balance modifications are written to the Write-Ahead Log (WAL) before updating database tables. If a crash occurs mid-transfer, the Analysis phase identifies the uncommitted transaction, and the Undo phase uses the recorded old_balance to roll back partial debits."
    },
    {
      q: "How is SQL Injection prevented?",
      a: "All database statements use parameterized queries with $1, $2 placeholders (or ? in SQLite) executed via PQexecParams. User input is treated strictly as literal data, never concatenated into SQL query strings."
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Project Viva & Technical Guide</h2>
          <p>Academic DBMS + Operating Systems Project &bull; Graphic Era Hill University &bull; Team GHOST</p>
        </div>
      </div>

      {/* Member Responsibilities */}
      <div className="card-panel">
        <div className="card-header">
          <h3>
            <IconUsers size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Team Division of Responsibilities</span>
          </h3>
        </div>
        <div className="card-body">
          <div className="member-grid">
            {members.map(m => (
              <div key={m.id} className="member-card">
                <h4>{m.name}</h4>
                <div className="role">{m.role}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Student ID: {m.id} &bull; {m.email}
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.65rem' }}>
                  {m.deliverables}
                </p>
                <div className="files">
                  {m.files}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Viva Q&A Accordion */}
      <div className="card-panel">
        <div className="card-header">
          <h3>
            <IconShieldCheck size={18} style={{ color: 'var(--accent-success)' }} />
            <span>High-Yield Viva Examination Questions</span>
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {vivaQuestions.map((vq, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-input)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.45rem' }}>
                  Q{idx + 1}: {vq.q}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  <strong>Answer:</strong> {vq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
