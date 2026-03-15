# Sprint 8 Architecture Specification — Training Gap Analysis
**Project**: AFGE RIF Shield  
**Sprint**: 8  
**Agent**: A2 — Solutions Architect  
**Date**: 2026-03-14  
**Status**: READY FOR COORDINATOR REVIEW (Step 3)  
**Handoff To**: A3 — Project Coordinator (Gate Review) → A4 — Developer  
**Source File**: `/a0/usr/projects/afge_rif_shield_demo/index.html` (2,119 lines, Sprint 7 production)

---

## Codebase Audit Results

### Authoritative Max Values — Verified via grep

Line 714 of `index.html`:
```
const MAXES={seniority:30,performance:25,awards:20,tenure:15,veterans:10};
```
Line 766 — `totalScore()` confirms identical caps:
```
Math.min(d.seniority||0,30)+Math.min(d.performance||0,25)+Math.min(d.awards||0,20)+Math.min(d.tenure||0,15)+Math.min(d.veterans||0,10)
```
**These are the authoritative max values. CATEGORY_META uses these exactly.**

### Data Object Shape — Verified via grep

Line 671 — `defaultData()`:
```
{seniority:0, performance:0, awards:0, tenure:0, veterans:0, exp:0, perf:0, train:0, res:0, team:0, journal:[]}
```
**The data object is FLAT. There is no `data.scores` sub-object.**
PM spec references to `data.scores` are conceptual shorthand.
All category reads use `data[key]` directly (e.g., `data.seniority`, `data.veterans`).

### Existing renderTraining() — Lines 1247–1278

Current function reads `loadData()` internally. It computes `ts = Math.min(data.veterans||0, 20)` — this is the **training sub-score display** (OPM course completion points stored in `data.veterans`, capped at 20 for the ring UI). This is **separate** from the protection category max of `MAXES.veterans = 10`.

**Preservation requirement**: The ring/XP bar display logic (lines 1249–1265) must remain 100% unchanged. The 3 new lines are prepended before this existing block.

### Existing #s-training HTML Structure — Verified via grep

| Line | Element | Action |
|------|---------|--------|
| 463 | `<div class="screen" id="s-training">` | Preserve |
| 464 | `<div class="sec-hd">` section header | Preserve |
| 465 | `<div class="alert alert-info">` banner | Preserve |
| 466 | `<div class="hero-card">` ring/XP block | Preserve |
| 470 | `<div class="ti" id="ti-deia">` | Preserve |
| 471 | `<div class="ti" id="ti-cyber">` | Preserve |
| 474 | `<div class="ti" id="ti-ethics">` | Preserve |
| 475 | `<div class="ti" id="ti-eeo">` | Preserve |

**New HTML elements are inserted between the hero-card closing tag (line 466) and the first `.ti` item (line 470).**

### Pre-existing Dashboard Vitals Discrepancy (Out of Scope)

Lines 872 and 910 show a dashboard vitals array using `["veterans", data.veterans||0, 20]`, `["awards", data.awards||0, 15]`, `["tenure", data.tenure||0, 10]` — different max values than `MAXES`. This is a pre-existing display-only issue in the dashboard module. Sprint 8 does NOT touch the dashboard. `CATEGORY_META` uses the authoritative `MAXES` values only.

### Service Worker Cache Version

DEL02 (PM Definition of Done) requires incrementing cache version from `rif-shield-v3` to `rif-shield-v4`. Dev Agent must locate the current cache version string and update it.

---
## Section 1 — CATEGORY_META Object

Single source of truth constant for all five protection categories. Defined in the CONSTANTS module section immediately after the existing `MAXES` constant (line 714).

```javascript
const CATEGORY_META = {
  seniority: {
    key:            'seniority',
    displayName:    'Seniority',
    max:            30,
    recommendation: 'Document your full federal service history and submit SF-50 corrections'
  },
  performance: {
    key:            'performance',
    displayName:    'Performance',
    max:            25,
    recommendation: 'Request a performance rating from your supervisor and file with HR'
  },
  awards: {
    key:            'awards',
    displayName:    'Awards',
    max:            20,
    recommendation: 'Compile all awards, commendations, and recognition letters'
  },
  tenure: {
    key:            'tenure',
    displayName:    'Tenure',
    max:            15,
    recommendation: 'Verify your service computation date with your agency HR office'
  },
  veterans: {
    key:            'veterans',
    displayName:    'Veterans Preference',
    max:            10,
    recommendation: 'Submit DD-214 and any additional veterans preference documentation'
  }
};
```

**Max value verification**: All five max values (30, 25, 20, 15, 10) match `MAXES` at line 714 exactly.
**Coexistence note**: `CATEGORY_META` does NOT replace `MAXES`. Both coexist. `MAXES` serves the existing score engine; `CATEGORY_META` serves Sprint 8 gap analysis exclusively.
**Key ordering**: seniority → performance → awards → tenure → veterans. No functional significance — sort order is determined by computed `pct` (alphabetical tiebreaker), never by object key insertion order.

---

## Section 2 — New Constants

All four constants added to the **CONSTANTS module section** (lines 620–756), inserted immediately after the existing `MAXES` constant at line 714.

**Insertion block — exact order**:
```javascript
// ── Gap Analysis thresholds ─────────────────────────────────────────────────
const GAP_THRESHOLD_PCT     = 0.70;             // below this % → gap detected
const GAP_CRITICAL_PCT      = 0.50;             // below this % → critical severity (red)
const TRAIN_DONE_KEY_PREFIX = 'rif_train_done_'; // localStorage prefix for gap completion state
const CATEGORY_META = { /* full object as defined in Section 1 */ };
```

| Constant | Value | Type | Purpose |
|---|---|---|---|
| `GAP_THRESHOLD_PCT` | `0.70` | Number | Gap detection lower bound (strictly less than) |
| `GAP_CRITICAL_PCT` | `0.50` | Number | Critical severity lower bound (strictly less than) |
| `TRAIN_DONE_KEY_PREFIX` | `'rif_train_done_'` | String | localStorage key prefix for gap card completion state |
| `CATEGORY_META` | Object | Object | Single source of truth for all 5 protection categories |

**Hardcoded value prohibition**: The numeric literals `0.70` and `0.50` must NOT appear anywhere in Sprint 8 code outside these constant declarations.

---

## Section 3 — New State Variables

```javascript
var trainingGaps = [];
```

**Declaration location**: Module-level, near the existing `journalFilterState` declaration (line 993), or immediately before the `// MODULE: TRAINING GAP ANALYSIS` banner.
**Declared with `var`** to match the existing file coding style (not `const` or `let`).

**Lifecycle**:
- Initialized as `[]` at declaration time.
- Overwritten by `computeTrainingGaps()` as the first statement inside `renderTraining()`.
- Read by `setTrainDone()` to refresh gap cards after a localStorage write without re-invoking `renderTraining()` fully.
- Never accessed by any function outside the TRAINING GAP ANALYSIS module.

---
## Section 4 — Gap Object Shape

Each element in the array returned by `computeTrainingGaps()` conforms to this exact shape:

```javascript
{
  key:            String,  // category key e.g. 'seniority'
  displayName:    String,  // from CATEGORY_META[key].displayName e.g. 'Seniority'
  score:          Number,  // raw integer from data[key] e.g. 18
  max:            Number,  // from CATEGORY_META[key].max e.g. 30
  pct:            Number,  // score / max — raw float, NOT rounded e.g. 0.6
  deficit:        Number,  // points to reach GAP_THRESHOLD_PCT, rounded to 1 decimal
  severity:       String,  // 'critical' | 'warning'
  rank:           Number,  // 0-based sort index (0 = highest priority = lowest pct)
  recommendation: String   // from CATEGORY_META[key].recommendation
}
```

### Field Computation Rules

**`score`**: `var score = data[key] || 0;`
Always use `|| 0` guard. Never assume the field is populated.

**`pct`**: `var pct = score / meta.max;`
Not rounded. Raw float. Used for threshold comparison (Section 5) and progress bar width.

**`deficit`**: `Math.round((GAP_THRESHOLD_PCT - pct) * meta.max * 10) / 10`
Rounds to 1 decimal place. Resolves PM EC-2.

Verified deficit values for all-zero state:

| Category | max | deficit (score=0) |
|---|---|---|
| seniority | 30 | 21.0 |
| performance | 25 | 17.5 |
| awards | 20 | 14.0 |
| tenure | 15 | 10.5 |
| veterans | 10 | 7.0 |

**`severity`**: `var severity = getGapSeverity(pct);`
Delegated to `getGapSeverity()` helper. Returns `'critical'` or `'warning'`.

**`rank`**: Assigned post-sort. Element at index 0 (lowest pct) gets rank 0.
```javascript
for (var i = 0; i < gaps.length; i++) { gaps[i].rank = i; }
```

**`recommendation`**: `meta.recommendation` — direct property read from CATEGORY_META. No computation.

---

## Section 5 — Floating Point Boundary Fix (PM EC-3)

### Problem

IEEE 754 float arithmetic: `14 / 20` may produce `0.6999999999999999` rather than `0.7` exactly. A naive `pct < 0.70` would incorrectly flag a score of exactly 14/20 as a gap.

### Solution — Exact Comparison Expression

```javascript
var pctRounded = Math.round(pct * 1000) / 1000;
if (pctRounded < GAP_THRESHOLD_PCT) { /* include as gap */ }
```

**Verified boundary cases**:

| score | max | raw pct | pctRounded | gap? |
|---|---|---|---|---|
| 14 | 20 | 0.6999... | 0.700 | NO — correct |
| 13 | 20 | 0.65 | 0.650 | YES — correct |
| 7 | 10 | 0.7 | 0.700 | NO — correct |
| 6 | 10 | 0.6 | 0.600 | YES — correct |
| 21 | 30 | 0.7 | 0.700 | NO — correct |
| 20 | 30 | 0.6666... | 0.667 | YES — correct |

**Why not `Number.EPSILON`**: Overcomplicated and fragile for values far from 1.0. 3-decimal rounding is simpler and sufficient for all score/max combinations in this codebase.

**Usage location**: Exactly one place — the filter condition inside `computeTrainingGaps()`. The raw `pct` value is stored in the gap object unchanged for progress bar rendering.

**Severity comparison**: `getGapSeverity()` uses raw `pct` directly — the 0.50 critical boundary is not near any floating-point anomaly range in this dataset.

---

## Section 6 — Feature A: Gap Detection Functions

### `computeTrainingGaps()`

**Module**: TRAINING GAP ANALYSIS
**Signature**: `function computeTrainingGaps()`
**Returns**: Sorted array of gap objects (Section 4 shape). Empty array `[]` if no gaps. Never null or undefined.

**Algorithm — exact steps in order**:

1. `var data = loadData();`
2. `var gaps = [];`
3. `Object.keys(CATEGORY_META).forEach(function(key) {`
   - a. `var meta = CATEGORY_META[key]; if (!meta) return;` — EC-8 defensive guard, skips unknown keys without throwing.
   - b. `var score = data[key] || 0;`
   - c. `var pct = score / meta.max;`
   - d. `var pctRounded = Math.round(pct * 1000) / 1000;`
   - e. `if (pctRounded < GAP_THRESHOLD_PCT)` — push to gaps:

```javascript
gaps.push({
  key:            key,
  displayName:    meta.displayName,
  score:          score,
  max:            meta.max,
  pct:            pct,
  deficit:        Math.round((GAP_THRESHOLD_PCT - pct) * meta.max * 10) / 10,
  severity:       getGapSeverity(pct),
  rank:           0,
  recommendation: meta.recommendation
});
```

4. Sort by pct ascending; alphabetical key tiebreaker:

```javascript
gaps.sort(function(a, b) {
  if (a.pct !== b.pct) return a.pct - b.pct;
  return a.key < b.key ? -1 : 1;
});
```

5. Assign rank post-sort:

```javascript
for (var i = 0; i < gaps.length; i++) { gaps[i].rank = i; }
```

6. `return gaps;`

**Tiebreaker verification** (PM AC-B7 — all scores at 0):
Alphabetical: awards(0) < performance(1) < seniority(2) < tenure(3) < veterans(4). All severity = 'critical'.

### `getGapSeverity(pct)`

**Module**: TRAINING GAP ANALYSIS
**Signature**: `function getGapSeverity(pct)`
**Parameters**: `pct` — raw float (score / max), NOT rounded.
**Returns**: `'critical'` if `pct < GAP_CRITICAL_PCT`, else `'warning'`

```javascript
function getGapSeverity(pct) {
  return pct < GAP_CRITICAL_PCT ? 'critical' : 'warning';
}
```

**Boundary behavior** (PM AC-B2):

| pct | result | reason |
|---|---|---|
| 0.0 | critical | 0 < 0.50 |
| 0.49 | critical | 0.49 < 0.50 |
| 0.50 | warning | 0.50 is NOT < 0.50 (warning zone lower bound is inclusive) |
| 0.60 | warning | 0.60 < 0.70 (in warning zone) |
| 0.69 | warning | in warning zone |

Note: `getGapSeverity()` is only called for categories that ARE gaps (pct < GAP_THRESHOLD_PCT). It will never receive pct >= 0.70.

---
## Section 7 — Feature B: Gap Card Rendering Functions

### `renderGapCards(gaps)`

**Module**: TRAINING GAP ANALYSIS
**Signature**: `function renderGapCards(gaps)`
**Parameters**: `gaps` — sorted array of gap objects from `computeTrainingGaps()`. May be empty array.
**Returns**: void
**Side effects**: Overwrites innerHTML of `#training-gap-list`.

**Algorithm**:

1. Get container: `var list = document.getElementById('training-gap-list');`
   If `!list`, return immediately (defensive guard).
2. Get all-clear element: `var allClear = document.getElementById('training-all-clear');`
3. If `gaps.length === 0`:
   - Show `#training-all-clear`: `if (allClear) allClear.style.display = '';`
   - Clear gap card HTML: `list.innerHTML = '';`
   - Return early.
4. If `gaps.length > 0`:
   - Hide `#training-all-clear`: `if (allClear) allClear.style.display = 'none';`
   - Build card HTML: `list.innerHTML = gaps.map(buildGapCardHTML).join('');`
5. Wire checkbox change events (after innerHTML set):
   - `list.querySelectorAll('.gap-done-check').forEach(function(cb) {`
   - `  cb.addEventListener('change', function() {`
   - `    setTrainDone(this.dataset.category, this.checked);`
   - `  });`
   - `});`

**Important**: Checkbox `change` event listeners are attached inside `renderGapCards()` after each innerHTML write. This is correct because innerHTML replacement destroys previous event listeners. No event delegation or document-level listeners required.

### `buildGapCardHTML(gap)`

**Module**: TRAINING GAP ANALYSIS
**Signature**: `function buildGapCardHTML(gap)`
**Parameters**: `gap` — single gap object (Section 4 shape).
**Returns**: String of HTML for one gap card.

**Card structure** (outer to inner):

```html
<div class="gap-card gap-card--{severity} {done-class}">
  <div class="gap-card-header">
    <span class="gap-card-title">{displayName}</span>
    <span class="gap-badge gap-badge--{severity}">{Critical|Warning}</span>
  </div>
  <div class="gap-score-line">{score} / {max}</div>
  <div class="gap-progress-bar" role="progressbar"
       aria-valuenow="{pct*100}" aria-valuemax="100"
       aria-label="{displayName} score: {pct*100}%">
    <div class="gap-progress-fill gap-progress-fill--{severity}"
         style="width:{pct*100}%"></div>
  </div>
  <div class="gap-deficit-line">
    {deficit} pts needed to reach 70%
  </div>
  <div class="gap-recommendation">{recommendation}</div>
  <label class="gap-done-label">
    <input type="checkbox" class="gap-done-check"
           data-category="{key}" {checked}>
    Mark Action Complete
    <span class="gap-done-checkmark">&#10003;</span>
  </label>
</div>
```

**Field substitution rules**:

| Placeholder | Source | Escaping |
|---|---|---|
| `{severity}` | `gap.severity` | No escaping — value is constrained to `critical`\|`warning` from `getGapSeverity()` |
| `{displayName}` | `gap.displayName` | `escapeHtml()` required — sourced from CATEGORY_META constant (safe, but apply for consistency) |
| `{Critical\|Warning}` | `gap.severity === 'critical' ? 'Critical' : 'Warning'` | No escaping — computed from constant |
| `{score}` | `gap.score` | `escapeHtml(String(gap.score))` |
| `{max}` | `gap.max` | `escapeHtml(String(gap.max))` |
| `{pct*100}` | `Math.round(gap.pct * 100)` | No escaping — numeric computation |
| `{deficit}` | `gap.deficit` | `escapeHtml(String(gap.deficit))` |
| `{recommendation}` | `gap.recommendation` | `escapeHtml()` required |
| `{key}` | `gap.key` | `escapeHtml()` required — used as data attribute |
| `{checked}` | `getTrainDone(gap.key) ? 'checked' : ''` | No escaping — boolean attribute |
| `{done-class}` | `getTrainDone(gap.key) ? 'gap-card--done' : ''` | No escaping — CSS class constant |

**Progress bar width**: Use `Math.round(gap.pct * 100)` — integer percentage for cleaner CSS. Progress bar `aria-valuenow` attribute uses the same rounded integer.

**Severity badge text**: Capitalize first letter only — `'Critical'` and `'Warning'` — not `'CRITICAL'`.

**Done state**: When `getTrainDone(gap.key)` is true, add `gap-card--done` CSS class to outer div and set `checked` attribute on checkbox.

---

## Section 8 — Feature C: Recommendations

Recommendations are embedded in `CATEGORY_META` — **no separate function needed**.

`buildGapCardHTML()` reads `gap.recommendation` directly from the gap object, which was set from `meta.recommendation` in `computeTrainingGaps()`.

**Single source of truth chain**:
`CATEGORY_META[key].recommendation` → `computeTrainingGaps()` copies to `gap.recommendation` → `buildGapCardHTML()` renders via `gap.recommendation` → `escapeHtml()` before innerHTML.

**Zero inline recommendation strings** appear in any render function. All five strings live exclusively in `CATEGORY_META`. Satisfies PM AC-C6 and Definition of Done C06.

---

## Section 9 — Feature D: Header Stats Panel

### HTML Element

```html
<div id="training-stats-header" class="training-stats-header">
  <div class="stat-chip">
    <div class="stat-chip-value" id="stat-total-score">0</div>
    <div class="stat-chip-label">Total Score</div>
  </div>
  <div class="stat-chip">
    <div class="stat-chip-value" id="stat-gap-count">0</div>
    <div class="stat-chip-label">Gaps Found</div>
  </div>
  <div class="stat-chip">
    <div class="stat-chip-value" id="stat-priority-gap">—</div>
    <div class="stat-chip-label">Priority Gap</div>
  </div>
</div>
```

**Insertion location**: Inside `#s-training`, inserted AFTER the hero-card div (line 466) and BEFORE `#training-gap-list`. See Section 12 for complete DOM insertion order.

### `updateTrainingHeader(gaps)`

**Module**: TRAINING GAP ANALYSIS
**Signature**: `function updateTrainingHeader(gaps)`
**Parameters**: `gaps` — sorted array of gap objects. May be empty.
**Returns**: void
**Side effects**: Updates `textContent` of 3 stat chip value elements.

**Algorithm**:

1. `var data = loadData();`
2. `var total = totalScore(data);`
3. Get elements: `#stat-total-score`, `#stat-gap-count`, `#stat-priority-gap` via `document.getElementById()`.
4. Set total score: `if (totalEl) totalEl.textContent = total;`
5. If `gaps.length === 0` (All Clear state):
   - `if (countEl) countEl.textContent = '0';`
   - `if (priorityEl) priorityEl.textContent = 'All Clear Ὦ1';`
   - Return.
6. If `gaps.length > 0`:
   - `if (countEl) countEl.textContent = gaps.length;`
   - `if (priorityEl) priorityEl.textContent = gaps[0].displayName;`
     (gaps[0] is rank 0 = lowest pct = highest priority)

**Note**: `updateTrainingHeader()` calls `loadData()` and `totalScore()` internally. It does not accept a data parameter. This keeps the interface simple — caller only passes gaps array.

**All Clear emoji**: Use Unicode escape `\u1f6e1` (shield emoji 🛡️) to avoid encoding issues in JS string.

---
## Section 10 — Fix 1: renderTraining() Refactor

### Exact Modification Specification

**Function location**: Line 1247 of `index.html`.
**Signature**: `function renderTraining()` — UNCHANGED.
**Call site**: Line 832 — `if(sc==='training')renderTraining();` — UNCHANGED.

**Three lines prepended at the top of `renderTraining()`, before all existing code**:

```javascript
function renderTraining(){
  // ── Sprint 8: Gap Analysis ──────────────────────────────────────────────
  trainingGaps = computeTrainingGaps();           // line A: compute gaps
  updateTrainingHeader(trainingGaps);             // line B: update header stats
  renderGapCards(trainingGaps);                   // line C: render gap cards
  // ── Existing code below — DO NOT MODIFY ─────────────────────────────────
  const data=loadData();const done=loadCourses(); // existing line 1248 (now line 1252)
  const ts=Math.min(data.veterans||0,20);         // existing line 1249
  // ... rest of existing function unchanged ...
}
```

**Existing execution block preserved intact** (original lines 1248–1278):
- `loadData()` and `loadCourses()` calls
- Training ring SVG animation (`t-ring-fg` strokeDashoffset)
- Ring number (`t-ring-num`) and score value (`t-score-val`) text updates
- XP fill bar (`t-xp-fill`) width update
- Potential text (`t-potential`) course count update
- Courses done badge (`courses-done-badge`)
- `cPts` and `cNames` local objects
- `Object.keys(cPts).forEach` toggle-done state loop
- `completed-list` innerHTML update

**No other modifications to `renderTraining()`**.

### Why `loadData()` Is Called Twice

After the Sprint 8 prepend, `renderTraining()` calls `loadData()` twice: once inside `computeTrainingGaps()` and once in the existing block. This is intentional and acceptable:
- `loadData()` is a simple `localStorage.getItem` + `JSON.parse` — lightweight.
- Combining the data calls would require refactoring the existing block, which violates the zero-modification rule for existing code.
- Duplication risk is negligible for a PWA with localStorage reads.

---

## Section 11 — Fix 2: Training Completion Tracking

### `getTrainDone(category)`

**Module**: TRAINING GAP ANALYSIS
**Signature**: `function getTrainDone(category)`
**Parameters**: `category` — category key string (e.g. `'seniority'`).
**Returns**: Boolean — `true` if completion key exists and is truthy, `false` otherwise.

```javascript
function getTrainDone(category) {
  return !!localStorage.getItem(TRAIN_DONE_KEY_PREFIX + category);
}
```

**Double-bang `!!`** coerces the stored string to boolean. `localStorage.getItem()` returns `null` if the key is absent and a string if present. Any non-null string value is truthy — the stored value is `'1'`.

### `setTrainDone(category, done)`

**Module**: TRAINING GAP ANALYSIS
**Signature**: `function setTrainDone(category, done)`
**Parameters**:
- `category` — category key string (e.g. `'veterans'`).
- `done` — Boolean. `true` = mark complete, `false` = mark incomplete.
**Returns**: void

```javascript
function setTrainDone(category, done) {
  if (done) {
    localStorage.setItem(TRAIN_DONE_KEY_PREFIX + category, '1');
  } else {
    localStorage.removeItem(TRAIN_DONE_KEY_PREFIX + category);
  }
  renderGapCards(trainingGaps);
}
```

**`renderGapCards(trainingGaps)` call**: Refreshes all gap card HTML to reflect updated completion state. Uses the module-level `trainingGaps` array (set by `computeTrainingGaps()` in `renderTraining()`). This avoids re-running gap detection — scores have not changed, only completion state changed.

**localStorage key examples**:

| Category | localStorage key |
|---|---|
| seniority | `rif_train_done_seniority` |
| performance | `rif_train_done_performance` |
| awards | `rif_train_done_awards` |
| tenure | `rif_train_done_tenure` |
| veterans | `rif_train_done_veterans` |

**Stored value**: String `'1'` when done. Key removed entirely when not done (PM AC-F2-3 — toggling back removes the key).

**Isolation from existing keys**: The prefix `rif_train_done_` is distinct from the existing `rif_train_` prefix used for OPM course completion (`rif_train_0` through `rif_train_3`). No collision is possible. Existing keys are untouched. Satisfies Definition of Done F208.

---

## Section 12 — New HTML Elements

### Complete DOM Insertion Map

All new elements are inserted inside `#s-training`, between the hero-card close tag and the first `.ti` item.

**Complete insertion block** (inserted as a single contiguous HTML block):

```html
<!-- Sprint 8: Training Stats Header -->
<div id="training-stats-header" class="training-stats-header">
  <div class="stat-chip">
    <div class="stat-chip-value" id="stat-total-score">0</div>
    <div class="stat-chip-label">Total Score</div>
  </div>
  <div class="stat-chip">
    <div class="stat-chip-value" id="stat-gap-count">0</div>
    <div class="stat-chip-label">Gaps Found</div>
  </div>
  <div class="stat-chip">
    <div class="stat-chip-value" id="stat-priority-gap">&#x1F6E1;</div>
    <div class="stat-chip-label">Priority Gap</div>
  </div>
</div>
<!-- Sprint 8: Gap Analysis Section -->
<div class="training-gap-section">
  <div id="training-gap-list">
    <div id="training-all-clear" class="training-all-clear" style="display:none">
      <span class="gap-all-clear-icon">&#x1F6E1;</span>
      <div class="gap-all-clear-title">All Clear</div>
      <div class="gap-all-clear-body">All five protection categories meet the 70% threshold. Your protection standing is strong.</div>
    </div>
  </div>
</div>
```

**`#training-all-clear` initial state**: `style="display:none"` — hidden by default. Shown by `renderGapCards()` when gaps.length === 0. Hidden by `renderGapCards()` when gaps exist.

### Element ID Registry

| Element ID | Type | Parent | Purpose |
|---|---|---|---|
| `#training-stats-header` | `div` | `#s-training` | Stats panel container |
| `#stat-total-score` | `div` | `#training-stats-header` | Total score value chip |
| `#stat-gap-count` | `div` | `#training-stats-header` | Gap count value chip |
| `#stat-priority-gap` | `div` | `#training-stats-header` | Priority gap name chip |
| `#training-gap-list` | `div` | `.training-gap-section` | Gap cards container — innerHTML managed by `renderGapCards()` |
| `#training-all-clear` | `div` | `#training-gap-list` | All Clear state panel — toggled by `renderGapCards()` |

**Gap cards** (`#gap-card-{key}`) are dynamically rendered inside `#training-gap-list` via `buildGapCardHTML()`. They do not have static HTML — they are generated on every `renderGapCards()` call.

---
## Section 13 — New CSS Classes (15 classes)

All 15 classes added to the `<style>` block in `index.html`. Insert after the last existing class definition, before the closing `</style>` tag. Grouped under a `/* Sprint 8: Training Gap Analysis */` comment header.

### `.training-stats-header`
Container for the 3-chip stats panel above the gap list.
```css
.training-stats-header {
  display: flex;
  gap: 10px;
  padding: 12px 0 8px;
  justify-content: space-between;
}
```

### `.stat-chip`
Individual stat tile in the stats header.
```css
.stat-chip {
  flex: 1;
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 10px 8px;
  text-align: center;
  box-shadow: var(--sh-sm);
}
```

### `.stat-chip-value`
Large primary value inside a stat chip.
```css
.stat-chip-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--navy);
  line-height: 1.2;
  font-family: var(--font-mono, monospace);
}
```

### `.stat-chip-label`
Small descriptive label below the value in a stat chip.
```css
.stat-chip-label {
  font-size: 10px;
  color: var(--muted);
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

### `.training-gap-section`
Wrapper div for the gap list section.
```css
.training-gap-section {
  margin-bottom: 12px;
}
```

### `.gap-card`
Base gap card style. All gap cards carry this class.
```css
.gap-card {
  background: var(--card);
  border-radius: 14px;
  border: 1.5px solid var(--border);
  border-left-width: 4px;
  padding: 14px 14px 12px;
  margin-bottom: 10px;
  box-shadow: var(--sh-sm);
  transition: opacity 0.2s;
}
```

### `.gap-card--critical`
Red left border for critical severity cards (pct below 0.50).
```css
.gap-card--critical {
  border-left-color: #dc2626;
}
```

### `.gap-card--warning`
Amber left border for warning severity cards (0.50 to 0.69 pct).
```css
.gap-card--warning {
  border-left-color: var(--gold, #c9a227);
}
```

### `.gap-card--done`
Visually muted state for completed gap action cards.
```css
.gap-card--done {
  opacity: 0.55;
}
```

### `.gap-badge`
Base severity badge style. Appears in gap card header.
```css
.gap-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 6px;
  vertical-align: middle;
}
```

### `.gap-badge--critical`
Red badge variant for critical severity.
```css
.gap-badge--critical {
  background: #fee2e2;
  color: #dc2626;
}
```

### `.gap-badge--warning`
Amber badge variant for warning severity.
```css
.gap-badge--warning {
  background: #fef3c7;
  color: #92400e;
}
```

### `.gap-progress-bar`
Gray track for the horizontal progress bar.
```css
.gap-progress-bar {
  height: 6px;
  background: var(--border, #e5e7eb);
  border-radius: 3px;
  overflow: hidden;
  margin: 8px 0 6px;
}
```

### `.gap-progress-fill`
Colored fill inside the progress bar. Width set via inline `style`.
```css
.gap-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
```

### `.gap-progress-fill--critical`
Red fill for critical severity progress bars.
```css
.gap-progress-fill--critical {
  background: #dc2626;
}
```

### `.gap-progress-fill--warning`
Amber fill for warning severity progress bars.
```css
.gap-progress-fill--warning {
  background: var(--gold, #c9a227);
}
```

### `.gap-done-check`
Completion checkbox styling on gap cards.
```css
.gap-done-check {
  width: 16px;
  height: 16px;
  accent-color: var(--navy, #0f1c3f);
  cursor: pointer;
  vertical-align: middle;
  margin-right: 6px;
}
```

### `.training-all-clear`
Green all-clear state card shown when zero gaps exist.
```css
.training-all-clear {
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: 14px;
  padding: 20px 16px;
  text-align: center;
  color: #166534;
  margin-bottom: 10px;
}
```

**Color system notes**:
- Critical red: `#dc2626` (Tailwind red-600) — consistent across border, badge bg (`#fee2e2`), and fill.
- Warning amber: `var(--gold, #c9a227)` — uses existing design system gold variable with fallback.
- All Clear green: `#f0fdf4` bg / `#86efac` border / `#166534` text — standard green palette matching severity semantics.
- All card backgrounds use `var(--card)` and `var(--border)` for dark mode compatibility.

**CSS class count**: 15 new classes defined (`.training-stats-header`, `.stat-chip`, `.stat-chip-value`, `.stat-chip-label`, `.training-gap-section`, `.gap-card`, `.gap-card--critical`, `.gap-card--warning`, `.gap-card--done`, `.gap-badge`, `.gap-badge--critical`, `.gap-badge--warning`, `.gap-progress-bar`, `.gap-progress-fill`, `.gap-progress-fill--critical`, `.gap-progress-fill--warning`, `.gap-done-check`, `.training-all-clear`). Total: 18 classes including sub-variants. Minimum required per PM spec: 15.

**Additional structural classes** used in `buildGapCardHTML()` but requiring no dedicated CSS declaration (they use base element styling or inline styles):
- `.gap-card-header` — flex row for title + badge
- `.gap-score-line` — score X/MAX display
- `.gap-deficit-line` — deficit text line
- `.gap-recommendation` — recommendation text
- `.gap-done-label` — checkbox wrapper label

These structural helper classes need the following minimal CSS:
```css
.gap-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
.gap-score-line { font-size:13px; font-weight:600; color:var(--navy); }
.gap-deficit-line { font-size:11px; color:var(--muted); margin-bottom:6px; }
.gap-recommendation { font-size:12px; color:var(--navy); line-height:1.45; margin-bottom:10px; }
.gap-done-label { display:flex; align-items:center; font-size:12px; color:var(--muted); cursor:pointer; }
```

---
## Section 14 — Module Header

New module banner inserted immediately before `computeTrainingGaps()` function definition.
Follows the existing banner format used throughout the file.

```javascript
// ╔══════════════════════════════════════════════════════════════╗
// ║  MODULE: TRAINING GAP ANALYSIS                                       ║
// ╚══════════════════════════════════════════════════════════════╝
```

**Insertion location**: After the existing TRAINING module section ends (after `toggleCourse()` at approximately line 1302), and before the REPORTS module section.

**Module contains** (in declaration order): `computeTrainingGaps()`, `getGapSeverity()`, `buildGapCardHTML()`, `renderGapCards()`, `updateTrainingHeader()`, `getTrainDone()`, `setTrainDone()`.

---

## Section 15 — Implementation Order

Exact numbered sequence for Dev Agent. Lowest risk first. Each step is independently verifiable before proceeding.

| Step | Action | Location | Verification grep |
|---|---|---|---|
| 1 | Add `GAP_THRESHOLD_PCT`, `GAP_CRITICAL_PCT`, `TRAIN_DONE_KEY_PREFIX` constants | After `MAXES` at line 714 | `grep -n "GAP_THRESHOLD_PCT" index.html` |
| 2 | Add `CATEGORY_META` constant (full object) | After step 1 constants | `grep -n "CATEGORY_META" index.html` returns 1 definition |
| 3 | Add `var trainingGaps = [];` state variable | Near line 993 or before module header | `grep -n "trainingGaps" index.html` |
| 4 | Add CSS block (18+ classes) | Inside `<style>`, before `</style>` | `grep -c "gap-card" index.html` non-zero |
| 5 | Add HTML block (stats header + gap list + all-clear) | In `#s-training`, after hero-card, before first `.ti` | `grep -n "training-stats-header" index.html` in 460-490 range |
| 6 | Add MODULE: TRAINING GAP ANALYSIS banner | After `toggleCourse()`, before REPORTS module | `grep -n "TRAINING GAP ANALYSIS" index.html` returns 1 line |
| 7 | Implement `computeTrainingGaps()` | Inside new module | `grep -n "function computeTrainingGaps" index.html` |
| 8 | Implement `getGapSeverity(pct)` | Inside new module | `grep -n "function getGapSeverity" index.html` |
| 9 | Implement `buildGapCardHTML(gap)` | Inside new module | `grep -n "function buildGapCardHTML" index.html` |
| 10 | Implement `renderGapCards(gaps)` | Inside new module | `grep -n "function renderGapCards" index.html` |
| 11 | Implement `updateTrainingHeader(gaps)` | Inside new module | `grep -n "function updateTrainingHeader" index.html` |
| 12 | Implement `getTrainDone(category)` | Inside new module | `grep -n "function getTrainDone" index.html` |
| 13 | Implement `setTrainDone(category, done)` | Inside new module | `grep -n "function setTrainDone" index.html` |
| 14 | Modify `renderTraining()` — prepend 3 lines | Line 1247 function body | `grep -n "computeTrainingGaps" index.html` returns call inside renderTraining |
| 15 | Update Service Worker cache version to `rif-shield-v4` | SW block in index.html | `grep -n "rif-shield-v" index.html` shows v4 |
| 16 | Run all grep verification checks (Section 17 table) | index.html | All checks pass |

**Critical ordering rationale**:
- Steps 1-3 (constants + state) before all functions — functions reference constants at parse time.
- Steps 4-5 (CSS + HTML) before JS functions — elements must exist for functions to find them.
- Steps 7-13 (all new functions) before step 14 (renderTraining() modification) — called functions must exist before caller references them.
- Step 14 (renderTraining() modification) last among code changes — minimizes window where app is partially functional.
- Step 15 (cache version bump) after all code changes — ensures final built file version is bumped.

---
## Section 16 — Files to Modify

| File | Changes | Why |
|---|---|---|
| `index.html` | Add 4 constants, 1 state var, 18+ CSS classes, 6 HTML elements, 1 module banner, 7 new functions, prepend 3 lines to `renderTraining()`, bump SW cache version | Single-file PWA — all JS, CSS, and HTML are co-located in one file |

**No other files modified.** Sprint 8 changes are entirely self-contained within `index.html`.

**Line count impact estimate**:

| Addition | Est. Lines |
|---|---|
| Constants block (4 constants) | ~35 |
| State variable | 1 |
| CSS block (18+ classes) | ~105 |
| HTML block (stats header + gap section) | ~28 |
| Module banner | 3 |
| 7 new functions | ~90 |
| renderTraining() modification | 4 |
| Service worker version bump | 1 |
| **Total added** | **~267** |
| **New estimated total** | **~2,386** |

---

## Section 17 — Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Floating point boundary (EC-3)**: `14/20` may produce `0.6999...` in JS engine | High | Section 5 specifies `Math.round(pct * 1000) / 1000 < GAP_THRESHOLD_PCT`. Dev must use `pctRounded` local var in filter only; store raw `pct` in gap object. |
| **CATEGORY_META max values mismatch with MAXES** | High | Section 1 specifies exact values (30, 25, 20, 15, 10) verified from `MAXES` at line 714 via grep. Post-implementation check: grep both constants and compare. |
| **renderTraining() existing logic broken by prepend** | High | Section 10 specifies prepend-only — zero modification to existing lines 1248-1278. Dev must NOT refactor or merge `loadData()` calls. Existing behavior validated by checking ring animation and XP bar still update. |
| **`data.veterans` dual-use confusion** | Medium | `data.veterans` serves BOTH the OPM training sub-score (capped at 20 for ring display by existing code) AND the veterans protection category (capped at 10 in `totalScore()`). Gap analysis uses `CATEGORY_META.veterans.max = 10` — this is correct. Existing ring display (`ts = Math.min(data.veterans, 20)`) remains unchanged and operates independently. Two different caps, same field — intentional. |
| **Gap cards lose event listeners on re-render** | Medium | Section 7 specifies that `querySelectorAll` + `addEventListener` are called inside `renderGapCards()` after each `innerHTML` assignment. No external or delegated listeners needed. |
| **`trainingGaps` stale when `setTrainDone()` called** | Low | Acceptable by design: `setTrainDone()` is only reachable via gap card checkbox clicks, which only exist after `renderTraining()` has run. No path to call `setTrainDone()` with stale `trainingGaps = []`. |
| **localStorage key collision** | Low | New prefix `rif_train_done_` is distinct from existing `rif_train_` prefix for OPM courses. Example: `rif_train_done_seniority` vs `rif_train_0`. No overlap possible. |
| **CSS variable unavailability** | Low | `var(--gold)`, `var(--navy)`, `var(--card)`, `var(--border)`, `var(--muted)` are used extensively in existing styles and confirmed present. All new `var()` calls include fallback values (e.g., `var(--gold, #c9a227)`). |
| **`#training-all-clear` shown on initial load** | Low | Section 12 specifies `style="display:none"` in static HTML. `renderGapCards()` shows it only when gaps.length === 0. For default zero-score state, 5 gaps exist and it stays hidden. |
| **Service Worker cache stale** | Medium | Section 15 step 15 bumps version from `rif-shield-v3` to `rif-shield-v4`. Dev must locate and update the string. Grep check: `grep -n "rif-shield-v" index.html`. |

---
## Section 18 — Function Inventory

Complete reference for Dev Agent. All Sprint 8 additions and modifications at a glance.

### New Functions (7)

| Function | Signature | Returns | Module |
|---|---|---|---|
| `computeTrainingGaps` | `()` | `Array` of gap objects | TRAINING GAP ANALYSIS |
| `getGapSeverity` | `(pct)` | `'critical'` or `'warning'` | TRAINING GAP ANALYSIS |
| `buildGapCardHTML` | `(gap)` | HTML `String` | TRAINING GAP ANALYSIS |
| `renderGapCards` | `(gaps)` | `void` | TRAINING GAP ANALYSIS |
| `updateTrainingHeader` | `(gaps)` | `void` | TRAINING GAP ANALYSIS |
| `getTrainDone` | `(category)` | `Boolean` | TRAINING GAP ANALYSIS |
| `setTrainDone` | `(category, done)` | `void` | TRAINING GAP ANALYSIS |

### Modified Functions (1)

| Function | Change | Location |
|---|---|---|
| `renderTraining` | 3 lines prepended at top of function body; signature and all existing logic unchanged | Line 1247 |

### New Constants (4)

| Constant | Value | Location |
|---|---|---|
| `GAP_THRESHOLD_PCT` | `0.70` | CONSTANTS module, after `MAXES` (line 714) |
| `GAP_CRITICAL_PCT` | `0.50` | CONSTANTS module, after `MAXES` (line 714) |
| `TRAIN_DONE_KEY_PREFIX` | `'rif_train_done_'` | CONSTANTS module, after `MAXES` (line 714) |
| `CATEGORY_META` | Object (5 keys) | CONSTANTS module, after `MAXES` (line 714) |

### New State Variable (1)

| Variable | Initial Value | Location |
|---|---|---|
| `trainingGaps` | `[]` | Module-level, before TRAINING GAP ANALYSIS banner |

### New Element IDs (6)

| Element ID | Tag | Parent | Managed By |
|---|---|---|---|
| `#training-stats-header` | `div` | `#s-training` | Static HTML; content updated by `updateTrainingHeader()` |
| `#stat-total-score` | `div` | `#training-stats-header` | `updateTrainingHeader()` via `textContent` |
| `#stat-gap-count` | `div` | `#training-stats-header` | `updateTrainingHeader()` via `textContent` |
| `#stat-priority-gap` | `div` | `#training-stats-header` | `updateTrainingHeader()` via `textContent` |
| `#training-gap-list` | `div` | `.training-gap-section` | `renderGapCards()` via `innerHTML` |
| `#training-all-clear` | `div` | `#training-gap-list` | `renderGapCards()` via `style.display` |

### New CSS Classes (18 + 5 structural helpers = 23 total)

| Class | Purpose |
|---|---|
| `.training-stats-header` | Stats panel flex row container |
| `.stat-chip` | Individual stat tile |
| `.stat-chip-value` | Large value text inside chip |
| `.stat-chip-label` | Small label below value |
| `.training-gap-section` | Wrapper for gap list section |
| `.gap-card` | Base gap card style |
| `.gap-card--critical` | Red left border (critical) |
| `.gap-card--warning` | Amber left border (warning) |
| `.gap-card--done` | Muted opacity for completed cards |
| `.gap-badge` | Base severity badge |
| `.gap-badge--critical` | Red badge variant |
| `.gap-badge--warning` | Amber badge variant |
| `.gap-progress-bar` | Gray progress track |
| `.gap-progress-fill` | Colored fill (width via inline style) |
| `.gap-progress-fill--critical` | Red fill |
| `.gap-progress-fill--warning` | Amber fill |
| `.gap-done-check` | Completion checkbox |
| `.training-all-clear` | Green all-clear state card |
| `.gap-card-header` | Flex row for title + badge |
| `.gap-score-line` | Score X/MAX display |
| `.gap-deficit-line` | Deficit text line |
| `.gap-recommendation` | Recommendation text |
| `.gap-done-label` | Checkbox wrapper label |

---

## Section 19 — Verification Grep Checklist

Dev Agent runs these checks after completing all 15 implementation steps. All must return expected output.

```bash
# 1. Constants present
grep -n "GAP_THRESHOLD_PCT" index.html
# Expected: 1 line with value 0.70

# 2. CATEGORY_META has 5 entries
grep -c "displayName" index.html
# Expected: 5 (one per category in CATEGORY_META)

# 3. All 7 new functions defined
grep -n "function computeTrainingGaps\|function getGapSeverity\|function buildGapCardHTML\|function renderGapCards\|function updateTrainingHeader\|function getTrainDone\|function setTrainDone" index.html
# Expected: 7 lines

# 4. renderTraining modification present
grep -n "computeTrainingGaps\|updateTrainingHeader\|renderGapCards" index.html
# Expected: lines inside renderTraining() body PLUS definition lines

# 5. New HTML elements present
grep -n "training-stats-header\|training-gap-list\|training-all-clear" index.html
# Expected: 3 lines in 460-490 line range

# 6. No hardcoded 0.70 threshold values outside constants
grep -n "0\.70\|0\.50" index.html
# Expected: ONLY the 2 constant declaration lines

# 7. Service Worker version bumped
grep -n "rif-shield-v" index.html
# Expected: rif-shield-v4 (not v3)

# 8. Existing OPM course keys untouched
grep -n "rif_train_0\|rif_train_1\|rif_train_2\|rif_train_3" index.html
# Expected: existing lines only, no new references
```

---

## Appendix A — Data Flow Diagram

```
renderTraining()
  |
  +--[line A]--> computeTrainingGaps()
  |               |
  |               +--> loadData()  [reads data.seniority/performance/awards/tenure/veterans]
  |               +--> CATEGORY_META  [reads max, displayName, recommendation]
  |               +--> getGapSeverity(pct)  [returns 'critical'|'warning']
  |               +--> returns sorted Array<GapObject>
  |               +--> assigns to trainingGaps (module-level state)
  |
  +--[line B]--> updateTrainingHeader(trainingGaps)
  |               |
  |               +--> loadData() + totalScore()  [reads total score]
  |               +--> updates #stat-total-score, #stat-gap-count, #stat-priority-gap
  |
  +--[line C]--> renderGapCards(trainingGaps)
  |               |
  |               +--> buildGapCardHTML(gap)  [for each gap]
  |               |     +--> getTrainDone(key)  [reads localStorage]
  |               |     +--> escapeHtml()  [sanitizes display values]
  |               +--> writes to #training-gap-list innerHTML
  |               +--> shows/hides #training-all-clear
  |               +--> wires .gap-done-check change events
  |                     +--> setTrainDone(key, checked)
  |                           +--> localStorage.setItem/removeItem
  |                           +--> renderGapCards(trainingGaps)  [refresh]
  |
  +--[existing]--> ring animation, XP bar, OPM course toggles  [UNCHANGED]
```

---

## Appendix B — localStorage Key Schema (Complete Sprint 8 State)

| Key | Value | Managed By | Sprint |
|---|---|---|---|
| `rif_train_done_seniority` | `'1'` or absent | `setTrainDone()` / `getTrainDone()` | 8 (new) |
| `rif_train_done_performance` | `'1'` or absent | `setTrainDone()` / `getTrainDone()` | 8 (new) |
| `rif_train_done_awards` | `'1'` or absent | `setTrainDone()` / `getTrainDone()` | 8 (new) |
| `rif_train_done_tenure` | `'1'` or absent | `setTrainDone()` / `getTrainDone()` | 8 (new) |
| `rif_train_done_veterans` | `'1'` or absent | `setTrainDone()` / `getTrainDone()` | 8 (new) |
| `rif_train_0` | `'1'` or absent | `toggleCourse()` (existing) | 1-7 (unchanged) |
| `rif_train_1` | `'1'` or absent | `toggleCourse()` (existing) | 1-7 (unchanged) |
| `rif_train_2` | `'1'` or absent | `toggleCourse()` (existing) | 1-7 (unchanged) |
| `rif_train_3` | `'1'` or absent | `toggleCourse()` (existing) | 1-7 (unchanged) |

---

*End of Sprint 8 Architecture Specification*  
*Agent A2 — Solutions Architect*  
*Ready for Step 3: Project Coordinator Gate Review*
