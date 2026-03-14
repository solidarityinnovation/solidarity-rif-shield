# Sprint 5 Brief
## From: Coordinator (A0) | To: All Agents
## Date: 2026-03-14

**Sprint Goal:** PDF Export Hardening + Offline Status Indicator
**Phase:** Phase 1 — Core Platform
**Priority:** P1

## Context
The app uses jsPDF loaded via CDN with `defer` attribute. The current
generatePDF() function calls jsPDF immediately on button click, which
creates a race condition — if jsPDF hasn't finished loading when the
user clicks the button, the PDF silently fails with a JS error.

The current PDF report also lacks:
- An SVG/canvas score ring visual (text-only score currently)
- Legal citations section (5 CFR Part 351 references)
- Proper named file output (currently generic filename)
- iOS Safari download compatibility (Safari requires Blob + anchor approach)

Additionally, the QA Agent (Sprint 4) recommended:
- An offline connection status banner in the main app UI using navigator.onLine
- iOS Safari install fallback UX (no beforeinstallprompt support)

## Scope for Sprint 5

### Feature A: defer-safe PDF generation
Guard jsPDF initialization against race condition.
Button must be disabled until jsPDF is confirmed loaded.

### Feature B: Score ring in PDF
Render a canvas-based score ring inside the PDF document.
Must reflect the user's actual current score and level.

### Feature C: Legal citations section in PDF
Add a footer section citing relevant federal regulations:
- 5 CFR Part 351 (RIF regulations)
- 5 CFR 351.501 (retention standing)
- 5 CFR 351.701 (bump and retreat rights)
- OPM RIF guidance reference

### Feature D: Named PDF file + iOS download fix
Output file: RIF-Shield-Report-YYYY-MM-DD.pdf
Fix iOS Safari download: use Blob URL + programmatic anchor click.

### Feature E: Offline status banner
Show a subtle banner when navigator.onLine === false.
Dismiss automatically when connectivity returns.
Must not block UI or overlap bottom nav.

## Out of Scope
- iOS PWA install fallback UX (Sprint 6)
- QA regression suite test pattern fixes (Sprint 6)
- Backend PDF generation (Phase 1 Sprint 10+)
- Any authentication changes
- Any design system changes

## Constraints
- Single HTML file architecture preserved
- No new CDN dependencies without SRI hash
- Navy/Gold design tokens only
- escapeHtml() on all user data in PDF text
- All new functions must have JSDoc
