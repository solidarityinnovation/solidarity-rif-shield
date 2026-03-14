# Sprint 6 Brief
## From: Coordinator (A0) | To: All Agents
## Date: 2026-03-14

**Sprint Goal:** Form UX Hardening + QA Suite Improvements
**Phase:** Phase 1 — Core Platform
**Sprint:** 6 of 12
**Previous Sprint Commit:** 4c6d2fe

## Context
The log entry form (modal) currently uses browser-native alert() for
validation errors, has no character counters, uses a plain <select> for
category, and uses a plain number input for hours with no step guidance.
This creates a jarring UX gap between the polished design system and the
data entry experience.

Additionally, the QA Agent (Sprint 5) identified 3 improvements needed
in the automated test suite to eliminate false positives.

## Scope for Sprint 6

### Feature A: Character counters on task + notes inputs
Real-time character counter below each text input/textarea.
Task field: max 500 chars. Notes field: max 1000 chars.
Counter turns amber at 80%, red at 95%, blocks submit at 100%.

### Feature B: Live inline validation (replace alert())
Replace all alert() validation calls with inline error messages
appearing directly below the offending field.
Errors clear automatically when user corrects the input.
Form cannot submit while any error is visible.

### Feature C: Category selector UX improvement
Replace the plain <select> with a styled button-grid selector.
Each category displays its icon + label.
5 categories: Seniority, Performance, Awards, Tenure, Veterans.
Selected state uses gold border + navy background.
Must remain keyboard accessible (tab + enter/space).

### Feature D: Hours input UX improvement
Replace plain number input with a stepper control.
Buttons: minus (-) and plus (+) flanking the value display.
Step: 0.25 hours. Min: 0.25. Max: 24.
Value displayed as formatted decimal (e.g. "2.50 hrs").
Direct text entry still supported.

### Fix: QA Suite improvements (Sprint 5 carry-over)
1. Exclude gen.js from single-file architecture check (alongside sw.js)
2. Scope canvas DOM check to drawScoreRingCanvas function body only
3. Raise @returns JSDoc threshold from >=8 to >=15

## Out of Scope
- Journal search / filter (Sprint 7)
- Training gap analysis (Sprint 8)
- Score history chart (Sprint 9)
- Any backend changes
- Any authentication changes
- Any PWA / Service Worker changes
- iOS PWA install fallback (Sprint 7)

## Constraints
- Single HTML file architecture preserved
- No new CDN dependencies
- Navy/Gold design tokens only (amber/red for validation states APPROVED)
- escapeHtml() on all rendered user input
- All new functions must have JSDoc
- No alert(), confirm(), or prompt() calls
- Keyboard accessibility required on category selector
