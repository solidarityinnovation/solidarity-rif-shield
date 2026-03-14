# AFGE RIF Shield — Multi-Agent Development Workflow
## Coordination Protocol v1.0

---

## Agent Roster

| ID | Agent | Profile | Responsibility |
|----|-------|---------|----------------|
| A0 | Project Coordinator | agent0 | Orchestration, sprint planning, commits, user reports |
| A1 | Product Manager | researcher | PRD, user stories, acceptance criteria |
| A2 | Solutions Architect | researcher | Tech spec, function signatures, data shapes |
| A3 | Development | developer | Implementation, targeted edits, validation |
| A4 | QA and Review | hacker | Testing, security audit, quality reports |

## Sprint Lifecycle

COORDINATOR defines sprint goal
  -> PM writes user stories + acceptance criteria
  -> ARCHITECT writes technical spec
  -> DEV implements targeted changes
  -> QA validates and reports
  -> COORDINATOR reviews, commits, updates PROGRESS.md

## Gate Checks

- GATE 1 (PM->Arch): PM output must exist in handoffs/
- GATE 2 (Arch->Dev): Arch spec must name specific files and functions
- GATE 3 (Dev->QA): Dev must have run validation before handoff
- GATE 4 (QA->Commit): QA must report 0 critical failures

## Hard Rules

### Development Agent
1. Read current file state BEFORE any edit
2. Targeted edits only — NO full rewrites
3. Validate after EVERY change
4. JSDoc on ALL new/modified functions
5. escapeHtml() on ALL innerHTML with user content
6. No hard-coded values — use constants
7. Bump _schema version if data structure changes
8. All new CDN scripts must have defer + SRI

### QA Agent
1. Run FULL validation suite — not just new features
2. Check for regressions
3. Security scan: XSS, injection points, exposed data
4. Report line numbers for every failure
5. Grade: PASS / PASS_WITH_WARNINGS / FAIL

## Locked Architecture Decisions

These require Architect + Coordinator approval to change:
1. Single HTML file PWA (until Sprint 10 backend integration)
2. Navy #0f1c3f / Gold #c9a227 design system
3. localStorage primary store (until Sprint 11)
4. escapeHtml() mandatory for all user input in innerHTML
5. Schema version must increment on data structure changes
6. All CDN scripts must have defer + SRI integrity hash
