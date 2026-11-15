#!/usr/bin/env python3
"""
Generates Graphic Era Hill University Viva Presentation (.pptx)
Mini Banking Transaction System with Concurrency Control & Crash Recovery
Team GHOST
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    DARK_BG = RGBColor(11, 15, 25)
    CARD_BG = RGBColor(19, 29, 51)
    ACCENT_BLUE = RGBColor(59, 130, 246)
    ACCENT_GREEN = RGBColor(16, 185, 129)
    TEXT_WHITE = RGBColor(248, 250, 252)
    TEXT_MUTED = RGBColor(148, 163, 184)

    def add_background(slide):
        shape = slide.shapes.add_shape(1, 0, 0, Inches(13.333), Inches(7.5)) # Rectangle
        shape.fill.solid()
        shape.fill.fore_color.rgb = DARK_BG
        shape.line.fill.background()

    def add_header(slide, title, subtitle):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(1.2))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(28)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE

        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.size = Pt(13)
        p2.font.color.rgb = ACCENT_BLUE

    # Slide 1: Title Slide
    s1 = prs.slides.add_slide(blank_layout)
    add_background(s1)
    
    tb = s1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.3), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "GRAPHIC ERA HILL UNIVERSITY"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE
    
    p = tf.add_paragraph()
    p.text = "Mini Banking Transaction System"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    
    p = tf.add_paragraph()
    p.text = "With Fine-Grained Concurrency Control and ARIES Crash Recovery"
    p.font.size = Pt(20)
    p.font.color.rgb = ACCENT_GREEN
    
    p = tf.add_paragraph()
    p.text = "\nTeam: GHOST  |  Department of Computer Science & Engineering"
    p.font.size = Pt(14)
    p.font.color.rgb = TEXT_MUTED

    p = tf.add_paragraph()
    p.text = "• Rohit Negi (Lead & Integration) — ID: 24011999\n• Sumit Singh Mahar (DBMS Developer) — ID: 240111491\n• Mohd Faiz (OS & Recovery Developer) — ID: 240111916\n• Priyanka Bartwal (Banking Operations Developer) — ID: 240121452"
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_WHITE

    # Slides Data
    slides_content = [
        (
            "Project Overview & Architectural Motivation",
            "Operating Systems (OS) & Database Management Systems (DBMS) Convergence",
            [
                ("High-Concurrency Workload", "In modern financial systems, hundreds of simultaneous transactions operate over shared accounts, triggering race conditions and lost updates without synchronization."),
                ("Deadlock Vulnerability", "Simultaneous cross-account transfers (e.g., Transfer A->B vs B->A) induce Coffman's circular wait condition, deadlocking worker threads indefinitely."),
                ("Crash Atomicity Failure", "A hardware or power failure mid-way through a transfer (after deducting from A but before crediting B) results in missing financial assets without recovery."),
                ("Unified Solution Architecture", "We synthesize fine-grained account mutexes, lexicographical lock sorting, Wait-For Graph cycle detection, and Write-Ahead Logging (ARIES) into a unified high-performance platform.")
            ]
        ),
        (
            "Module 1: Core Banking Operations & Invariants",
            "Lead Developer: Priyanka Bartwal — Business Logic & Validation",
            [
                ("Account Management", "Unique account number generation (ACC1001..ACC1005) with holder metadata, active/frozen status checks, and initial deposit processing."),
                ("Balance Non-Negative Invariant", "Rigorous enforcement of balance >= $0.00 at both application logic layer and database CHECK constraint level, completely eliminating overdraft anomalies."),
                ("Atomic Fund Transfers", "Multi-step transactional validation ensuring sender and receiver accounts are distinct, valid, and have verified liquidity prior to critical section execution."),
                ("Audit & Ledger Generation", "Cryptographically unique transaction hashes (TXN-YYYYMMDD-XXXX) recorded to the permanent immutable ledger table for tracking.")
            ]
        ),
        (
            "Module 2: DBMS Architecture & ACID Transactions",
            "Lead Developer: Sumit Singh Mahar — PostgreSQL / Supabase Relational Engine",
            [
                ("Relational Schema Design", "Dedicated 'banking' schema featuring accounts, transactions, wal_logs, and audit_log tables indexed on primary lookup keys."),
                ("ACID Atomicity & RAII Wrapper", "C++ RAII Transaction class issuing BEGIN upon acquisition, COMMIT upon verified completion, and automatic ROLLBACK during any abnormal exit or exception."),
                ("SQL Injection Immunity", "All SQL interactions use prepared parameterized queries with $1, $2 (or ? in SQLite) placeholders, strictly treating user input as literal data values."),
                ("Views & Historical Reporting", "Optimized database views ('transaction_history' and 'account_summary') pre-aggregating transaction counts and counterparty holder names.")
            ]
        ),
        (
            "Module 3: OS Concurrency Control & Mutex Synchronization",
            "Lead Developer: Mohd Faiz — Thread Safety & Race Condition Elimination",
            [
                ("The Race Condition Problem", "10 concurrent worker threads executing ten $10 withdrawals on a $1,000 balance without synchronization result in lost updates ($770-$880 corrupted balance)."),
                ("Fine-Grained Account Locks", "Instead of a bottleneck global lock, each individual account is assigned an independent std::mutex inside AccountLockManager."),
                ("High Throughput Scaling", "Transfers involving independent account pairs (e.g., ACC1->ACC2 and ACC3->ACC4) execute in 100% parallel with zero contention or delay."),
                ("Mathematical Consistency", "With scoped unique_lock protection on account critical sections, the 100-withdrawal test achieves exact mathematical consistency: $0.00.")
            ]
        ),
        (
            "Module 4: Deadlock Handling (WFG & Lock Ordering)",
            "Lead Developer: Mohd Faiz — Coffman Condition Mitigation & Graph Theory",
            [
                ("Coffman Circular Wait", "Thread 1 holds Lock A, requests Lock B. Thread 2 holds Lock B, requests Lock A. Both threads stall permanently."),
                ("Prevention via Lexicographical Sorting", "Transfers always acquire locks in global alphabetical order: std::min(acc_a, acc_b) locked first, then std::max(acc_a, acc_b). Circular wait is mathematically eliminated!"),
                ("Wait-For Graph (WFG) Detection", "Runtime directed graph where edge (Ti -> Tj) signifies Ti is waiting on a lock held by Tj."),
                ("3-Color DFS Cycle Algorithm", "Runs cycle detection (WHITE=unvisited, GRAY=active, BLACK=finished). A back-edge to a GRAY node confirms a cycle; a victim thread is aborted to break the deadlock.")
            ]
        ),
        (
            "Module 5: Crash Recovery Engine (Write-Ahead Logging & ARIES)",
            "Developers: Mohd Faiz & Sumit Singh Mahar — Durability & Fault Tolerance",
            [
                ("Write-Ahead Logging (WAL)", "Before any database table or balance is modified, a WAL record with unique Log Sequence Number (LSN), old_balance, and new_balance is committed to disk."),
                ("ARIES Analysis Phase", "Upon startup or crash recovery, scans WAL sequentially to identify committed transactions vs uncommitted loser transactions interrupted by failure."),
                ("ARIES Redo Phase", "Ensures that all committed transactions have their modifications fully persisted to the storage layer, satisfying ACID Durability."),
                ("ARIES Undo Phase", "Iterates backward through WAL records of active loser transactions, restoring old_balance values to reverse partial debits. 100% money conservation is restored!")
            ]
        ),
        (
            "Module 6: Full-Stack Integration & REST Dashboard",
            "Lead Developer: Rohit Negi — System Architecture & Premium Frontend",
            [
                ("8-Worker Thread Pool", "FastAPI / cpp-httplib multi-threaded dispatcher routing concurrent client requests to worker threads with CORS enabled."),
                ("Hybrid Database Storage", "Seamless auto-detection: connects to cloud Supabase PostgreSQL or falls back to local SQLite storage with demo accounts pre-seeded."),
                ("Premium React 18 Dashboard", "Modern fintech single-page application built to strict UI standards: Accounts Directory, Transfer Terminal, WAL Inspector, and Concurrency Lab."),
                ("Automated Verification Suite", "verify_system.py test suite validating all 4 modules (Banking, Mutex Race, WFG Cycle, ARIES Undo) with 100% test pass rate.")
            ]
        ),
        (
            "Viva Examination Preparation & Key Takeaways",
            "Graphic Era Hill University — Evaluation Highlights",
            [
                ("Q: How does the system handle high load without deadlocking?", "Answer: By combining per-account mutexes with lexicographical lock sorting. Contention is isolated per account, and global lock ordering eliminates circular wait."),
                ("Q: What happens if a power failure hits mid-transfer?", "Answer: The WAL recorded the old balance before the debit occurred. The recovery daemon runs ARIES analysis, marks the transaction as uncommitted, and undoes the partial debit."),
                ("Q: What are the primary deliverables completed?", "Answer: C++ core, Python cross-platform REST server, Supabase schema, React 18 UI dashboard, automated test suite, and complete technical documentation."),
                ("Demonstration Status", "Live system online on port 5000, verified passing all unit and concurrency tests, with complete source code published on GitHub.")
            ]
        )
    ]

    for title, subtitle, cards in slides_content:
        slide = prs.slides.add_slide(blank_layout)
        add_background(slide)
        add_header(slide, title, subtitle)

        # 4 cards in 2x2 grid
        coords = [
            (Inches(0.8), Inches(1.8)),
            (Inches(6.8), Inches(1.8)),
            (Inches(0.8), Inches(4.5)),
            (Inches(6.8), Inches(4.5))
        ]

        for idx, (ctitle, cdesc) in enumerate(cards):
            left, top = coords[idx]
            card = slide.shapes.add_shape(1, left, top, Inches(5.7), Inches(2.4)) # Rectangle
            card.fill.solid()
            card.fill.fore_color.rgb = CARD_BG
            card.line.color.rgb = RGBColor(38, 53, 84)

            tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), Inches(5.3), Inches(2.0))
            tf = tb.text_frame
            tf.word_wrap = True

            p = tf.paragraphs[0]
            p.text = ctitle
            p.font.size = Pt(16)
            p.font.bold = True
            p.font.color.rgb = ACCENT_GREEN

            p2 = tf.add_paragraph()
            p2.text = cdesc
            p2.font.size = Pt(12)
            p2.font.color.rgb = TEXT_MUTED

    os.makedirs("docs", exist_ok=True)
    out_path = os.path.join("docs", "Mini_Banking_System_Viva_Presentation.pptx")
    prs.save(out_path)
    print(f"[SUCCESS] Presentation generated: {out_path}")

if __name__ == "__main__":
    create_presentation()
