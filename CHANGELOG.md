# AFGE RIF Shield — Changelog

---

## Version 2 — Claude Review Improvements
**Date:** 2026-03-13
**Commit:** e73bf85
**Tag:** v2.0

### Summary
Full professional redesign and bug fix pass based on expert code review.

### Design Changes
- New design system: Navy #0f1c3f, Gold #c9a227, Slate #8fa3cc
- Typography: Plus Jakarta Sans (body) + DM Mono (numbers)
- SVG circular ring progress indicator on dashboard hero
- Animated gold XP bar with shimmer effect
- 2x2 Career Vitals grid replacing emoji metric rows
- Scrollable level chips row (L1–L5) with active/done states
- Sticky dark navy header with live streak badge
- Reduced emoji usage — replaced section labels with clean text
- Cleaner bottom navigation with active indicator bar

### New Features
- Onboarding modal (3-step, first-visit only, localStorage flagged)
- Floating Action Button (gold + circle, Dashboard & Journal)
- Live radar chart (Chart.js, all 5 score dimensions)
- Dynamic top recommendation (auto-detects biggest score gap)
- Course toggle persistence (mark complete, localStorage stored)
- 7-day streak dots with day labels
- Data persistence warning on Reports screen

### Bug Fixes
- generatePDF(): completely rewritten as self-contained function
- Streak counter: now live on every render (header + dashboard)
- Courses Done: reads from localStorage, no longer hardcoded to 3
- Week summary: uses real journal data filtered to current week

### Files Changed
- index.html: 486 insertions, 239 deletions (285 → 532 lines)

---

## Version 1 — Initial Build
**Date:** 2026-03-09
**Commit:** 19791f4
**Tag:** v1.0

### Summary
Initial PWA build with core features.

### Features
- Dashboard with live rating calculator (72/100 → Level display)
- Daily journal with task/impact/hours/notes logging
- Training roadmap with recommended federal courses
- PDF Manager Review Packet generator (jsPDF)
- localStorage data persistence (offline-first)
- AFGE Blue/Gold color scheme
- iPhone/Android PWA install support (manifest + service worker)
- JSON data backup export
- Share score feature
