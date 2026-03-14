# Sprint 5 Architecture Specification
## Agent: A2 — Solutions Architect
## Date: 2026-03-14
## Sprint Goal: PDF Export Hardening + Offline Status Indicator
## Status: READY FOR COORDINATOR GATE A REVIEW

---

## Table of Contents
1. [Codebase Baseline](#1-codebase-baseline)
2. [Feature A — Defer-Safe PDF Generation](#2-feature-a)
3. [Feature B — Score Ring in PDF](#3-feature-b)
4. [Feature C — Legal Citations Section](#4-feature-c)
5. [Feature D — Named PDF File + iOS Fix](#5-feature-d)
6. [Feature E — Offline Status Banner](#6-feature-e)
7. [Files to Modify](#7-files-to-modify)
8. [New Constants Required](#8-new-constants-required)
9. [Schema Version](#9-schema-version)
10. [Implementation Order](#10-implementation-order)
11. [Risks and Constraints](#11-risks-and-constraints)

---

## 1. Codebase Baseline

All findings from direct inspection of `/a0/usr/projects/afge_rif_shield_demo/index.html`.

| Item | Current State | Line(s) |
|------|--------------|--------|
| jsPDF CDN script | `defer` + SRI hash, cdnjs 2.5.1 UMD, `crossorigin="anonymous"` | 18 |
| jsPDF accessor | `window.jspdf && window.jspdf.jsPDF` | 803 |
| `generatePDF()` | Synchronous, no mutex, no proactive button guard | 801-841 |
| PDF export button | `<button class="btn btn-p btn-full" onclick="generatePDF()">` — **no id attribute** | 292 |
| PDF error feedback | `showToast()` call only — no persistent error element | 804 |
| Current PDF filename | `'rif-shield-report.pdf'` hardcoded in `doc.save()` | 839 |
| CONSTANTS & CONFIG module | `// MODULE: CONSTANTS & CONFIG` | 364 |
| INITIALIZATION module | `document.addEventListener('DOMContentLoaded', function(){...})` | 964 |
| `_schema` value | `_schema: 1` hardcoded in `saveData()` | 404 |
| Bottom nav | `<nav id="bnav">`, CSS: `position:fixed; bottom:0; z-index:100` | 134, 337 |
| Header | `<header id="hdr">` — NOT position:fixed; scrolls with page | 223 |
| SVG score ring | `r=34`, `cx=cy=40`, `viewBox="0 0 80 80"`, `stroke-dasharray="213.6"` | 228 |
| Level table `LVL_T` | `Max`(90+), `Strong`(80+), `Good`(70+), `Fair`(60+), `Basic`(0+) | 419 |
| `showToast()` | Exists — transient overlay only | 471 |
| Existing semantic green | `#22c55e` used for Training vcard dot — not a brand token | 237 |
| `escapeHtml()` | Must exist per locked architecture; Dev Agent MUST confirm line before use | — |
| Offline detection | Not present anywhere in current file | — |
| Reports screen | `<div class="screen" id="s-reports">` | 277 |
| Existing legal refs in UI | "Know Your Rights" card references 5 CFR 351, 351.501, 351.701 as in-app text (not in PDF) | 277+ |

---

## 2. Feature A — Defer-Safe PDF Generation

### 2.1 Problem Statement
jsPDF CDN script has `defer` (line 18). CDN latency means jsPDF may not be available
when the button is tapped. The current guard fires reactively after tap — it does not
proactively disable the button. No double-tap mutex exists.

### 2.2 HTML Modifications

#### 2.2.1 Add `id` to PDF Export Button
**Location:** Line 292, `<div class="screen" id="s-reports">` > Export card
**Change:** Add attribute `id="pdf-export-btn"` to the existing button element.
All other attributes (`class`, `onclick`, `style`, inner HTML) are preserved unchanged.
Constant name for this ID string: `PDF_BTN_ID`

#### 2.2.2 New PDF Error Message Element
**Location:** Immediately after the PDF export button (after line 292), inside the same Export card `<div class="card">`.

Element specification:
- Tag: `<div>`
- `id`: `"pdf-error-msg"` — constant name: `PDF_ERROR_MSG_ID`
- `role`: `"alert"`
- `aria-live`: `"polite"`
- Inline style (initial): `display:none; color:#c0392b; font-size:13px; margin-top:8px; line-height:1.5; padding:6px 0;`
- Inner HTML: empty string (set entirely by JS, never hardcoded in HTML)

#### 2.2.3 Add `onload` to jsPDF Script Tag
**Location:** Line 18, existing jsPDF `<script>` tag
**Change:** Add attribute `onload="onJsPDFLoad()"` to the existing script tag.
All existing attributes (`src`, `integrity`, `crossorigin`, `defer`) are preserved unchanged.
Architecture note: `defer` scripts fire `onload` after DOM parsing — button will already
be disabled when `onJsPDFLoad()` executes.

### 2.3 Module-Scope Variables
Declared at module scope immediately before `generatePDF()` (before line 801).

| Variable | Type | Initial Value | Purpose |
|---------|------|--------------|--------|
| `pdfGenerating` | `boolean` | `false` | Mutex: blocks re-entrant double-tap |
| `pdfCdnTimeoutId` | `number\|null` | `null` | setTimeout handle for CDN watchdog |

### 2.4 New Functions
All functions placed in MODULE: REPORTS, immediately before `generatePDF()`. All require JSDoc.

#### `isPDFReady()` returns `boolean`
- **Purpose:** Pure availability check, no side effects
- **Logic:** Returns `true` if `window.jspdf && typeof window.jspdf.jsPDF === "function"`, else `false`

#### `showPDFLoadError()` returns `void`
- **Purpose:** Reveals persistent error element; permanently disables button for session
- **Steps:**
  1. Get element by `PDF_ERROR_MSG_ID`; set `style.display = "block"`
  2. Set `element.textContent` to: `"PDF generation is currently unavailable. Your network may be blocking the required library. Please try on a personal device or a non-agency network."`
  3. Get button by `PDF_BTN_ID`; set `disabled = true`; set `textContent = "PDF Unavailable"`
  4. Does NOT call `showToast()` — persistent element is sole feedback mechanism

#### `onJsPDFLoad()` returns `void`
- **Purpose:** Called by jsPDF script `onload` event; enables button on success
- **Steps:**
  1. Call `clearTimeout(pdfCdnTimeoutId)` — cancels CDN watchdog
  2. Call `isPDFReady()` as defensive verification
  3. If `true`: get button by `PDF_BTN_ID`; remove `disabled`; set `textContent = "Export Manager Review PDF"`
  4. If `false`: call `showPDFLoadError()`

### 2.5 INITIALIZATION Module Additions
**Location:** Inside `DOMContentLoaded` callback (line ~964)

**Addition 1 — Disable button at DOM ready:**
Get element by `PDF_BTN_ID`. Set `disabled = true`. Set `textContent = "Loading PDF library..."`.
Runs synchronously before defer script fires — guaranteed disabled before any user tap.

**Addition 2 — Start CDN watchdog:**
`setTimeout(showPDFLoadError, PDF_CDN_TIMEOUT_MS)` — store return value in `pdfCdnTimeoutId`.
`PDF_CDN_TIMEOUT_MS` constant value: `10000` (10 seconds).

**Addition 3 — Call `initOfflineDetection()`** (see Section 6)

### 2.6 `generatePDF()` Modifications

#### Entry Guards (replace lines 803-804)
Insert at very top of function body, replacing existing `const jsPDF=...` and `if(!jsPDF){...}` lines:
1. If `!isPDFReady()`: call `showPDFLoadError()` and `return`
2. If `pdfGenerating === true`: `return` (silent no-op — double-tap prevention)
3. Set `pdfGenerating = true`
4. Get button by `PDF_BTN_ID`: set `disabled = true`; set `textContent = "Generating..."`
5. `const jsPDF = window.jspdf.jsPDF;` (safe — guard confirmed availability above)

#### Exit Cleanup (insert at BOTH exit points)
At end of `try` block AND inside `catch` block:
- Set `pdfGenerating = false`
- Get button by `PDF_BTN_ID`: remove `disabled`; restore `textContent = "Export Manager Review PDF"`

---

## 3. Feature B — Score Ring in PDF

### 3.1 New Function: `drawScoreRingCanvas(score, level)`

**Location:** MODULE: REPORTS, immediately before `generatePDF()`
**Signature:** `function drawScoreRingCanvas(score, level)`
**Returns:** `string` (PNG data URL) on success, or `null` on failure
**JSDoc required.** Params: `@param {number} score` integer 0-100;
`@param {{l:number, min:number, lbl:string}} level` object from `LVL_T`;
`@returns {string|null}` PNG data URL or null if canvas unavailable.

#### Canvas Dimensions

| Constant | Value | Purpose |
|---------|-------|--------|
| `PDF_RING_CANVAS_SIZE` | `200` | Canvas width AND height in pixels |
| `PDF_RING_RADIUS` | `80` | Arc radius in pixels |
| `PDF_RING_LINE_WIDTH` | `14` | Arc stroke width in pixels |

Center point: `(100, 100)` — midpoint of 200x200 canvas.
At 72 dpi, 200 px renders to approximately 70 mm — fits within A4 usable width of 182 mm.

#### Canvas API Drawing Sequence (in strict order)

1. `document.createElement('canvas')` — offscreen only, do NOT append to DOM
2. `canvas.width = PDF_RING_CANVAS_SIZE` (200); `canvas.height = PDF_RING_CANVAS_SIZE` (200)
3. `ctx = canvas.getContext('2d')` — if `ctx === null`, return `null` immediately (triggers fallback)
4. White background fill: `ctx.fillStyle = '#ffffff'`; `ctx.fillRect(0, 0, 200, 200)`
5. Background ring track:
   - `ctx.beginPath()`
   - `ctx.arc(100, 100, PDF_RING_RADIUS, 0, Math.PI * 2)`
   - `ctx.strokeStyle = '#e2e8f0'` (light gray track — matches dashboard SVG ring-bg appearance)
   - `ctx.lineWidth = PDF_RING_LINE_WIDTH`
   - `ctx.stroke()`
6. Score arc (ONLY if `score > 0` — skip entirely when score is 0):
   - Start angle: `-Math.PI / 2` (12 o clock position)
   - End angle: `-Math.PI / 2 + (Math.PI * 2 * score / 100)`
   - `ctx.beginPath()`
   - `ctx.arc(100, 100, PDF_RING_RADIUS, -Math.PI/2, -Math.PI/2 + (Math.PI*2*score/100))`
   - `ctx.strokeStyle = '#c9a227'` (gold — locked design token `--gold`)
   - `ctx.lineWidth = PDF_RING_LINE_WIDTH`
   - `ctx.lineCap = 'round'`
   - `ctx.stroke()`
7. Center score number:
   - `ctx.fillStyle = '#0f1c3f'` (navy — locked design token `--navy`)
   - `ctx.font = 'bold 48px Arial, sans-serif'`
   - `ctx.textAlign = 'center'`
   - `ctx.textBaseline = 'middle'`
   - `ctx.fillText(String(score), 100, 92)`
8. Level label below score number:
   - `ctx.fillStyle = '#6b7280'`
   - `ctx.font = '16px Arial, sans-serif'`
   - `ctx.textAlign = 'center'`
   - `ctx.textBaseline = 'middle'`
   - `ctx.fillText(level.lbl, 100, 128)`
9. Wrap `canvas.toDataURL('image/png')` in try/catch:
   - On success: return the data URL string
   - On any error (SecurityError, QuotaExceeded, or any thrown exception): return `null`

### 3.2 PDF Insertion of Ring Image

**Location in `generatePDF()`:** After the three navy header `doc.text(...)` calls,
before the `let y=52;` line (currently line ~814 area).

**Call sequence:**
1. `const ringDataUrl = drawScoreRingCanvas(score, lv);`
2. If `ringDataUrl !== null`: call `doc.addImage(ringDataUrl, 'PNG', 140, 2, 36, 36)`
3. If `ringDataUrl === null`: insert plain-text fallback (see 3.3 below)

#### `doc.addImage` Parameters
| Parameter | Value | Meaning |
|-----------|-------|--------|
| dataURL | `ringDataUrl` | PNG data URL from canvas |
| format | `'PNG'` | Image format string |
| x | `140` mm | Right-side placement (210 - 14 gutter - 36 width - 20 buffer) |
| y | `2` mm | Near top of page, inside the 40 mm navy header block |
| w | `36` mm | Ring width in PDF units |
| h | `36` mm | Ring height in PDF units |

Ring sits within the 40 mm navy header with 2 mm padding top and 2 mm padding bottom.

### 3.3 Fallback Text (canvas render fails)

If `drawScoreRingCanvas()` returns `null`, do NOT call `doc.addImage()`.
Instead, insert the following plain-text block at the same position:

- `doc.setTextColor(...white)` (white on navy header background)
- `doc.setFontSize(10)`
- `doc.setFont(undefined, 'normal')`
- `doc.text('Score: ' + score + '/100 — ' + lv.lbl, 155, 22, {align: 'center'})`

This text block occupies the same upper-right region of the header as the ring image would.

---

## 4. Feature C — Legal Citations Section in PDF

### 4.1 The Four Required Citation Strings

The following citation strings are STATIC — they contain no user data and require no `escapeHtml()`.
These exact strings must appear verbatim in the PDF:

1. `"5 CFR Part 351 — Reduction in Force: Establishes the comprehensive regulatory framework governing all federal RIF actions, including competitive areas, competitive levels, and retention registers."`
2. `"5 CFR 351.501 — Retention Standing: Defines how retention standing is determined by tenure group, veterans preference, and performance ratings."`
3. `"5 CFR 351.701 — Bump and Retreat Rights: Establishes the rights of employees to displace lower-standing employees or retreat to formerly held positions during a RIF."`
4. `"OPM Workforce Restructuring (RIF) Guidance — Office of Personnel Management official guidance on implementing reduction in force procedures. See: opm.gov/policy-data-oversight/workforce-restructuring/reductions-in-force/"`

### 4.2 New Function: `addLegalCitations(doc, yPosition)`

**Location:** MODULE: REPORTS, immediately before `generatePDF()`
**Signature:** `function addLegalCitations(doc, yPosition)`
**Returns:** `number` — the updated y position after all citations are rendered (for further content placement)
**JSDoc required.** Params: `@param {object} doc` jsPDF document instance;
`@param {number} yPosition` current y cursor in mm; `@returns {number}` updated y after citations.

#### Page Placement Logic

The citations section requires approximately 55 mm of vertical space (divider + heading + 4 citations).

At the start of `addLegalCitations()`:
- If `yPosition > 230` (less than 55 mm before page bottom at 297 mm - 12 mm margin = 285 mm):
  call `doc.addPage()` and set local `y = 20`
- Else: use `yPosition` as starting y

**Expected outcome:** For typical reports (few journal entries), citations fit on page 1.
For reports with 20+ journal entries, citations appear on page 2.

#### Rendering Sequence Inside `addLegalCitations()`

1. Horizontal divider line:
   - `doc.setDrawColor(201, 162, 39)` (gold — design token `--gold` = `#c9a227` = rgb(201,162,39))
   - `doc.setLineWidth(0.5)`
   - `doc.line(14, y, 196, y)` (full usable width)
   - `y += 6`
2. Section heading:
   - `doc.setTextColor(15, 28, 63)` (navy — design token `--navy`)
   - `doc.setFontSize(10)`
   - `doc.setFont(undefined, 'bold')`
   - `doc.text('Legal Basis & Regulatory References', 14, y)`
   - `y += 7`
3. For each of the 4 citation strings (iterate in order):
   - `doc.setFontSize(8)`
   - `doc.setFont(undefined, 'normal')`
   - `doc.setTextColor(60, 70, 90)`
   - Use `doc.splitTextToSize(citationString, 182)` to wrap text to 182 mm usable width
   - `doc.text(wrappedLines, 14, y)`
   - `y += (wrappedLines.length * 4.5) + 2` (4.5 mm per line + 2 mm gap between citations)
4. Return `y` (updated cursor position)

### 4.3 Integration into `generatePDF()`

**Location:** After the journal entries section (after the `forEach` loop), before `doc.save()`.

Call: `y = addLegalCitations(doc, y + 8);`
(The `+ 8` provides a gap between the last journal entry and the citations divider.)

---

## 5. Feature D — Named PDF File + iOS Safari Download Fix

### 5.1 Filename Construction

**Constant:** `PDF_FILENAME_PREFIX` — string value: `'RIF-Shield-Report-'`

**Filename assembly at generation time (inside `generatePDF()`):**
1. `const today = new Date();`
2. `const yyyy = today.getFullYear();`
3. `const mm = String(today.getMonth() + 1).padStart(2, '0');`
4. `const dd = String(today.getDate()).padStart(2, '0');`
5. `const filename = PDF_FILENAME_PREFIX + yyyy + '-' + mm + '-' + dd + '.pdf';`

Result format: `RIF-Shield-Report-YYYY-MM-DD.pdf` e.g. `RIF-Shield-Report-2026-03-14.pdf`
Uses LOCAL date — `getFullYear()`, `getMonth()`, `getDate()` reflect the user's device timezone.

### 5.2 New Function: `downloadPDF(doc, filename)` returns `void`

**Location:** MODULE: REPORTS, immediately before `generatePDF()`
**Signature:** `function downloadPDF(doc, filename)`
**Returns:** `void`
**JSDoc required.** `@param {object} doc` jsPDF instance; `@param {string} filename` full filename with `.pdf` extension.

#### iOS Safari Detection

Inside `downloadPDF()`, first line:
`const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;`

- Regex `/iPad|iPhone|iPod/` matches all iOS device strings in the user agent
- `!window.MSStream` excludes IE11 on Windows Phone (which falsely triggers the iOS regex)
- This variable is LOCAL to `downloadPDF()` — not module scope

#### Desktop / Non-iOS Path

When `isIOS === false`:
`doc.save(filename);`
This is the standard jsPDF method — already works on Chrome, Firefox, Edge, Safari desktop, Android Chrome.

#### iOS Safari Path — Blob + Object URL + Programmatic Anchor Click

When `isIOS === true`, execute these steps in order:
1. `const blob = doc.output('blob');`
2. `const objectUrl = URL.createObjectURL(blob);`
3. `const anchor = document.createElement('a');`
4. `anchor.href = objectUrl;`
5. `anchor.download = filename;`
6. `anchor.style.display = 'none';`
7. `document.body.appendChild(anchor);`
8. `anchor.click();`
9. `document.body.removeChild(anchor);`
10. `setTimeout(function(){ URL.revokeObjectURL(objectUrl); }, PDF_BLOB_REVOKE_DELAY_MS);`
    Constant `PDF_BLOB_REVOKE_DELAY_MS` value: `10000` (10 seconds)
    10-second delay gives Safari time to initiate the download before the Blob URL is revoked.

### 5.3 Integration into `generatePDF()`

**Replace** the existing `doc.save('rif-shield-report.pdf')` call (line 839) with:
1. Filename construction per Section 5.1
2. `downloadPDF(doc, filename);`

The existing `showToast('PDF downloaded!')` call (line 840) immediately after remains unchanged.

---

## 6. Feature E — Offline Status Banner

### 6.1 HTML Element

**New element specification:**
- Tag: `<div>`
- `id`: `"offline-banner"` — constant name: `OFFLINE_BANNER_ID`
- `role`: `"status"`
- `aria-live`: `"polite"`
- `aria-atomic`: `"true"`
- Initial inline style: `display:none;`
- Inner HTML (set by JS): contains a text message string

**DOM placement:** Immediately after `<header id="hdr">...</header>` (after line 223),
before the `<div id="screens">` element (line 224).
This position ensures the banner is in normal document flow at the top of the content area.

### 6.2 CSS Rules

Add the following rules to the existing `<style>` block. All existing CSS is preserved.

**Selector: `#offline-banner`** (base styles)
- `position: fixed`
- `top: 0`
- `left: 0`
- `right: 0`
- `z-index: 150` (above bnav z-index:100; below any modal overlays)
- `padding: 8px 16px`
- `font-size: 13px`
- `font-weight: 600`
- `text-align: center`
- `display: none` (default hidden state)
- `transition: opacity 0.3s ease`

**Selector: `#offline-banner.is-offline`** (offline/warning state)
- `display: block`
- `background: #92400e`  (dark amber — semantic warning, NOT a brand token)
- `color: #fef3c7`  (pale amber text for contrast)

**Selector: `#offline-banner.is-online`** (back-online flash state)
- `display: block`
- `background: #14532d`  (dark green — semantic success, NOT a brand token)
- `color: #dcfce7`  (pale green text for contrast)

**Note on design token lock:** These semantic status colors (#92400e amber, #14532d green)
are UI feedback indicators, not brand identity colors. The Navy/Gold token lock applies to
branding, navigation, and content components. PM and Architect agree this use is within scope.
If Coordinator disagrees, fallback: use navy background for offline state and omit the green
online-flash state entirely (show only toast).

**Selector: `body.has-offline-banner #screens`** (push content down when banner is visible)
- `padding-top: 34px`  (approximate banner height: 8px padding top + 13px font + 8px padding bottom + 5px buffer)

This prevents the fixed banner from overlapping the top of the scrollable content.
The `has-offline-banner` class is added/removed from `document.body` by the JS functions.

### 6.3 New Functions
All functions placed in a new MODULE: OFFLINE section, before the INITIALIZATION module.
All require JSDoc.

#### `showOfflineBanner()` returns `void`
- **Purpose:** Displays the offline warning state of the banner
- **Steps:**
  1. Get element by `OFFLINE_BANNER_ID`
  2. Remove class `is-online` from element classList
  3. Add class `is-offline` to element classList
  4. Set `element.textContent` to: `"You are offline — app is running in offline mode"`
  5. Add class `has-offline-banner` to `document.body`

#### `hideOfflineBanner()` returns `void`
- **Purpose:** Hides the banner and briefly flashes the back-online state
- **Steps:**
  1. Get element by `OFFLINE_BANNER_ID`
  2. Remove class `is-offline` from element classList
  3. Add class `is-online` to element classList
  4. Set `element.textContent` to: `"You are back online"`
  5. Keep `has-offline-banner` class on body during flash
  6. After `ONLINE_FLASH_DURATION_MS` milliseconds (setTimeout):
     - Remove class `is-online` from element
     - Remove class `has-offline-banner` from `document.body`
  (`ONLINE_FLASH_DURATION_MS` constant value: `3000`)

#### `initOfflineDetection()` returns `void`
- **Purpose:** Registers event listeners and performs initial state check
- **Steps:**
  1. Register `window.addEventListener('offline', offlineBannerHandler)`
  2. Register `window.addEventListener('online', onlineBannerHandler)`
  3. Check `navigator.onLine` immediately:
     - If `navigator.onLine === false`: call `showOfflineBanner()` directly (no debounce, immediate on load)
  Note: `offlineBannerHandler` and `onlineBannerHandler` are the debounced wrapper functions (see 6.4)

### 6.4 Debounce Implementation

**Module-scope variable:**
- Name: `offlineBannerDebounceId`
- Type: `number|null`
- Initial value: `null`
- Declared immediately before `initOfflineDetection()`

**Debounce delay constant:** `OFFLINE_DEBOUNCE_MS` — value: `1500` (1.5 seconds)

**Handler functions (module scope, before `initOfflineDetection()`):**

`offlineBannerHandler` — called by `window 'offline'` event:
1. `clearTimeout(offlineBannerDebounceId)`
2. `offlineBannerDebounceId = setTimeout(showOfflineBanner, OFFLINE_DEBOUNCE_MS)`

`onlineBannerHandler` — called by `window 'online'` event:
1. `clearTimeout(offlineBannerDebounceId)`
2. `offlineBannerDebounceId = setTimeout(hideOfflineBanner, OFFLINE_DEBOUNCE_MS)`

The debounce prevents the banner from flickering on rapid toggling (PM edge case 5).
Initial page-load check in `initOfflineDetection()` bypasses the debounce (immediate feedback).

### 6.5 INITIALIZATION Integration

Call `initOfflineDetection()` inside the `DOMContentLoaded` callback (line ~964),
as Addition 3 listed in Section 2.5.

---

## 7. Files to Modify

| File | Sections Changed | Reason |
|------|-----------------|--------|
| `index.html` | Line 18: add `onload="onJsPDFLoad()"` to jsPDF script tag | Feature A — script load callback |
| `index.html` | Line 292: add `id="pdf-export-btn"` to Export PDF button | Feature A — button DOM reference |
| `index.html` | After line 292: insert `<div id="pdf-error-msg">` element | Feature A — persistent error display |
| `index.html` | After `</header>` (line 223): insert `<div id="offline-banner">` element | Feature E — offline banner HTML |
| `index.html` | `<style>` block: add `#offline-banner`, `.is-offline`, `.is-online`, `body.has-offline-banner #screens` rules | Feature E — banner CSS |
| `index.html` | MODULE: CONSTANTS & CONFIG (~line 364): add 9 new constants | All features |
| `index.html` | MODULE: REPORTS (before `generatePDF()`): add module-scope vars `pdfGenerating`, `pdfCdnTimeoutId` | Feature A |
| `index.html` | MODULE: REPORTS (before `generatePDF()`): add `isPDFReady()`, `showPDFLoadError()`, `onJsPDFLoad()` | Feature A |
| `index.html` | MODULE: REPORTS (before `generatePDF()`): add `drawScoreRingCanvas(score, level)` | Feature B |
| `index.html` | MODULE: REPORTS (before `generatePDF()`): add `addLegalCitations(doc, yPosition)` | Feature C |
| `index.html` | MODULE: REPORTS (before `generatePDF()`): add `downloadPDF(doc, filename)` | Feature D |
| `index.html` | `generatePDF()` function body: replace lines 803-804; add ring call; add citations call; replace line 839; add exit cleanup | Features A, B, C, D |
| `index.html` | New MODULE: OFFLINE (before INITIALIZATION): add `offlineBannerDebounceId`, `offlineBannerHandler`, `onlineBannerHandler`, `showOfflineBanner()`, `hideOfflineBanner()`, `initOfflineDetection()` | Feature E |
| `index.html` | INITIALIZATION module (~line 964): add 3 items to `DOMContentLoaded` callback | Features A, E |

**Total files modified: 1** (`index.html` only — single-file architecture preserved)

---

## 8. New Constants Required

All constants added to the existing MODULE: CONSTANTS & CONFIG section (~line 366).
Use `const` declarations consistent with existing style in the file.

### Feature A Constants

| Constant Name | Type | Value | Purpose |
|--------------|------|-------|--------|
| `PDF_BTN_ID` | string | `'pdf-export-btn'` | DOM id of the Export PDF button |
| `PDF_ERROR_MSG_ID` | string | `'pdf-error-msg'` | DOM id of the persistent error div |
| `PDF_CDN_TIMEOUT_MS` | number | `10000` | ms to wait before declaring CDN failure |

### Feature B Constants

| Constant Name | Type | Value | Purpose |
|--------------|------|-------|--------|
| `PDF_RING_CANVAS_SIZE` | number | `200` | Canvas width and height in pixels |
| `PDF_RING_RADIUS` | number | `80` | Ring arc radius in pixels |
| `PDF_RING_LINE_WIDTH` | number | `14` | Ring arc stroke width in pixels |

### Feature D Constants

| Constant Name | Type | Value | Purpose |
|--------------|------|-------|--------|
| `PDF_FILENAME_PREFIX` | string | `'RIF-Shield-Report-'` | Static prefix for generated PDF filename |
| `PDF_BLOB_REVOKE_DELAY_MS` | number | `10000` | ms delay before revoking iOS Blob URL |

### Feature E Constants

| Constant Name | Type | Value | Purpose |
|--------------|------|-------|--------|
| `OFFLINE_BANNER_ID` | string | `'offline-banner'` | DOM id of the offline status banner |
| `OFFLINE_DEBOUNCE_MS` | number | `1500` | ms debounce delay for banner toggle |
| `ONLINE_FLASH_DURATION_MS` | number | `3000` | ms to show the green back-online flash |

**Total new constants: 11**

---

## 9. Schema Version

**Decision: NO — `_schema` does NOT need to be bumped.**

**Reason:** Sprint 5 makes zero changes to the data structure stored in localStorage.
No new fields are added to the data object. No existing fields are renamed or removed.
All five features (PDF improvements, offline banner) are purely presentational and behavioral —
they do not read from or write to any new keys in `localStorage`.
The `_schema: 1` value at line 404 of `saveData()` remains unchanged.

---

## 10. Implementation Order

The Dev Agent MUST follow this exact sequence. Validate after each phase before proceeding.
All edits are targeted insertions/modifications — no full-file rewrites.

### Phase 1 — Constants and HTML Structure

1. Add 11 new constants to MODULE: CONSTANTS & CONFIG (~line 366)
   - Group by feature: A constants, then B, then D, then E
   - Validate: all constants accessible in browser console after reload

2. Add `id="pdf-export-btn"` attribute to button at line 292
   - Validate: `document.getElementById('pdf-export-btn')` returns the element

3. Insert `<div id="pdf-error-msg" ...>` immediately after line 292 button
   - Validate: element exists and is hidden (display:none)

4. Insert `<div id="offline-banner" ...>` immediately after `</header>` (line 223)
   - Validate: element exists and is hidden

5. Add CSS rules for `#offline-banner`, `.is-offline`, `.is-online`,
   and `body.has-offline-banner #screens` to the `<style>` block
   - Validate: applying class `is-offline` manually shows amber banner

### Phase 2 — Feature A: Defer-Safe PDF

6. Add `onload="onJsPDFLoad()"` attribute to jsPDF script tag (line 18)
   - Note: do NOT change any other script tag attributes

7. Declare module-scope variables `pdfGenerating` and `pdfCdnTimeoutId`
   immediately before `generatePDF()` function

8. Add functions `isPDFReady()`, `showPDFLoadError()`, `onJsPDFLoad()`
   to MODULE: REPORTS, before `generatePDF()`

9. Add to INITIALIZATION module `DOMContentLoaded` callback:
   - Disable button (Addition 1)
   - Start CDN watchdog (Addition 2)

10. Modify `generatePDF()` entry: replace lines 803-804 with entry guard block
    (isPDFReady check, mutex check, set pdfGenerating=true, disable button)

11. Add exit cleanup to BOTH the end of the `try` block and the `catch` block
    - Validate Feature A: on page load, button reads "Loading PDF library..." and is disabled
    - Validate: after jsPDF loads, button becomes enabled automatically
    - Validate: rapid double-click generates only one PDF

### Phase 3 — Feature B: Score Ring

12. Add `drawScoreRingCanvas(score, level)` function to MODULE: REPORTS
    before `generatePDF()`

13. Modify `generatePDF()`: insert ring call after header drawing calls,
    before `let y=52;` line. Include both success and fallback text paths.
    - Validate: generated PDF contains a score ring image
    - Validate: ring arc fills correctly at scores 0, 50, 100
    - Validate: fallback text appears if canvas is unavailable (test by temporarily
      returning null from drawScoreRingCanvas)

### Phase 4 — Feature C: Legal Citations

14. Add `addLegalCitations(doc, yPosition)` function to MODULE: REPORTS
    before `generatePDF()`

15. Modify `generatePDF()`: call `y = addLegalCitations(doc, y + 8)` after
    the journal entries forEach loop, before the download call
    - Validate: generated PDF contains "Legal Basis & Regulatory References" section
    - Validate: all 4 citation strings appear
    - Validate: section appears on page 2 when journal is long

### Phase 5 — Feature D: Named PDF + iOS Fix

16. Add `downloadPDF(doc, filename)` function to MODULE: REPORTS
    before `generatePDF()`

17. Modify `generatePDF()`: replace `doc.save('rif-shield-report.pdf')` (line 839)
    with filename construction + `downloadPDF(doc, filename)` call
    - Validate: downloaded file is named `RIF-Shield-Report-2026-03-14.pdf`
    - Validate on desktop Chrome: downloads automatically
    - Validate on iOS Safari (if device available): PDF opens or saves

### Phase 6 — Feature E: Offline Banner

18. Add new MODULE: OFFLINE section (before INITIALIZATION module, line ~964):
    - Declare `offlineBannerDebounceId = null`
    - Add `showOfflineBanner()`, `hideOfflineBanner()` functions
    - Add `offlineBannerHandler`, `onlineBannerHandler` debounce wrappers
    - Add `initOfflineDetection()` function

19. Add `initOfflineDetection()` call to INITIALIZATION module `DOMContentLoaded`
    callback (Addition 3 per Section 2.5)
    - Validate: with DevTools network set to Offline, amber banner appears
    - Validate: restoring network, green flash appears then hides
    - Validate: banner does not overlap bottom nav bar
    - Validate: banner appears immediately if page loaded while offline

### Phase 7 — Full Integration Smoke Test

20. Generate a PDF with a sample score. Verify ALL of the following in the output:
    - [ ] Button disabled on load, enables after jsPDF loads
    - [ ] Score ring appears in PDF header area
    - [ ] Legal citations section appears
    - [ ] Filename matches `RIF-Shield-Report-YYYY-MM-DD.pdf` format
    - [ ] No JS console errors during full generation cycle
    - [ ] Offline banner appears/disappears correctly on network toggle

---

## 11. Risks and Constraints

### 11.1 jsPDF Version Compatibility

**Risk:** The `doc.addImage()` call (Feature B) requires jsPDF 2.x. The installed version is 2.5.1 (line 18).
**Status:** No risk. jsPDF 2.5.1 fully supports `addImage()` with PNG data URLs.
`doc.output('blob')` (Feature D) is also supported since jsPDF 1.5+. No version upgrade needed.

**Risk:** `window.jspdf.jsPDF` accessor pattern (UMD build). The installed CDN URL is the UMD build
(`jspdf.umd.min.js`) — the UMD build exposes `window.jspdf.jsPDF`. This is already the pattern
used in the current code (line 803). No change required to the accessor.

### 11.2 Canvas Availability in Target Browsers

**Risk:** Some hardened government browser configurations disable HTML5 Canvas via CSP
(`Content-Security-Policy: img-src 'none'` or canvas blocked by group policy).
**Mitigation:** The `getContext('2d')` null-check in `drawScoreRingCanvas()` (step 3 of drawing
sequence) handles this case by returning `null`, which triggers the plain-text fallback in
`generatePDF()`. The PDF still generates completely — only the ring image is replaced by text.
**Status:** Handled. No blocking risk.

### 11.3 iOS 14 Safari Blob URL Support

**Risk:** Blob URL + programmatic anchor click support on iOS Safari.
**Status:** `URL.createObjectURL()` is supported in iOS Safari since iOS 10.3 (2017).
iOS 14 (2020) is well within the supported range. The `anchor.download` attribute may still
be ignored on some iOS Safari versions (known browser limitation) — in that case Safari
opens the PDF in a new tab rather than downloading, which allows the user to use the Share
sheet to save to Files. This is acceptable per PM edge case 4 specification.
**Mitigation:** The Blob URL approach is the correct iOS-compatible pattern. No further
fallback beyond tab-open is required at this sprint level.

### 11.4 Single-File Architecture Preservation

**Status:** CONFIRMED SAFE. All 19 implementation steps modify only `index.html`.
No new files are created. No new CDN dependencies are added (all 5 features use
existing browser APIs: Canvas 2D, navigator.onLine, URL.createObjectURL).
Locked architecture decision #1 (single HTML file until Sprint 11) is fully preserved.

### 11.5 Design Token Lock (Navy/Gold)

**Risk:** Feature E uses amber (#92400e) and green (#14532d) for the offline banner states.
These are not in the locked Navy/Gold brand token set.
**Assessment:** The Navy/Gold lock applies to brand identity and UI chrome (navigation,
cards, headings). System status indicators (error, warning, success) have always used
semantic colors in the existing codebase (e.g., `#ef4444` red for Results dot at line 238,
`#22c55e` green for Training dot at line 237). The offline banner is a system status
indicator — using semantic amber/green is consistent with existing precedent.
**Coordinator Action Required:** Coordinator should confirm this interpretation is
acceptable at Gate A. Fallback if rejected: use navy (`#0f1c3f`) background for both
offline and online-flash states, differentiated by icon/text only.

### 11.6 `escapeHtml()` Requirement

**Risk:** All user-supplied text rendered in the PDF must pass through `escapeHtml()` per
locked architecture decision #4. jsPDF uses `doc.text()` which outputs to a PDF canvas,
not to the DOM — HTML injection is not a vector here. However, the function call is still
required for compliance with the locked architecture rule.
**Requirement for Dev Agent:** Confirm the `escapeHtml()` function exists and locate its
line number before writing any PDF text calls that use `data.journal` entries or any
other user-supplied strings. Apply `escapeHtml()` to: `e.task`, `e.cat`, `e.date`,
and any other `data.*` fields rendered via `doc.text()`.

### 11.7 CDN Watchdog Timer vs. `onJsPDFLoad()` Race

**Risk:** If jsPDF loads very close to the 10-second timeout, both `showPDFLoadError()`
(from setTimeout) and `onJsPDFLoad()` (from script onload) may fire nearly simultaneously.
**Mitigation:** `onJsPDFLoad()` calls `clearTimeout(pdfCdnTimeoutId)` as its FIRST action.
Because JavaScript is single-threaded, if `onJsPDFLoad()` fires before the timeout callback
executes, `clearTimeout()` guarantees the error callback is cancelled. If the timeout fires
first (CDN genuinely failed), `onJsPDFLoad()` will never be called. No race condition possible.

### 11.8 Conflicts with Locked Architecture Decisions

| Locked Decision | Sprint 5 Status |
|----------------|----------------|
| Single HTML file (until Sprint 11) | COMPLIANT — only index.html modified |
| Navy/Gold design system | PARTIAL FLAG — see 11.5 above |
| localStorage primary store (until Sprint 12) | COMPLIANT — no storage changes |
| `escapeHtml()` on all user data in innerHTML | COMPLIANT — see 11.6 above |
| Schema version increment on data structure changes | COMPLIANT — no schema change |
| CDN scripts must carry defer + SRI hash | COMPLIANT — no new CDN scripts added |
| SW cache name format: rif-shield-vN | COMPLIANT — no Service Worker changes |
| No `skipWaiting()` in Service Worker | COMPLIANT — no Service Worker changes |

---

## Summary

Sprint 5 requires modifications to ONE file only: `index.html`.
All 5 features are implementable using existing browser APIs with no new CDN dependencies.
The implementation adds 11 new constants, 9 new functions, 2 module-scope variables,
2 new HTML elements, and CSS rules for the offline banner.
The `generatePDF()` function is modified in-place (entry guard, ring call, citations call,
download call) — it is NOT rewritten.
One flag requires Coordinator acknowledgment before coding begins: the semantic color
usage in Feature E (Section 11.5).

---

*End of Sprint 5 Architecture Specification — Agent A2, Solutions Architect*
*Document prepared: 2026-03-14*
*Next step: Project Coordinator (A0) Gate A Review*
