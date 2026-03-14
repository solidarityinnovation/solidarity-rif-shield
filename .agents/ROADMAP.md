# AFGE RIF Shield — Development Roadmap
## 4-Phase Plan | Locked: 2026-03-14
## Authority: Project Coordinator (A0)

---

## Phase Overview

| Phase | Name | Focus | Status |
|-------|------|-------|--------|
| 1 | Core Platform | Auth · UI · API · Database | IN PROGRESS |
| 2 | AI Functionality | Chatbot · RAG · Voice Agent | PLANNED |
| 3 | Advanced Features | Geolocation · Analytics · Automation | PLANNED |
| 4 | Scaling & Optimization | Performance · Security · Monitoring | PLANNED |

---

## PHASE 1 — CORE PLATFORM

**Goal:** Establish the complete foundation all AI and advanced features build on.
**Entry Criteria:** None (first phase)
**Exit Criteria:** Auth works · API stable · DB schema locked · UI functional

### Authentication
- [ ] User registration and login (email + password)
- [ ] Multi-factor authentication (TOTP)
- [ ] JWT access + refresh token lifecycle
- [ ] SSO / SAML 2.0 for agency identity providers
- [ ] Role-based access: Member / Union Rep / Org Admin / Super Admin
- [ ] Session management and auto-logout

### Basic UI
- [x] Navy/Gold design system and tokens
- [x] Dashboard with score ring and vitals grid
- [x] Journal logging form with validation
- [x] Training roadmap tab
- [x] Bottom navigation and FAB button
- [x] Onboarding modal (first-run)
- [x] PWA install prompt
- [x] Branded offline fallback page
- [ ] Score history 30-day timeline chart
- [ ] Journal search and category filter
- [ ] iOS PWA fallback UX
- [ ] Form UX: character counters + live validation

### API Structure
- [ ] API Gateway (Kong): routing, JWT validation, rate limiting
- [ ] Auth service: /auth/register, /login, /refresh, /logout
- [ ] User service: /users/me
- [ ] Journal service: CRUD + export endpoints
- [ ] Scoring engine: GET /score, event-driven recalculation
- [ ] Report service: PDF generation endpoints
- [ ] Org service: tenants, members, invites
- [ ] Notification service: push, email

### Database
- [ ] PostgreSQL schema: users, orgs, org_members
- [ ] Journal entries table with full-text search index
- [ ] Score events and history table
- [ ] Course completions table
- [ ] Row-level security (RLS) policies per table
- [ ] Redis: session cache, rate limiting counters
- [ ] WatermelonDB offline schema (mobile)
- [ ] Schema migrations versioned from v1

### Sprint Progress

| Sprint | Feature | Status |
|--------|---------|--------|
| 1 | Critical bug fixes (HTML, CSS, XSS, score) | DONE |
| 2 | Code organization and JSDoc | DONE |
| 3 | Performance and security (CDN, SRI, ARIA) | DONE |
| 4 | PWA hardening (SW, offline, install prompt) | DONE |
| 5 | PDF export hardening | NEXT |
| 6 | Form UX: character counters + live validation | QUEUED |
| 7 | Journal: search + category filter | QUEUED |
| 8 | Training: gap analysis + sort by priority | QUEUED |
| 9 | Score history 30-day chart | QUEUED |
| 10 | Backend API + Clerk auth integration | QUEUED |
| 11 | PostgreSQL schema + RLS | QUEUED |
| 12 | Multi-device sync | QUEUED |

---

## PHASE 2 — AI FUNCTIONALITY

**Goal:** Embed intelligent assistants that help users understand RIF law and log work.
**Entry Criteria:** Phase 1 complete — auth, API, and DB fully operational
**Exit Criteria:** Chatbot live · RAG indexed · Voice logging functional

### Chatbot
- [ ] Chat UI: message thread, streaming response, source citations
- [ ] Claude claude-sonnet-4-6 integration with streaming SSE
- [ ] Context window: user score data injected into system prompt
- [ ] Chat session persistence (stored in DB)
- [ ] Follow-up conversation with context preservation
- [ ] Save response as note / share with rep

### RAG Knowledge System
- [ ] Ingest: 5 CFR Part 351, OPM handbooks, AFGE contracts, MSPB case law
- [ ] Embed documents: OpenAI text-embedding-3-large
- [ ] Upload vectors to Pinecone with namespace segmentation
- [ ] Retrieval pipeline: semantic search + re-ranking
- [ ] Citation generation: source doc + section reference per answer
- [ ] Knowledge refresh pipeline: update docs on regulation changes

### Voice Agent
- [ ] Voice recording UI (push-to-talk)
- [ ] Whisper STT: transcribe audio to text
- [ ] Claude intent parsing: detect category, hours, task from speech
- [ ] Pre-fill journal entry form from voice transcript
- [ ] ElevenLabs TTS: voice response confirmation
- [ ] LiveKit: low-latency real-time voice session
- [ ] Multi-entry detection: one voice session -> multiple log entries

---

## PHASE 3 — ADVANCED FEATURES

**Goal:** Expand platform with data intelligence, automation, and location context.
**Entry Criteria:** Phase 2 complete — AI features stable and tested
**Exit Criteria:** Analytics live · Workflows automated · Geolocation integrated

### Geolocation
- [ ] Optional work location tagging on journal entries
- [ ] Agency office detection (proximity-based auto-fill)
- [ ] Remote vs. in-office tracking for compliance
- [ ] Geofence-based shift detection (opt-in only)
- [ ] Privacy: city-level only, never precise coordinates stored

### Analytics
- [ ] Union rep dashboard: member score distribution histogram
- [ ] At-risk identification: score < 70 + inactive > 7 days
- [ ] Training completion rates across org
- [ ] Engagement metrics: DAU, WAU, streak distributions
- [ ] Org admin: aggregate org health report (PDF)
- [ ] Export: CSV + PDF bulk report for all members
- [ ] Internal BI: Metabase or Grafana dashboards

### Automation Workflows
- [ ] Daily 4pm logging reminder (push notification)
- [ ] Streak recovery alert: missed day warning at 8pm
- [ ] Level-up celebration: push + in-app animation
- [ ] Weekly digest email: score summary + top 3 actions
- [ ] Admin broadcast: org-wide urgent RIF alert
- [ ] AI weekly coaching: personalized action plan generation
- [ ] BullMQ job queue for async PDF, email, notification tasks

---

## PHASE 4 — SCALING AND OPTIMIZATION

**Goal:** Harden for 1M+ users, enterprise orgs, 99.9% uptime SLA.
**Entry Criteria:** Phase 3 complete — all features stable in production
**Exit Criteria:** Load tested 100K concurrent · Security audited · Monitoring live

### Performance Improvements
- [ ] Kubernetes HPA: horizontal pod autoscaling
- [ ] PgBouncer connection pooling for PostgreSQL
- [ ] Redis caching: scores, sessions, frequent reads
- [ ] CDN: CloudFront/Cloudflare for static assets + API edge caching
- [ ] TimescaleDB read replicas for analytics query isolation
- [ ] React Native: code splitting and lazy loading
- [ ] gzip + Brotli compression on all API responses
- [ ] Load test: 100K concurrent users, p95 API < 500ms

### Security Hardening
- [ ] Full OWASP Top 10 audit and remediation
- [ ] Third-party penetration test
- [ ] WAF via Cloudflare (rule-based blocking)
- [ ] Secret rotation policy (JWT keys, DB passwords, API keys)
- [ ] DDoS mitigation at gateway level
- [ ] SOC 2 Type II compliance audit
- [ ] PIV/CAC authentication for federal agency SSO
- [ ] Field-level encryption for highest-sensitivity PII

### Monitoring
- [ ] Datadog APM: traces, metrics, logs across all services
- [ ] Error tracking: Sentry for frontend + backend
- [ ] Uptime monitoring: PagerDuty on-call rotation
- [ ] Database slow query alerts (p95 > 200ms threshold)
- [ ] Custom dashboard: active users, score events, AI queries/min
- [ ] Anomaly detection: unusual login patterns, data export spikes
- [ ] SLA reporting: 99.9% uptime monthly report to org admins
