#!/usr/bin/env python3
"""
Generates Formal Academic Project Report (PDF)
Mini Banking Transaction System with Concurrency Control & Crash Recovery
Graphic Era Hill University - Team GHOST
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)

def create_report():
    pdf_path = os.path.join("docs", "Project_Report_Mini_Banking_System.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0f172a'),
        alignment=1, # Center
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#3b82f6'),
        alignment=1,
        spaceAfter=25
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=14,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )

    code_style = ParagraphStyle(
        'DocCode',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=6
    )

    story = []

    # Title & Metadata
    story.append(Spacer(1, 15))
    story.append(Paragraph("GRAPHIC ERA HILL UNIVERSITY", ParagraphStyle('Inst', fontName='Helvetica-Bold', fontSize=13, alignment=1, textColor=colors.HexColor('#64748b'))))
    story.append(Spacer(1, 5))
    story.append(Paragraph("Department of Computer Science & Engineering", ParagraphStyle('Dept', fontName='Helvetica', fontSize=10, alignment=1, textColor=colors.HexColor('#94a3b8'))))
    story.append(Spacer(1, 15))
    story.append(Paragraph("Mini Banking Transaction System", title_style))
    story.append(Paragraph("Concurrency Control & ARIES Crash Recovery Architecture", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3b82f6'), spaceAfter=15))

    # Team Members Table
    team_data = [
        [Paragraph("<b>Team Member</b>", body_style), Paragraph("<b>Student ID</b>", body_style), Paragraph("<b>Assigned Module</b>", body_style), Paragraph("<b>Email</b>", body_style)],
        [Paragraph("Rohit Negi (Lead)", body_style), Paragraph("24011999", body_style), Paragraph("Architecture & Integration", body_style), Paragraph("rn2919544@gmail.com", body_style)],
        [Paragraph("Sumit Singh Mahar", body_style), Paragraph("240111491", body_style), Paragraph("DBMS & Transactions", body_style), Paragraph("sumitsinghmahar123@gmail.com", body_style)],
        [Paragraph("Mohd Faiz", body_style), Paragraph("240111916", body_style), Paragraph("OS Mutex & Crash Recovery", body_style), Paragraph("faizmohd0220@gmail.com", body_style)],
        [Paragraph("Priyanka Bartwal", body_style), Paragraph("240121452", body_style), Paragraph("Banking Operations", body_style), Paragraph("bartwal190606@gmail.com", body_style)]
    ]
    t = Table(team_data, colWidths=[130, 80, 160, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    # Section 1: Abstract
    story.append(Paragraph("1. Executive Abstract", h1_style))
    story.append(Paragraph(
        "Modern financial computing requires the seamless convergence of Operating Systems (OS) synchronization primitives and Database Management Systems (DBMS) ACID transaction guarantees. This project implements a high-performance banking server capable of executing atomic fund transfers under concurrent multi-threaded workloads, eliminating race conditions through fine-grained per-account mutex locking, mitigating circular wait deadlocks through lexicographical lock sorting, and providing zero-money-loss crash recovery through Write-Ahead Logging (WAL) and the ARIES recovery protocol.",
        body_style
    ))

    # Section 2: Concurrency Control
    story.append(Paragraph("2. Operating System Concurrency Control", h1_style))
    story.append(Paragraph(
        "<b>Race Condition Analysis:</b> In an unsynchronized banking system, concurrent withdrawals cause lost updates due to CPU context switches occurring between balance read and write operations. In our benchmark of 10 concurrent threads each performing ten $10 withdrawals on a $1,000 balance, the unsynchronized balance is corrupted to $770-$880. With per-account mutex locking, the final balance achieves exact mathematical consistency: $0.00.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Deadlock Prevention (Coffman Condition 4):</b> To eliminate the Circular Wait condition during simultaneous cross-account transfers (Transfer A->B vs Transfer B->A), the lock manager enforces a global lexicographical lock hierarchy. Locks are always acquired in sorted order: <code>std::min(acc_a, acc_b)</code> followed by <code>std::max(acc_a, acc_b)</code>.",
        body_style
    ))

    # Section 3: Crash Recovery
    story.append(Paragraph("3. DBMS Architecture & ARIES Crash Recovery", h1_style))
    story.append(Paragraph(
        "<b>Write-Ahead Logging:</b> Before mutating live account balances, log records containing Log Sequence Numbers (LSN), transaction identifiers, action types (START, DEBIT, CREDIT, COMMIT, ABORT), and old/new balances are appended to the WAL.",
        body_style
    ))
    story.append(Paragraph(
        "<b>ARIES Protocol Implementation:</b> The recovery engine executes three distinct phases upon restart: (1) Analysis Phase scans the WAL forward to identify uncommitted 'loser' transactions; (2) Redo Phase ensures committed state is persistent; (3) Undo Phase scans backward and reverts the partial debits of active uncommitted transactions using the saved old_balance, guaranteeing 100% money conservation.",
        body_style
    ))

    # Section 4: Verification Results
    story.append(Paragraph("4. Automated Verification Results", h1_style))
    results_data = [
        [Paragraph("<b>Module Test</b>", body_style), Paragraph("<b>Developer</b>", body_style), Paragraph("<b>Condition Tested</b>", body_style), Paragraph("<b>Result</b>", body_style)],
        [Paragraph("Core Operations", body_style), Paragraph("Priyanka", body_style), Paragraph("Deposit, Withdrawal, Overdraft Rejection", body_style), Paragraph("<font color='#16a34a'><b>PASSED</b></font>", body_style)],
        [Paragraph("Concurrency Race", body_style), Paragraph("Faiz", body_style), Paragraph("100 concurrent withdrawals (Mutex vs No-Mutex)", body_style), Paragraph("<font color='#16a34a'><b>PASSED</b></font>", body_style)],
        [Paragraph("Deadlock Mitigation", body_style), Paragraph("Faiz", body_style), Paragraph("WFG 3-color DFS cycle detection & sorted locks", body_style), Paragraph("<font color='#16a34a'><b>PASSED</b></font>", body_style)],
        [Paragraph("Crash Recovery", body_style), Paragraph("Faiz & Sumit", body_style), Paragraph("Mid-transfer crash + ARIES Undo restoration", body_style), Paragraph("<font color='#16a34a'><b>PASSED</b></font>", body_style)],
    ]
    t2 = Table(results_data, colWidths=[120, 90, 230, 80])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t2)
    story.append(Spacer(1, 15))

    story.append(Paragraph("5. Deployment & Execution Instructions", h1_style))
    story.append(Paragraph("• <b>Local Server & UI:</b> <code>python server.py</code> (Listens on http://localhost:5000)<br/>• <b>Test Suite:</b> <code>python verify_system.py</code><br/>• <b>GitHub Repository:</b> https://github.com/rakeshsinghrawat107/mini-banking-system", body_style))

    doc.build(story)
    print(f"[SUCCESS] PDF Report generated: {pdf_path}")

if __name__ == "__main__":
    create_report()
