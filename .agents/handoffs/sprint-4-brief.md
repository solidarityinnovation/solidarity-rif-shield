# Sprint 4 Brief
## From: Coordinator (A0) | To: All Agents

**Sprint Goal:** Service Worker & PWA Hardening
**Priority:** P1 — Required for production PWA

## Context
The app is a single-file PWA (index.html) deployed on Render.com.
The existing sw.js Service Worker uses cache name "rif-v1" with no version strategy.
Users report stale cache issues after deploys. There is no offline fallback page.
There is no PWA install prompt handling.

## Scope for Sprint 4
1. Service Worker cache versioning (auto-bump on deploy)
2. Offline fallback: graceful message when network unavailable
3. PWA install prompt: capture beforeinstallprompt, show custom install button
4. Update sw.js registration in index.html

## Out of Scope
- Background sync (Sprint 5)
- Push notifications (Sprint 6)
- Any backend changes

## Constraints
- Single HTML file architecture must be preserved
- Design system colors must not change
- No new CDN dependencies without SRI hash
