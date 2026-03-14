# AFGE RIF Shield — Multi-Agent Development Workflow
## Standard Operating Protocol v2.0
## Locked: 2026-03-14 | Authority: Project Coordinator (A0)

---

## ⚠️  MANDATORY 6-STEP SEQUENCE

> ALL project updates follow this sequence.
> NO steps may be skipped.
> NO coding begins before Step 3 approval.

```
┌─────────────────────────────────────────────────────────────┐
│              MANDATORY DEVELOPMENT SEQUENCE                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STEP 1 ── PRODUCT MANAGER AGENT                           │
│            Produces product specification                   │
│            User stories · Acceptance criteria · Edge cases  │
│            Output: sprint-N-pm-output.md                    │
│                         │                                   │
│                         ▼                                   │
│  STEP 2 ── SOLUTIONS ARCHITECT AGENT                       │
│            Designs system architecture                      │
│            Files · Functions · Data shapes · Risks          │
│            Output: sprint-N-arch-output.md                  │
│                         │                                   │
│                         ▼                                   │
│  STEP 3 ── PROJECT COORDINATOR REVIEWS ◀── GATE            │
│            Approves architecture before coding begins       │
│            Checks against locked architecture decisions      │
│            ✅ APPROVE → proceed to Step 4                   │
│            ❌ REJECT  → return to Step 1 or 2               │
│                         │                                   │
│                    APPROVED ONLY                            │
│                         │                                   │
│                         ▼                                   │
│  STEP 4 ── DEVELOPMENT AGENT                               │
│            Builds features in modular phases                │
│            Targeted edits · JSDoc · No rewrites             │
│            Output: sprint-N-dev-output.md                   │
│                         │                                   │
│                         ▼                                   │
│  STEP 5 ── QA AGENT TESTS ◀── GATE                        │
│            Tests each development phase                     │
│            Regression · Security · Performance              │
│            ✅ PASS    → proceed to Step 6                   │
│            ❌ FAIL    → return to Step 4                    │
│            Output: sprint-N-qa-report.md                    │
│                         │                                   │
│                    QA PASSED ONLY                           │
│                         │                                   │
│                         ▼                                   │
│  STEP 6 ── COORDINATOR SUMMARIZES                          │
│            Reviews QA · Commits to git · Updates PROGRESS  │
│            Plans next iteration · Reports to user           │
│            Output: Git commit + Sprint summary              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Roster

| Step | Agent | ID | Profile | Blocked By |
|------|-------|----|---------|------------|
| 1 | Product Manager | A1 | researcher | Sprint brief from Coordinator |
| 2 | Solutions Architect | A2 | researcher | PM output in handoffs/ |
| 3 | Project Coordinator | A0 | agent0 | Arch spec complete |
| 4 | Development | A3 | developer | Coordinator Step 3 approval |
| 5 | QA & Review | A4 | hacker | Dev output in handoffs/ |
| 6 | Project Coordinator | A0 | agent0 | QA PASS grade |

---

## Gate Definitions

### GATE A — Before Step 4 (No Coding Without Approval)
Coordinator must confirm ALL of the following:
- [ ] PM output exists: handoffs/sprint-N-pm-output.md
- [ ] Arch spec exists: handoffs/sprint-N-arch-output.md
- [ ] Arch spec names specific files and function signatures
- [ ] No conflicts with locked architecture decisions
- [ ] Scope is bounded — no feature creep

### GATE B — Before Step 6 (No Commit Without QA)
QA report must confirm ALL of the following:
- [ ] QA report exists: handoffs/sprint-N-qa-report.md
- [ ] Grade is PASS or PASS_WITH_WARNINGS (not FAIL)
- [ ] Zero critical security failures
- [ ] Zero regressions from prior sprints

---

## Development Agent Hard Rules

1. Read current file state BEFORE any edit
2. Targeted edits only — NO full rewrites of large files
3. ONE module at a time — validate after each change
4. JSDoc on ALL new or modified functions
5. escapeHtml() on ALL innerHTML containing user data
6. No hard-coded values — use named constants
7. Bump _schema version if data structure changes
8. New CDN scripts must have defer + SRI integrity hash
9. No scope expansion without Coordinator approval

---

## Locked Architecture Decisions

Require Architect + Coordinator joint approval to change:

1. Single HTML file PWA structure (until Sprint 11)
2. Navy #0f1c3f / Gold #c9a227 design system
3. localStorage primary data store (until Sprint 12)
4. escapeHtml() mandatory for all user input in innerHTML
5. Schema version must increment on data structure changes
6. All CDN scripts must carry defer + SRI integrity hash
7. SW cache name format: rif-shield-vN (monotonic integer)
8. No skipWaiting() in Service Worker
