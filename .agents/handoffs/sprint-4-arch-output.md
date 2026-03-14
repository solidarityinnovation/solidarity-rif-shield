# Sprint 4 Architecture Specification
## Author: Agent A2 — Solutions Architect
## Date: 2026-03-14
## Sprint Goal: Service Worker & PWA Hardening

---

## Preamble: Source State Audit

Before specifying changes, the following current-state facts were confirmed by reading live files:

| Item | Current State | Problem |
|------|--------------|---------|
| `sw.js` CACHE_NAME | `'rif-shield-v1'` (hardcoded string) | No version strategy; stale on deploy |
| `sw.js` install handler | Calls `self.skipWaiting()` | Forces immediate SW activation — violates multi-tab safety (PM Edge Case 2) |
| `sw.js` fetch fallback | `caches.match('./index.html')` on offline navigate | Serves full app shell; no branded fallback |
| `sw.js` ASSETS manifest | `['./', './index.html', './manifest.json']` | Missing `sw.js`; no offline content |
| `index.html` SW registration | `register('sw.js').catch(function(){})` | Silent error swallow; no update hook |
| `index.html` install prompt | None | Feature C entirely absent |
| Design tokens | `--navy:#0f1c3f`, `--gold:#c9a227` et al. in `:root` | Confirmed present; must not change |
| Module structure | 12 banner-delimited modules; INITIALIZATION at bottom of `<script>` | Known insertion landmarks |
| `_schema` version | Present in `saveData()` metadata | Confirmed; bump only on data structure change |

---

## 1. Feature A — Service Worker Cache Versioning

### 1.1 Cache Version Constant

**File:** `sw.js`

Remove the existing `CACHE_NAME` constant declaration entirely.

Replace with two constants at the very top of `sw.js`, before all event listeners:

**Constant 1: `CACHE_VERSION`**
- Type: `string`
- Initial value: `'rif-shield-v2'`
- Format rule: `rif-shield-v{N}` where `{N}` is a monotonic positive integer.
- Increment rule: Developer manually increments `{N}` in `sw.js` before each deployment that modifies any file in `ASSETS`. Render.com static hosting has no build pipeline for automated cache-busting — manual bumping is the correct strategy.
- Starting at `v2` because the legacy cache key `'rif-shield-v1'` must be treated as stale and purged on first activation.

**Constant 2: `OFFLINE_SHELL`**
- Type: `string` (template literal, multiline)
- Purpose: Inline HTML document served as a `new Response(...)` for the branded offline fallback. Full content specification in Section 2.2.
- Placement: Immediately after `CACHE_VERSION`, before the `ASSETS` array declaration.

### 1.2 Cache Manifest (`ASSETS` Array)

**File:** `sw.js`

Retain constant name `ASSETS`. Update value to exactly these four entries in this order:

```
'./
'./index.html'
'./manifest.json'
'./sw.js'
```

Do NOT add `'./offline.html'` — no separate offline file exists. Locked architecture decision #1 mandates single HTML file until Sprint 10. The offline fallback is served from the `OFFLINE_SHELL` string constant.

Do NOT add Google Fonts URLs or CDN script URLs. These return opaque responses (`response.type === 'opaque'`). The existing fetch handler already guards against caching opaque responses; adding them to `ASSETS` would cause `cache.add()` to silently cache an error response.

### 1.3 `install` Event Handler — Required Changes

**File:** `sw.js`

**Retain:**
- `event.waitUntil(...)` wrapping all async work
- `caches.open(CACHE_VERSION)` — update constant reference from `CACHE_NAME` to `CACHE_VERSION`
- `Promise.allSettled(ASSETS.map(url => cache.add(url).catch(e => console.warn('Cache skip:', url, e))))` — this pattern satisfies PM Edge Case 3 (storage quota exhaustion: silent degradation via `console.warn`, no unhandled exception, no blank screen)

**REMOVE: `self.skipWaiting()` — required behavioral fix.**

Conflict resolution: `self.skipWaiting()` in the current install handler directly violates PM acceptance criteria Story A3 "Multi-Tab Safety" ("the new SW does NOT activate mid-session in a way that breaks any open tab") and Edge Case 2 (user actively typing a journal entry when a new version deploys). With `skipWaiting()` present the SW forces itself active immediately, potentially creating a broken mixed-version state. Removing it causes the new SW to enter `waiting` state and activate naturally when all tabs are closed — correct behavior per PM spec. No replacement call is needed; the install handler simply ends after the `event.waitUntil(...)` block.

### 1.4 `activate` Event Handler — Required Changes

**File:** `sw.js`

**Retain:**
- `event.waitUntil(...)` wrapping
- `caches.keys()` enumeration
- `Promise.all(keys.filter(...).map(k => caches.delete(k)))` pattern
- `self.clients.claim()` call

**Update:** Filter condition: change `k !== CACHE_NAME` to `k !== CACHE_VERSION`.

Behavioral result: On activation every cache whose key does not exactly equal the current `CACHE_VERSION` value is deleted, automatically purging `'rif-shield-v1'` and any prior versions. `clients.claim()` is safe in `activate` (not `install`) — it only runs after the SW has already won the activation race, ensuring immediate control of clients on a true first install without requiring a page reload.

### 1.5 `fetch` Event Handler

See Section 2.3 for the complete fetch handler specification. Features A and B share this handler; the full spec is in Feature B to avoid duplication.

### 1.6 `index.html` SW Registration — Required Changes

**File:** `index.html`
**Location:** INITIALIZATION module, inside `DOMContentLoaded` listener, existing `if ('serviceWorker' in navigator)` block.

Current code:
```
navigator.serviceWorker.register('sw.js').catch(function(){});
```

Required change — expand `.catch` to log failures instead of silently swallowing:
```
navigator.serviceWorker.register('sw.js')
  .catch(function(err) { console.warn('SW registration failed:', err); });
```

No `updatefound` listener, no `postMessage`, no `controllerchange` listener is needed. The in-app update notification banner is explicitly out of scope per PM Section 5 item 5. The SW version lifecycle is entirely self-managed inside `sw.js`.

---

## 2. Feature B — Offline Fallback Page

### 2.1 Delivery Mechanism

**Decision: Inline in `sw.js` as the `OFFLINE_SHELL` string constant. No separate `offline.html` file.**

Rationale: Locked architecture decision #1 prohibits additional HTML files until Sprint 10. The Service Worker can construct a `Response` object from an inline HTML string — this is the established pattern for single-file PWA offline fallbacks and requires no architecture exception.

### 2.2 `OFFLINE_SHELL` Content Requirements

**File:** `sw.js` — the `OFFLINE_SHELL` constant (declared per Section 1.1)

The string must be a complete, self-contained HTML document satisfying ALL of the following:

**Required structural elements:**

| Element | Requirement |
|---------|-------------|
| `<!DOCTYPE html>` declaration | Required as first line |
| `<meta charset="UTF-8">` | Required |
| `<meta name="viewport" content="width=device-width,initial-scale=1">` | Required |
| `<title>` text | Must read: `RIF Shield — Offline` |
| Page heading | Must display: `RIF Shield` |
| Primary status message | Must read exactly: `You are currently offline.` |
| Secondary reassurance message | Must read exactly: `Your saved data is on this device. Reconnect to access all features.` |
| Interactive elements | NONE — no `<button>`, `<a href>`, `<form>`, `<input>` per Story B2 "No Broken Action Buttons" |
| External resource links | NONE — no `<link rel="stylesheet">`, no `<script src>`, no font URLs |
| Inline `<script>` blocks | NONE |

**Required visual properties (all in an inline `<style>` block within the document):**

| CSS Property | Value | Note |
|-------------|-------|------|
| Page background | `#0f1c3f` | Hardcoded hex — CSS vars from index.html are NOT available in SW-generated responses |
| Heading/accent color | `#c9a227` | Hardcoded hex |
| Body text color | `#ffffff` | White on navy |
| Font stack | `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | System fonts only; no Google Fonts (external request) |
| Layout | Centered flexbox column, `min-height: 100vh`, `justify-content: center`, `align-items: center` | Readable on 375px–1280px viewports |

**Critical note on CSS variables:** `OFFLINE_SHELL` is served as a standalone `Response` object, not embedded in `index.html`. CSS custom properties (`--navy`, `--gold`, etc.) defined in `index.html`'s `:root` are unavailable. Use hardcoded hex values exclusively in `OFFLINE_SHELL`.

### 2.3 `fetch` Event Handler — Complete Specification

**File:** `sw.js`

The fetch handler must implement the following logic in this exact sequence:

**Step 1 — Non-GET guard (retain existing):**
If `event.request.method !== 'GET'`, return without calling `event.respondWith`. Non-GET requests pass through to the network unmodified.

**Step 2 — Proactive offline navigate intercept (NEW — insert before existing `event.respondWith`):**
- Condition: `event.request.mode === 'navigate'` AND `!navigator.onLine`
- Action: `event.respondWith(new Response(OFFLINE_SHELL, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))`
- Purpose: Provides an immediate synchronous offline response for navigation requests without waiting for a cache miss and failed network fetch. Eliminates the race condition where the browser might briefly show its native error page before the SW catch handler fires.

**Step 3 — Cache-first with network fallback (retain existing structure with the following updates):**

Retain the `caches.match(event.request)` then `fetch(event.request)` chain.

Update all occurrences of `caches.open(CACHE_NAME)` to `caches.open(CACHE_VERSION)` — one occurrence exists inside the dynamic cache-write path in the fetch `.then()` handler.

Update the `.catch()` handler:

FROM:
```javascript
.catch(() => {
  if (event.request.destination === 'document') return caches.match('./index.html');
})
```

TO:
```javascript
.catch(() => {
  if (event.request.mode === 'navigate') {
    return new Response(OFFLINE_SHELL, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
})
```

Changes explained:
- `event.request.destination === 'document'` replaced with `event.request.mode === 'navigate'` for consistency with Step 2 and broader navigate-request coverage.
- `caches.match('./index.html')` replaced with `new Response(OFFLINE_SHELL, ...)` — serving full `index.html` offline causes app JS to initialize and attempt network calls that fail; the dedicated branded fallback is correct.
- Non-navigate sub-resource fetch failures (images, scripts, fonts) return `undefined` implicitly — acceptable; browsers handle sub-resource failures gracefully without showing a full error page.

### 2.4 `index.html` Changes for Feature B

None required. The offline fallback is entirely SW-managed. `index.html` is served from cache on normal operation; `OFFLINE_SHELL` is only served when both cache lookup and network fetch fail for a navigate request.

---

## 3. Feature C — PWA Install Prompt

### 3.1 Install Button HTML Element

**File:** `index.html`

**Insertion location:** Inside the top-level `<header>` element (the main app navigation bar), as the last child before the closing `</header>` tag. If `<header>` contains an inner flex-container `<div>`, append as the last child of that inner `<div>` so the button appears at the trailing (right) edge of the header on desktop and stacks below the title on mobile (column layout).

If no `<header>` element is present and the app uses a `<nav>` or top-of-body `<div>` as the primary navigation bar, insert as the last child of that element. The landmark must be confirmed by reading the current HTML before editing.

**Element specification:**

| Attribute | Value |
|-----------|-------|
| Tag | `<button>` |
| `id` | `pwa-install-btn` |
| `class` | `btn-pwa-install` |
| `type` | `button` |
| `aria-label` | `Install RIF Shield as an app` |
| Text content | `Install App` |
| Initial inline style | `style="display:none"` |

The `display:none` inline style is mandatory on the element at rest. This ensures no layout gap on load, satisfying Story C3 (no phantom gap when already installed) and Story C4 (no button on iOS Safari). JS controls visibility by setting `element.style.display = 'inline-flex'` or `'none'` directly — not by toggling CSS classes.

### 3.2 CSS — Install Button Styles

**File:** `index.html`
**Location:** Inside the existing `<style>` block, appended after the last existing rule before `</style>`.

**Class name:** `.btn-pwa-install`

| CSS Property | Value | Rationale |
|-------------|-------|-----------|
| `align-items` | `center` | Vertical centering of text within button |
| `gap` | `0.4rem` | Spacing reserve for future icon addition |
| `padding` | `0.45rem 1rem` | Compact touch target, header-height appropriate |
| `background-color` | `var(--gold)` | Primary action color per design system |
| `color` | `var(--navy)` | High-contrast text on gold background |
| `border` | `none` | Flat design consistent with app style |
| `border-radius` | `6px` | Consistent with existing button radius in app |
| `font-family` | `inherit` | Inherits Plus Jakarta Sans from body |
| `font-size` | `0.8rem` | Smaller than primary CTAs; secondary action |
| `font-weight` | `600` | Consistent with existing button weight |
| `cursor` | `pointer` | Standard interactive affordance |
| `white-space` | `nowrap` | Prevents label wrap in narrow headers |
| `transition` | `opacity 0.2s ease` | Smooth show/hide via opacity if needed |

Note: `display` property is NOT set in `.btn-pwa-install`. The class defines appearance only. Visibility is controlled exclusively via `element.style.display` in JS (see Section 3.3).

### 3.3 JavaScript Functions

**File:** `index.html`
**Location:** All three functions are placed inside the INITIALIZATION module, after the `obSkip()` and `initOnboarding()` functions, before the `document.addEventListener('DOMContentLoaded', ...)` block.

---

#### Module-Scoped Variable: `deferredInstallPrompt`

**Declaration location:** CONSTANTS & CONFIG module, appended after the last existing constant declaration.
**Declaration:** `let deferredInstallPrompt = null;`
**Type:** `BeforeInstallPromptEvent | null`
**Purpose:** Stores the captured `beforeinstallprompt` event for later invocation via `triggerInstallPrompt()`. Initialized `null`; set by `captureInstallPrompt()`; cleared to `null` by `handleAppInstalled()`.

---

#### Function 1: `captureInstallPrompt(event)`

**Signature:** `function captureInstallPrompt(event)`
**Parameter:** `event` — type `BeforeInstallPromptEvent` — the browser-fired install prompt event
**Returns:** `void`

**Behavior:**
1. Call `event.preventDefault()` to suppress the browser's automatic mini-infobar (required to enable custom install UI).
2. Assign `event` to `deferredInstallPrompt`.
3. Retrieve the element with `id` `pwa-install-btn`.
4. If the element exists, set `element.style.display = 'inline-flex'` to make the button visible.
5. No return value.

**JSDoc required:** Yes — document `@param {BeforeInstallPromptEvent} event` and `@returns {void}`.

---

#### Function 2: `triggerInstallPrompt()`

**Signature:** `function triggerInstallPrompt()`
**Parameters:** None
**Returns:** `void`

**Behavior:**
1. Guard: if `deferredInstallPrompt === null`, return immediately. This prevents errors if the function is called on unsupported browsers or after the prompt has already been consumed.
2. Call `deferredInstallPrompt.prompt()` to display the browser's native install dialog.
3. Chain `.then(function(choiceResult) { ... })` on the `prompt()` call:
   a. If `choiceResult.outcome === 'accepted'`, set `element.style.display = 'none'` on `pwa-install-btn` and set `deferredInstallPrompt = null`.
   b. If `choiceResult.outcome === 'dismissed'`, set `deferredInstallPrompt = null` only (do not hide the button — PM Story C2 only requires no re-prompt during session; the button may remain visible but the prompt cannot be re-triggered since `deferredInstallPrompt` is now null).
4. Catch any rejection with `.catch(function(err) { console.warn('Install prompt error:', err); })` — silent fail per Edge Case 3 pattern.

**JSDoc required:** Yes — `@returns {void}`.

---

#### Function 3: `handleAppInstalled()`

**Signature:** `function handleAppInstalled()`
**Parameters:** None
**Returns:** `void`

**Behavior:**
1. Set `deferredInstallPrompt = null`.
2. Retrieve the element with `id` `pwa-install-btn`.
3. If the element exists, set `element.style.display = 'none'`.
4. Log `console.log('PWA installed successfully.')` for developer confirmation.

**JSDoc required:** Yes — `@returns {void}`.

### 3.4 Event Listener Registration

**File:** `index.html`
**Location:** Inside the existing `document.addEventListener('DOMContentLoaded', function() { ... })` block in the INITIALIZATION module, after the existing `initOnboarding()` and SW registration calls.

Add the following three registrations in this order:

1. `window.addEventListener('beforeinstallprompt', captureInstallPrompt);`
2. `window.addEventListener('appinstalled', handleAppInstalled);`
3. Wire the button click: retrieve `document.getElementById('pwa-install-btn')` and call `element.addEventListener('click', triggerInstallPrompt)` if the element exists.

**iOS Safari handling:** No explicit detection code is needed. iOS Safari does not fire `beforeinstallprompt`. Because `captureInstallPrompt` is never called, `deferredInstallPrompt` remains `null` and the button's `display:none` is never changed. The button is silently absent. No `userAgent` sniffing, no `navigator.platform` check, no iOS-specific branch is required or permitted — feature detection via event presence is the correct and sufficient mechanism.

### 3.5 Session Dismissal Behavior

Per PM Story C2: once the user dismisses the native install dialog (`outcome === 'dismissed'`), `deferredInstallPrompt` is set to `null`. The button may remain visible but clicking it again calls `triggerInstallPrompt()` which hits the `null` guard at Step 1 and returns immediately — the native dialog does not re-appear. No `sessionStorage` flag, no additional state variable, and no button hiding is required for this behavior.

---

## 4. Files to Modify

| File | Change Type | Reason |
|------|-------------|--------|
| `sw.js` | Modify constants | Remove `CACHE_NAME`; add `CACHE_VERSION` and `OFFLINE_SHELL` |
| `sw.js` | Modify `ASSETS` array | Add `'./sw.js'` to cache manifest |
| `sw.js` | Modify `install` handler | Remove `self.skipWaiting()`; update constant reference to `CACHE_VERSION` |
| `sw.js` | Modify `activate` handler | Update filter from `k !== CACHE_NAME` to `k !== CACHE_VERSION` |
| `sw.js` | Modify `fetch` handler | Add offline navigate intercept; update `.catch()` to return `OFFLINE_SHELL` response; update `caches.open` reference |
| `index.html` | Modify HTML body | Add `<button id="pwa-install-btn">` inside header landmark |
| `index.html` | Modify `<style>` block | Append `.btn-pwa-install` CSS rule |
| `index.html` | Modify CONSTANTS & CONFIG module | Add `let deferredInstallPrompt = null;` |
| `index.html` | Modify INITIALIZATION module | Add three JS functions and three event listener registrations |
| `index.html` | Modify `DOMContentLoaded` listener | Wire event listeners; expand SW `.catch` to log failures |

No new files are created. No files are deleted. Total files touched: 2.

---

## 5. New Constants Required

Constants added to the **CONSTANTS & CONFIG module** in `index.html`:

| Constant | Type | Value | Location |
|----------|------|-------|----------|
| `deferredInstallPrompt` | `let` variable (`BeforeInstallPromptEvent or null`) | `null` | CONSTANTS & CONFIG module, after last existing constant |

Constants added to `sw.js` (not in `index.html` CONSTANTS module):

| Constant | Type | Value | Location |
|----------|------|-------|----------|
| `CACHE_VERSION` | `const string` | `'rif-shield-v2'` | Top of `sw.js`, replaces `CACHE_NAME` |
| `OFFLINE_SHELL` | `const string` | Multiline HTML template literal (see Section 2.2) | `sw.js`, after `CACHE_VERSION`, before `ASSETS` |

---

## 6. Data Structure Changes

### 6.1 `_schema` Version Bump

**No** — `_schema` version must NOT be incremented in Sprint 4.

Rationale: Sprint 4 introduces no changes to the localStorage data structure. No new data keys are written, no existing keys are renamed, no data shape is altered. The `_schema` version tracks changes to persisted data shape only. Service Worker cache management, offline fallback HTML, and the PWA install prompt are all runtime/session behaviors with no localStorage footprint. Locked architecture decision #5 is satisfied by the absence of structural change.

### 6.2 New `localStorage` Keys

**None.** Sprint 4 introduces no new `localStorage` keys.

| Candidate Key | Decision | Rationale |
|--------------|----------|-----------|
| Install prompt dismissed flag | NOT persisted | PM Story C2 requires session-only dismissal; `deferredInstallPrompt = null` achieves this without storage |
| App installed flag | NOT persisted | `appinstalled` event fires reliably on supported browsers; `beforeinstallprompt` absence on reinstall (Edge Case 1) naturally resets state |
| Cache version tracking | NOT in localStorage | Cache versioning is owned entirely by `sw.js`; the `CACHE_VERSION` constant in the `activate` event is the correct mechanism |

---

## 7. Risks and Constraints

### 7.1 iOS Safari Limitations

| Risk | Severity | Mitigation |
|------|----------|------------|
| `beforeinstallprompt` never fires on iOS Safari | Known — by design | Feature detection via event presence is sufficient; button stays `display:none`; no UA sniffing needed |
| iOS Safari SW support is partial (14.0+) | Low | Cache versioning and offline fallback work on iOS 14+; earlier versions get native browser error page for offline — acceptable per PM Edge Case 4 |
| iOS 15 and earlier may not persist SW across browser restarts | Low | No Sprint 4 mitigation required; documented as known platform limitation |
| No iOS "Add to Home Screen" guidance | Acknowledged gap | Explicitly out of scope per PM Section 5 item 4; candidate for Sprint 5/6 |

### 7.2 Render.com Static Hosting Constraints

| Risk | Severity | Mitigation |
|------|----------|------------|
| No automated build pipeline for cache-busting | Medium | Manual `CACHE_VERSION` bump in `sw.js` before each deploy is the defined process; must be documented in team runbook |
| Render serves files with default cache headers; SW file (`sw.js`) may itself be cached by browser | Medium | Render.com serves static assets with `Cache-Control: public, max-age=0, must-revalidate` for HTML by default; `sw.js` should be verified to receive the same header. If not, add a `_headers` file to the repo root specifying `Cache-Control: no-cache` for `sw.js`. Dev agent must verify Render header behavior post-deploy. |
| No server-side SW scope configuration needed | None | SW registered at root with default scope `./` covers all app URLs |

### 7.3 Legacy `rif-shield-v1` Cache Migration Path

The current `activate` handler deletes all caches not matching `CACHE_NAME` (currently `'rif-shield-v1'`). After the Sprint 4 deploy:

1. A returning user with the old SW still active visits the app.
2. The browser downloads the new `sw.js` (with `CACHE_VERSION = 'rif-shield-v2'`).
3. The new SW enters `waiting` state (no `skipWaiting()` — correct).
4. When the user closes all app tabs and reopens, the new SW activates.
5. The new SW `activate` handler runs `caches.keys()`, finds `'rif-shield-v1'`, and deletes it.
6. The new `ASSETS` are cached under `'rif-shield-v2'`.
7. The user receives fresh assets on next navigation.

This migration requires no special handling code beyond what is already specified. The existing purge-all-except-current pattern handles it automatically.

Edge case: A user who has the old SW and navigates while offline before the new SW activates will still receive the old `caches.match('./index.html')` fallback from the v1 SW — not the branded `OFFLINE_SHELL`. This is acceptable; the branded fallback only applies after the v2 SW activates.

### 7.4 Conflicts with Locked Architecture Decisions

| Decision | Conflict? | Assessment |
|----------|-----------|------------|
#1 Single HTML file | None | Feature B uses inline `OFFLINE_SHELL` in `sw.js`; no new HTML file created |
#2 Navy/Gold design system | None | `OFFLINE_SHELL` uses hardcoded hex values matching the design tokens; no token changes |
#3 localStorage primary store | None | Sprint 4 adds no localStorage reads/writes |
#4 `escapeHtml()` mandatory for user input in innerHTML | None | No new innerHTML insertions with user content in Sprint 4 |
#5 Schema version must increment on data structure changes | None | No data structure changes in Sprint 4 |
#6 All CDN scripts must have defer + SRI integrity hash | None | Sprint 4 adds no new CDN scripts |

**Behavioral conflict resolved:** Removal of `self.skipWaiting()` from the `install` handler changes observable SW behavior (SW no longer forces immediate activation). This is not a locked architecture decision; it is a bug fix required to meet PM acceptance criteria. No architecture exception is needed.

---

## 8. Implementation Order

The Development Agent must follow this sequence to avoid conflicts. Each step must be validated before proceeding to the next.

**Step 1 — Read current file state**
Before any edit: read `sw.js` in full and read the CONSTANTS & CONFIG, INITIALIZATION, and `<style>` sections of `index.html`. Confirm landmarks match this spec. Do not edit until read is complete.

**Step 2 — Update `sw.js` constants**
Replace `const CACHE_NAME = 'rif-shield-v1';` with `const CACHE_VERSION = 'rif-shield-v2';`. Add `const OFFLINE_SHELL = ` template literal immediately after (full HTML per Section 2.2). Update `ASSETS` array to add `'./sw.js'`. Validate: `sw.js` must parse without syntax errors.

**Step 3 — Update `sw.js` `install` handler**
Change `CACHE_NAME` reference to `CACHE_VERSION`. Remove `self.skipWaiting();` line. Validate: install handler contains no reference to `CACHE_NAME` and no `skipWaiting` call.

**Step 4 — Update `sw.js` `activate` handler**
Change `k !== CACHE_NAME` to `k !== CACHE_VERSION`. Validate: activate handler contains no reference to `CACHE_NAME`.

**Step 5 — Update `sw.js` `fetch` handler**
Add Step 2 offline navigate intercept block before existing `event.respondWith`. Update `caches.open(CACHE_NAME)` to `caches.open(CACHE_VERSION)`. Replace `.catch()` handler per Section 2.3. Validate: `sw.js` contains zero references to `CACHE_NAME`; `sw.js` parses without errors.

**Step 6 — Add CSS to `index.html`**
Append `.btn-pwa-install` rule to `<style>` block per Section 3.2. Validate: CSS parses; no existing rules modified.

**Step 7 — Add install button HTML to `index.html`**
Insert `<button id="pwa-install-btn" class="btn-pwa-install" type="button" aria-label="Install RIF Shield as an app" style="display:none">Install App</button>` as last child of header landmark per Section 3.1. Validate: element exists in DOM; `display:none` confirmed in attribute.

**Step 8 — Add `deferredInstallPrompt` variable to CONSTANTS & CONFIG module**
Append `let deferredInstallPrompt = null;` after last existing constant in CONSTANTS & CONFIG module. Validate: variable declared once; no duplicate declaration.

**Step 9 — Add three JS functions to INITIALIZATION module**
Add `captureInstallPrompt(event)`, `triggerInstallPrompt()`, and `handleAppInstalled()` functions per Section 3.3, after `initOnboarding()` and before the `DOMContentLoaded` block. Each function must have JSDoc block per WORKFLOW.md Hard Rule #4. Validate: functions parse; no naming conflicts with existing functions.

**Step 10 — Wire event listeners in `DOMContentLoaded` block**
Add three registrations per Section 3.4 after existing `initOnboarding()` and SW registration calls. Expand SW `.catch` to `console.warn` per Section 1.6. Validate: full `index.html` parses; `DOMContentLoaded` block contains all four registration lines.

**Step 11 — Full validation pass**
Run complete validation suite: HTML validity, JS parse check, all existing features functional, no console errors on load in a standard browser environment. Confirm `sw.js` has zero `CACHE_NAME` references. Confirm `index.html` has exactly one `pwa-install-btn` element. Confirm `.btn-pwa-install` rule exists in `<style>`. Hand off to QA Agent.

---

*Sprint 4 Architecture Specification complete. Ready for handoff to Agent A3 (Development) per GATE 2.*
*Gate 2 checklist: Spec names specific files (`sw.js`, `index.html`) — PASS. Spec names exact functions (`captureInstallPrompt`, `triggerInstallPrompt`, `handleAppInstalled`) — PASS. Spec names exact constants (`CACHE_VERSION`, `OFFLINE_SHELL`, `deferredInstallPrompt`) — PASS. Spec names exact element IDs and CSS classes (`pwa-install-btn`, `btn-pwa-install`) — PASS.*
