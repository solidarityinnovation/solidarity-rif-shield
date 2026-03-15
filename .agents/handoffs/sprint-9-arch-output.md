# Sprint 9 Architecture Specification — Score History Chart
**Product**: AFGE RIF Shield  
**Sprint**: 9  
**Author**: Solutions Architect Agent (A2)  
**Date**: 2026-03-14  
**Status**: READY FOR COORDINATOR GATE 3  
**Handoff To**: Coordinator Agent (A0) then Developer Agent (A3)  
**Input**: sprint-9-pm-output.md  
**Baseline**: index.html 2,249 lines | sw.js cache rif-shield-v4  

---

## Section 1 — Codebase Audit

All five grep commands executed on live file. Line numbers are exact and verified from `index.html`.

### 1.1 Key Function Definitions

| Symbol | Line | Notes |
|--------|------|-------|
| `function renderDashboard()` | **888** | Opening brace on this line |
| Closing `}` of renderDashboard | **975** | 87-line body; last statement is weekChart render block in renderJournal follows after |
| `function totalScore(d)` | **809** | Single-line function; parameter name is `d` |
| `function defaultData()` | **697** | Returns object literal — NO `scoreHistory` field present |
| `function loadData()` | **704** | Uses `Object.assign({}, defaultData(), JSON.parse(stored))`; strips `_schema` and `_saved` |
| `function saveData(d)` | **724** | Stamps `_schema: 2` hardcoded at line **726** — must be bumped to 3 |
| `function migrateDataV2()` | **770** | Guard: `if (stored._schema >= 2) return` at line 775 |
| `stored._schema = 2` | **792** | v2 stamp inside migrateDataV2 |
| `function toggleCourse(cid)` | **1331** | Training completion/uncomplete handler |
| `function saveLog()` | **1475** | Journal entry save handler |
| `MODULE: STORAGE` comment header | **690** | `// ║  MODULE: STORAGE ...` |
| `let radarChart=null,weekChart=null` | **881** | Module-top chart instance declarations |
| `let curScreen` | **859** | Screen state variable |
| `migrateDataV2()` call site | **2237** | Inside DOMContentLoaded init block |
| File total line count | **2,249** | Sprint 9 baseline |

### 1.2 saveData() Call Sites — All Snapshot Hook Points

Exhaustive list of lines where score-mutating data is persisted to localStorage:

| Line | Function | Score Fields Mutated | Hook Required? |
|------|----------|---------------------|----------------|
| **1346** | `toggleCourse(cid)` | `data.veterans` incremented or decremented | YES |
| **1500** | `saveLog()` | `data[cat]` incremented, journal entry pushed | YES |

No other `saveData()` call sites mutate scoring fields. Report-screen calls at lines 2053 and 1441 are read-only `totalScore(data)` lookups — no hook needed.

### 1.3 totalScore() Call Sites

| Line | Context | Usage |
|------|---------|-------|
| **809** | Function definition | `function totalScore(d){return Math.min(d.seniority||0,30)+...}` |
| **890** | Inside `renderDashboard()` | `const score=totalScore(data)` — passes full data object |
| **1417** | Reports render | Read-only |
| **1441** | Reports render | Read-only |
| **1969** | Reports section | Read-only |
| **2053** | PDF export | Read-only |

**CONFIRMED**: `totalScore()` always receives the full data object. `captureScoreSnapshot()` must call `totalScore(data)` internally where `data = loadData()`.

### 1.4 radarChart Variable and Chart.js Usage

| Line | Content |
|------|---------|
| **881** | `let radarChart=null,weekChart=null;` — declaration |
| **970** | `const rctx=document.getElementById('radarChart');` |
| **972** | `if(radarChart){radarChart.data.datasets[0].data=radarData;radarChart.update();}` |
| **973** | `else{radarChart=new Chart(rctx,{type:'radar',...});}` |
| **1015** | `const wctx=document.getElementById('weekChart');` — in renderJournal, NOT renderDashboard |
| **1017** | `if(weekChart){...weekChart.update();}` |
| **1018** | `else{weekChart=new Chart(wctx,{type:'bar',...});}` |

**IMPORTANT**: `weekChart` lives inside `renderJournal()`, not `renderDashboard()`. The dashboard screen contains only `radarChart`. `historyChart` will also live inside `renderDashboard()`.

### 1.5 HTML Dashboard Card Insertion Point

| Line | Content |
|------|---------|
| **426** | `<div class="card">...<canvas id="radarChart"></canvas>...</div>` — Score Profile card (LAST line of radar card) |
| **427** | `<div class="insight-card" id="insight-card">...` — Insight card |

**New history chart card inserts as a NEW LINE between line 426 and line 427** — immediately after the closing `</div>` of the radar card, before `<div class="insight-card">`.

### 1.6 Schema Version State

| Line | Content |
|------|---------|
| **726** | `const versioned = Object.assign({}, d, {_schema: 2, _saved: new Date().toISOString()});` |
| **775** | `if (stored._schema && stored._schema >= 2) return;` — v2 migration guard |
| **792** | `stored._schema = 2;` |

Current schema: **v2**. Sprint 9 introduces **v3**.
`saveData()` line 726 must be updated: `_schema: 2` becomes `_schema: 3`.

### 1.7 loadData() Merge Behavior — Critical for scoreHistory

`loadData()` at line 708: `const parsed = Object.assign({}, defaultData(), JSON.parse(r));`

- Stored JSON values **overwrite** defaultData() values (right-to-left merge).
- For pre-v3 users whose stored JSON has NO `scoreHistory` key: `defaultData().scoreHistory = []` survives the merge — the field is present at runtime.
- HOWEVER: `loadData()` strips `_schema` (line 710: `delete parsed._schema`). Migration functions must read raw localStorage directly, not via `loadData()`.
- `migrateDataV3()` must read raw JSON, check `_schema`, add field if missing, bump schema, and call `localStorage.setItem()` directly — same pattern as `migrateDataV2()`.

---

## Section 2 — New Data Shape

### 2.1 Snapshot Object

Each entry in `data.scoreHistory` has exactly three fields:

- `date`: local calendar date, format `YYYY-MM-DD`. Must use local `new Date()` (not `.toISOString().slice(0,10)` which is UTC).
- `score`: integer 0-100, result of `totalScore(data)`. No floats.
- `timestamp`: full ISO 8601 string from `new Date().toISOString()`.

Example: `{ date: "2026-03-14", score: 67, timestamp: "2026-03-14T22:39:22.000Z" }`

Local date generation pattern: `const now=new Date(); const dateStr=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');`

### 2.2 defaultData() Modification — Line 697

Add `scoreHistory:[]` to the return object literal. All other fields unchanged.

Before: `{seniority:0,...,journal:[]}`
After: `{seniority:0,...,journal:[],scoreHistory:[]}`

### 2.3 saveData() Schema Stamp Modification — Line 726

Change `_schema: 2` to `_schema: 3`. This ensures all post-Sprint-9 saves write v3, preventing re-migration.

Before: `Object.assign({}, d, {_schema: 2, _saved: new Date().toISOString()})`
After: `Object.assign({}, d, {_schema: 3, _saved: new Date().toISOString()})`

### 2.4 data.scoreHistory Access Pattern

- Always access as `data.scoreHistory` — never `data.scores.scoreHistory`.
- Always guard defensively: `const history = data.scoreHistory || [];`
- `loadData()` merges `defaultData()` into stored JSON (Object.assign), so after defaultData() update, field is guaranteed present for all users.

---

## Section 3 — New Constants

Insert immediately after the `STORE_KEY` constant definition (find via `grep -n STORE_KEY index.html`). Three new `const` declarations:

| Constant | Value | Purpose |
|----------|-------|---------|
| `SCORE_HISTORY_MAX_SNAPSHOTS` | `90` | Rolling window cap enforced in `captureScoreSnapshot()` |
| `SCORE_HISTORY_CHART_DAYS` | `30` | Chart display window used in `buildHistoryChartData()` |
| `SCORE_HISTORY_KEY` | `'scoreHistory'` | Data field name constant |

---

## Section 4 — New State Variable

**Line 881** — current: `let radarChart=null,weekChart=null;`

Modified: `let radarChart=null,weekChart=null,historyChart=null;`

- `historyChart` is the Chart.js instance for the score history line chart.
- Follows identical null-initialized pattern as `radarChart` and `weekChart`.
- Must be destroyed via `historyChart.destroy()` before re-creating (prevents duplicate canvas error).
- Set to `null` after `.destroy()` call; set to Chart instance by `renderHistoryChart()`.

---

## Section 5 — Fix 1: Schema v3 Migration

### 5.1 migrateDataV3() Function Specification

**Name**: `migrateDataV3()`
**Module**: MODULE: STORAGE (same module as migrateDataV2)
**Placement in file**: Immediately after closing `}` of `migrateDataV2()` at line **796**, before the next comment block.

**Logic (sequential steps)**:

1. Read raw string: `const raw = localStorage.getItem(STORE_KEY);`
2. If `!raw`: return immediately — nothing to migrate.
3. Wrap remainder in try/catch; on catch: `console.warn('RIF Shield: migrateDataV3 failed', e); return;`
4. Parse: `const stored = JSON.parse(raw);`
5. **Guard (idempotency)**: `if (stored._schema && stored._schema >= 3) return;` — exit if already v3+.
6. Add field if missing: `if (!stored.scoreHistory) { stored.scoreHistory = []; }`
7. Bump schema: `stored._schema = 3;`
8. Update save timestamp: `stored._saved = new Date().toISOString();`
9. Persist: `localStorage.setItem(STORE_KEY, JSON.stringify(stored));`

**JSDoc required**: `@description Migrates localStorage data from schema v2 to v3. Idempotent.`
**No console.log()** — use `console.warn()` only in error path.

### 5.2 Migration Call Chain — Line 2237

**Current (line 2237)**:
```
  // Sprint 6: Data migration MUST run before any loadData() call
  migrateDataV2();
```

**Modified**:
```
  // Sprint 6: Data migration MUST run before any loadData() call
  migrateDataV2();
  // Sprint 9: Schema v3 migration — adds scoreHistory field
  migrateDataV3();
```

`migrateDataV3()` call inserts as a new line **after line 2237** (current `migrateDataV2()` line). Existing comment above `migrateDataV2()` is not modified.

### 5.3 defaultData() Change

See Section 2.2. Add `scoreHistory:[]` at line **697**.

---

## Section 6 — Feature A: Snapshot Capture

### 6.1 captureScoreSnapshot() Function Specification

**Name**: `captureScoreSnapshot()`
**Module**: MODULE: SCORE HISTORY (see Section 14)
**Parameters**: none
**Returns**: void
**JSDoc**: `@description Records a timestamped score snapshot. Deduplicates same-day entries. Enforces 90-entry cap. Persists via saveData().`

**Logic (sequential steps)**:

1. `const data = loadData();` — load current persisted data.
2. Generate local date: `const now=new Date(); const dateStr=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');`
3. `const score = totalScore(data);` — compute integer score 0-100.
4. `const ts = new Date().toISOString();` — ISO timestamp.
5. `if (!data.scoreHistory) { data.scoreHistory = []; }` — defensive init.
6. Deduplication: `const last = data.scoreHistory[data.scoreHistory.length - 1];`
   - If `last && last.date === dateStr`: update in place — `last.score = score; last.timestamp = ts;` — do NOT push.
   - Else (new day): `data.scoreHistory.push({ date: dateStr, score: score, timestamp: ts });`
7. Cap: `if (data.scoreHistory.length > SCORE_HISTORY_MAX_SNAPSHOTS) { data.scoreHistory = data.scoreHistory.slice(data.scoreHistory.length - SCORE_HISTORY_MAX_SNAPSHOTS); }`
8. `saveData(data);` — persist.
9. NO `renderDashboard()` call inside this function. Caller handles all rendering.

### 6.2 Hook Point 1 — toggleCourse() Training Completion

**Location**: Line **1346** (`saveData(data)`) and line **1348** (`renderDashboard()`)

**Current sequence (lines 1345-1348)**:
```
  saveCourses(done);     // line 1345
  saveData(data);        // line 1346
  renderTraining();      // line 1347
  renderDashboard();     // line 1348
```

**Required sequence after Sprint 9**:
```
  saveCourses(done);         // line 1345 — unchanged
  saveData(data);            // line 1346 — unchanged
  captureScoreSnapshot();    // NEW LINE inserted here (becomes new 1347)
  renderTraining();          // shifts to 1348
  renderDashboard();         // shifts to 1349
```

**Rule**: `captureScoreSnapshot()` goes AFTER `saveData(data)` (so `loadData()` inside it reads fresh data) and BEFORE `renderDashboard()` (so chart updates on same render).

### 6.3 Hook Point 2 — saveLog() Journal Save

**Location**: Line **1500** (`saveData(data)`) and line **1505** (`renderDashboard()`)

**Current sequence (lines 1500-1506)**:
```
  saveData(data);                // line 1500
  if(taskEl)  taskEl.value='';  // line 1501
  if(notesEl) notesEl.value=''; // line 1502
  resetHoursStepper();           // line 1503
  closeLogModal();               // line 1504
  renderDashboard();             // line 1505
  showToast('...');              // line 1506
```

**Required sequence after Sprint 9**:
```
  saveData(data);                // line 1500 — unchanged
  captureScoreSnapshot();        // NEW LINE inserted here (becomes 1501)
  if(taskEl)  taskEl.value='';  // shifts to 1502
  if(notesEl) notesEl.value=''; // shifts to 1503
  resetHoursStepper();           // shifts to 1504
  closeLogModal();               // shifts to 1505
  renderDashboard();             // shifts to 1506
  showToast('...');              // shifts to 1507
```

**Rule**: `captureScoreSnapshot()` inserted immediately after `saveData(data)` at line 1500, before any field cleanup or rendering.

---

## Section 7 — Feature B: Line Chart

### 7.1 buildHistoryChartData() Function Specification

**Name**: `buildHistoryChartData()`  
**Module**: MODULE: SCORE HISTORY  
**Parameters**: none  
**Returns**: Chart.js data object  

**Logic (sequential steps)**:

1. `const data = loadData();`
2. `const history = data.scoreHistory || [];`
3. Take last 30: `const slice = history.slice(-SCORE_HISTORY_CHART_DAYS);`
4. Build labels: parse each `entry.date + "T12:00:00"` as local noon (avoids DST shift). Format with `toLocaleDateString("en-US", {month:"short", day:"numeric"})` — produces `"Mar 1"`, `"Mar 14"`.
5. Build scores: `const scores = slice.map(e => e.score);`
6. Return object with `labels` array and `datasets` array containing single dataset:
   - `borderColor`: `"#c9a227"`
   - `backgroundColor`: `"rgba(15,28,63,0.08)"`
   - `fill: true`
   - `tension: 0.3`
   - `pointRadius: 4`
   - `pointBackgroundColor`: `"#c9a227"`
   - `pointBorderColor`: `"#c9a227"`

### 7.2 renderHistoryChart() Function Specification

**Name**: `renderHistoryChart()`  
**Module**: MODULE: SCORE HISTORY  
**Parameters**: none  
**Returns**: void  

**Logic (sequential steps)**:

1. `const data = loadData();`
2. `const history = data.scoreHistory || [];`
3. Get DOM refs: `document.getElementById("history-chart-canvas")` and `document.getElementById("history-empty-state")`. Return silently if either is null.
4. `const ctx = canvas.getContext("2d");`
5. Branch on `history.length < 2` (EMPTY STATE):
   - `canvas.style.display = "none";`
   - `emptyState.style.display = "flex";`
   - If `historyChart !== null`: `historyChart.destroy(); historyChart = null;`
   - Return.
6. Branch on `history.length >= 2` (CHART PATH):
   - `canvas.style.display = "block";`
   - `emptyState.style.display = "none";`
   - CRITICAL: if `historyChart !== null` destroy first: `historyChart.destroy(); historyChart = null;`
   - Create: `historyChart = new Chart(ctx, { type: "line", data: buildHistoryChartData(), options: <below> });`

**Chart options**:
- `responsive: true`
- `plugins.legend.display: false`
- `animation.duration: 600`
- y-axis: `min:0, max:100, ticks.stepSize:25, ticks.font.size:9, grid.color:"rgba(15,28,63,.08)"`
- x-axis: `ticks.maxRotation:45, ticks.minRotation:0, ticks.font.size:9, grid.display:false`

### 7.3 HTML Card Structure

**Insertion location**: New HTML block inserted between line **426** (radar card closing `</div>`) and line **427** (`<div class="insight-card"`).

Structure of the new card:
- Outer: `<div class="card" id="history-chart-card">`
- Header: `<div class="card-hdr"><span class="card-ttl">Score History</span></div>`
- Trend row: `<div id="trend-indicators" class="trend-row">` (see Section 8.3 for inner chip HTML)
- Canvas wrapper: `<div class="history-canvas-wrapper"><canvas id="history-chart-canvas" aria-label="Protection score history over the last 30 days"></canvas></div>`
- Empty state: `<div id="history-empty-state" class="history-empty-state" style="display:none">Keep logging activity to build your score history</div>`
- Close: `</div>`

---

## Section 8 — Feature C: Trend Indicators

### 8.1 computeTrendIndicators() Function Specification

**Name**: `computeTrendIndicators()`  
**Module**: MODULE: SCORE HISTORY  
**Parameters**: none  
**Returns**: object with shape { current, delta7, delta30 }  

**Logic (sequential steps)**:

1. `const data = loadData();`
2. `const history = data.scoreHistory || [];`
3. `const current = totalScore(data);`
4. Generate today YYYY-MM-DD string using local date (same pattern as captureScoreSnapshot).
5. Compute t7str: subtract 7 days. `const t7 = new Date(); t7.setDate(t7.getDate() - 7);` then format YYYY-MM-DD.
6. Compute t30str: subtract 30 days. Same YYYY-MM-DD format.
7. Find score7dAgo: iterate history in REVERSE. First entry where `entry.date <= t7str`. Set `score7dAgo = entry.score` or `null` if none found.
8. Find score30dAgo: same logic with t30str. Set `score30dAgo` or `null`.
9. `const delta7 = (score7dAgo !== null) ? current - score7dAgo : null;`
10. `const delta30 = (score30dAgo !== null) ? current - score30dAgo : null;`
11. Return object: `{ current, delta7, delta30 }`

**Edge cases**: empty history returns both deltas null. All entries newer than 7d returns delta7 null. YYYY-MM-DD string comparison is lexicographically correct.

### 8.2 renderTrendIndicators(trend) Function Specification

**Name**: `renderTrendIndicators(trend)`  
**Module**: MODULE: SCORE HISTORY  
**Parameters**: `trend` from `computeTrendIndicators()`  
**Returns**: void  

**Logic**:
1. Get refs: `document.getElementById("trend-current")`, `"trend-7d"`, `"trend-30d"`. Return silently if any null.
2. `currentEl.textContent = trend.current;`
3. Delta format rules per chip (applied to both trend-7d and trend-30d):
   - delta === null: textContent = "—", className = "trend-chip-value trend-neutral"
   - delta === 0: textContent = "— 0", className = "trend-chip-value trend-neutral"
   - delta > 0: textContent = "▲ +" + delta, className = "trend-chip-value trend-up"
   - delta < 0: textContent = "▼ " + delta, className = "trend-chip-value trend-down" (delta already negative, no extra minus)
4. Use `textContent` only, never `innerHTML`.
5. Set `el.className` directly each call to fully reset CSS state.

### 8.3 Trend Indicators HTML

Lives INSIDE `#history-chart-card`, ABOVE the canvas wrapper:

- `<div id="trend-indicators" class="trend-row">`
  - Chip 1: `<div class="trend-chip"><div id="trend-current" class="trend-chip-value">—</div><div class="trend-chip-label">Current Score</div></div>`
  - Chip 2: `<div class="trend-chip"><div id="trend-7d" class="trend-chip-value trend-neutral">—</div><div class="trend-chip-label">7-Day Change</div></div>`
  - Chip 3: `<div class="trend-chip"><div id="trend-30d" class="trend-chip-value trend-neutral">—</div><div class="trend-chip-label">30-Day Change</div></div>`
- `</div>`

---

## Section 9 — Feature D: Empty State

**Element ID**: `history-empty-state`  
**CSS class**: `history-empty-state`  
**Location**: Inside `#history-chart-card`, after `.history-canvas-wrapper`, before closing `</div>`.  
**Message**: Keep logging activity to build your score history  
**Initial HTML attribute**: `style="display:none"` (hidden by default)  

**Visibility logic** (controlled by `renderHistoryChart()` only):
- `history.length < 2`: set `display:flex` (show empty state)
- `history.length >= 2`: set `display:none` (hide empty state)

**CSS** (see Section 11 `.history-empty-state`):
- `display:flex; flex-direction:column; align-items:center; justify-content:center`
- `min-height:120px; color:var(--muted,#6b7280); font-size:.875rem; text-align:center; padding:1rem`

---

## Section 10 — Modify renderDashboard()

**Rule**: Additions only. NO existing code modified or reordered.  

**Current last lines of renderDashboard() (lines 970-975)**:
- Line 970: radar canvas lookup
- Line 972-973: radarChart update/create branch
- Line 975: closing `}` of renderDashboard

**Required additions — insert BEFORE line 975 (before closing brace)**:

1. Call `renderHistoryChart();` — renders/updates score history line chart
2. Call `renderTrendIndicators(computeTrendIndicators());` — updates 3 trend chips

**Modified renderDashboard() tail (lines 970-977 post-sprint)**:
- Line 970: radar canvas lookup (unchanged)
- Lines 972-973: radarChart branch (unchanged)
- Line 974: `renderHistoryChart();` (NEW)
- Line 975: `renderTrendIndicators(computeTrendIndicators());` (NEW)
- Line 976: closing `}` of renderDashboard (was 975, shifts by 1)

**No other changes to renderDashboard().** Both new calls go after radarChart block, before the function closing brace.

---

## Section 11 — New CSS Classes (minimum 10)

All classes added to the existing `<style>` block in `index.html`. Group under comment `/* MODULE: SCORE HISTORY */`.

| Class | Properties |
|-------|-----------|
| `.history-chart-card` | No additional styles needed — inherits from `.card` base class. Alias for specificity overrides if needed. |
| `.trend-row` | `display:flex; justify-content:space-around; gap:.75rem; padding:.75rem 0 .5rem; flex-wrap:wrap;` |
| `.trend-chip` | `display:flex; flex-direction:column; align-items:center; background:var(--bg,#f8fafc); border-radius:.5rem; padding:.5rem .75rem; min-width:5rem; flex:1;` |
| `.trend-chip-value` | `font-size:1.25rem; font-weight:700; line-height:1.2; color:var(--navy,#0f1c3f);` |
| `.trend-chip-label` | `font-size:.625rem; text-transform:uppercase; letter-spacing:.05em; color:var(--muted,#6b7280); margin-top:.2rem; text-align:center;` |
| `.trend-up` | `color:#16a34a !important;` |
| `.trend-down` | `color:#dc2626 !important;` |
| `.trend-neutral` | `color:var(--muted,#6b7280) !important;` |
| `.history-empty-state` | `display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:120px; color:var(--muted,#6b7280); font-size:.875rem; text-align:center; padding:1rem;` |
| `.history-canvas-wrapper` | `padding:.5rem 0; position:relative;` |

---

## Section 12 — New HTML Elements (all IDs)

| ID | Tag | Parent | Purpose |
|----|-----|--------|---------|
| `history-chart-card` | `<div class="card">` | `.dashboard` screen | Outer card container for score history feature |
| `trend-indicators` | `<div class="trend-row">` | `#history-chart-card` | Flex row holding 3 trend chips |
| `trend-current` | `<div class="trend-chip-value">` | first `.trend-chip` | Current score display |
| `trend-7d` | `<div class="trend-chip-value">` | second `.trend-chip` | 7-day delta display |
| `trend-30d` | `<div class="trend-chip-value">` | third `.trend-chip` | 30-day delta display |
| `history-chart-canvas` | `<canvas>` | `.history-canvas-wrapper` | Chart.js render target for line chart |
| `history-empty-state` | `<div class="history-empty-state">` | `#history-chart-card` | Empty state shown when < 2 snapshots |

**Total new IDs**: 7  
**Total new named elements (including unlabeled .trend-chip divs)**: 10  

---

## Section 13 — New Functions Summary

| Function | Module | Purpose |
|----------|--------|---------|
| `migrateDataV3()` | STORAGE | Schema v2 to v3; adds scoreHistory; idempotent |
| `captureScoreSnapshot()` | SCORE HISTORY | Timestamped snapshot; dedup; 90-cap; saveData |
| `buildHistoryChartData()` | SCORE HISTORY | Chart.js data object from last 30 entries |
| `renderHistoryChart()` | SCORE HISTORY | Line chart render; empty state; destroy guard |
| `computeTrendIndicators()` | SCORE HISTORY | Current score + 7d and 30d deltas |
| `renderTrendIndicators(trend)` | SCORE HISTORY | Update 3 trend chip DOM elements |

**Total new functions**: 6  
**Modified functions**: `defaultData` (line 697), `saveData` (line 726), `renderDashboard` (line 888)  
**New call sites added**: `migrateDataV3` at line 2238, `captureScoreSnapshot` at lines 1347 and 1501  

---

## Section 14 — New Module Header

New module block inserted in JavaScript, immediately before the first new function `migrateDataV3()`.

The MODULE: SCORE HISTORY comment block follows the established pattern of existing module headers in the file.

Placement: After closing `}` of `migrateDataV2()` (line 796). Before `migrateDataV3()` definition.

Module header comment (match existing style exactly):
```
// =============================================
// ║  MODULE: SCORE HISTORY                   ║
// ║  captureScoreSnapshot                    ║
// ║  buildHistoryChartData                   ║
// ║  renderHistoryChart                      ║
// ║  computeTrendIndicators                  ║
// ║  renderTrendIndicators                   ║
// =============================================
```

Note: `migrateDataV3()` lives in MODULE: STORAGE (alongside `migrateDataV2()`), NOT in MODULE: SCORE HISTORY.

---

## Section 15 — Implementation Order

Ordered lowest-risk first. Each step is atomic and independently testable.

**Step 1 — Add constants (no functional change)**
- Find STORE_KEY constant definition in index.html
- Add 3 new const declarations immediately after it
- `const SCORE_HISTORY_MAX_SNAPSHOTS = 90;`
- `const SCORE_HISTORY_CHART_DAYS = 30;`
- `const SCORE_HISTORY_KEY = "scoreHistory";`
- Risk: none. Pure additions.

**Step 2 — Add historyChart state variable (no functional change)**
- Line 881: change `let radarChart=null,weekChart=null;`
- To: `let radarChart=null,weekChart=null,historyChart=null;`
- Risk: none. Adds null variable only.

**Step 3 — Update defaultData() (line 697)**
- Add `scoreHistory:[]` to returned object literal
- Risk: minimal. New users get empty array. Existing users: loadData() Object.assign merges defaultData first, stored JSON overwrites — scoreHistory:[] from defaultData survives only if stored has no scoreHistory key. Migration in Step 4 handles stored data.

**Step 4 — Implement migrateDataV3() and add to call chain**
- Add function after line 796 (after migrateDataV2 closing brace)
- Add module header comment for MODULE: SCORE HISTORY at same location
- Add `migrateDataV3();` call at line 2238 (after migrateDataV2() call at line 2237)
- Update saveData() line 726: `_schema: 2` to `_schema: 3`
- Test: open app, check localStorage shows _schema:3
- Risk: low. Idempotent guard prevents re-run.

**Step 5 — Implement captureScoreSnapshot() (no UI yet)**
- Add function to MODULE: SCORE HISTORY block
- Does NOT call renderDashboard — safe to add before UI exists
- Risk: low. No UI impact until hook points wired.

**Step 6 — Wire hook points**
- Line 1346: insert `captureScoreSnapshot();` after `saveData(data);` in toggleCourse
- Line 1500: insert `captureScoreSnapshot();` after `saveData(data);` in saveLog
- Test: complete a course or log entry, check localStorage scoreHistory array gains an entry
- Risk: medium. If captureScoreSnapshot has bug, saveData already called so data is safe. scoreHistory mutation failure is non-blocking.

**Step 7 — Add CSS classes**
- Add comment `/* MODULE: SCORE HISTORY */` in style block
- Add all 10 CSS classes from Section 11
- Risk: none. Additive only.

**Step 8 — Add HTML card (between lines 426 and 427)**
- Insert `#history-chart-card` block after line 426, before line 427
- Include: card-hdr, trend-indicators row, history-canvas-wrapper, history-empty-state
- canvas and empty-state both start hidden: `style="display:none"`
- Risk: medium. Malformed HTML breaks layout. Validate in DevTools.

**Step 9 — Implement SCORE HISTORY render functions**
- Implement in order inside MODULE: SCORE HISTORY block:
  1. `buildHistoryChartData()`
  2. `renderHistoryChart()`
  3. `computeTrendIndicators()`
  4. `renderTrendIndicators(trend)`
- Each function testable independently via browser console
- Risk: medium. Chart.js duplicate canvas bug if destroy guard missing.

**Step 10 — Wire renderDashboard() (final step)**
- Add `renderHistoryChart();` before line 975 (closing brace of renderDashboard)
- Add `renderTrendIndicators(computeTrendIndicators());` on next line
- Test: navigate to dashboard screen, verify chart and trend chips render
- Test empty state: clear scoreHistory in DevTools, reload, verify empty state shown
- Risk: low if Steps 7-9 complete. Chart renders only when all pieces in place.

**Summary of line changes post-implementation**:

| Change | Original Line | Action |
|--------|--------------|--------|
| STORE_KEY area | TBD via grep | Add 3 constants after |
| historyChart var | 881 | Append to declaration |
| defaultData | 697 | Add scoreHistory:[] |
| saveData schema | 726 | Change 2 to 3 |
| migrateDataV3 | after 796 | New function |
| MODULE header | after 796 | New comment block |
| captureScoreSnapshot | after migrateDataV3 | New function |
| HTML card | between 426-427 | New block |
| CSS classes | in style block | New rules |
| SCORE HISTORY fns | in new module | 4 new functions |
| migrateDataV3 call | after 2237 | New call |
| Hook 1 | after 1346 | captureScoreSnapshot() |
| Hook 2 | after 1500 | captureScoreSnapshot() |
| renderDashboard tail | before 975 | 2 new calls |

---

## Section 16 — Files to Modify

| File | Changes |
|------|---------|
| `index.html` | PRIMARY target. All changes in this file only. |
| `sw.js` | NO changes required for Sprint 9. |

**index.html change summary**:
- CSS: add 10 new classes in style block
- HTML: add history-chart-card between lines 426-427
- JS constants: add 3 near STORE_KEY
- JS state: add historyChart=null at line 881
- JS defaultData: add scoreHistory:[] at line 697
- JS saveData: change _schema:2 to _schema:3 at line 726
- JS migrateDataV3: new function after line 796
- JS captureScoreSnapshot: new function in SCORE HISTORY module
- JS buildHistoryChartData: new function in SCORE HISTORY module
- JS renderHistoryChart: new function in SCORE HISTORY module
- JS computeTrendIndicators: new function in SCORE HISTORY module
- JS renderTrendIndicators: new function in SCORE HISTORY module
- JS hook 1: captureScoreSnapshot() after line 1346
- JS hook 2: captureScoreSnapshot() after line 1500
- JS migrateDataV3 call: new line after 2237
- JS renderDashboard tail: 2 new calls before line 975

**Net line count estimate**: +90 to +120 lines (~2,339 to 2,369 total)

---

## Section 17 — Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Chart.js duplicate canvas error | HIGH | Destroy historyChart before recreating. |
| totalScore() wrong argument | HIGH | Always pass full data object. |
| UTC vs local date mismatch | MEDIUM | Use local new Date() not toISOString().slice(0,10). |
| scoreHistory missing on old data | LOW | migrateDataV3() + defaultData() scoreHistory:[] guard. |
| Missed saveData hook point | MEDIUM | Audit confirmed exactly 2 score-mutating saveData calls. |
| historyChart naming conflict | LOW | radarChart/weekChart/historyChart are distinct variables. |
| 90-cap slices wrong end | MEDIUM | slice(length - MAX) keeps NEWEST entries (tail, not head). |
| renderDashboard called before DOM ready | LOW | getElementById null guard in renderHistoryChart. |
| _schema not bumped in saveData | MEDIUM | Line 726 must change _schema:2 to _schema:3. |
| loadData strips _schema before migration | HIGH | migrateDataV3 reads raw localStorage directly, not via loadData(). |

---

## Section 18 — Verification Checklist for Dev Agent

Before declaring Sprint 9 complete, verify each item:

- [ ] `localStorage.getItem("rif-shield")` shows `_schema:3` after any save
- [ ] `scoreHistory` array present in localStorage after first captureScoreSnapshot call
- [ ] Same-day dedup: two saves on same day produces 1 entry, not 2
- [ ] 90-cap: array never exceeds 90 entries
- [ ] History chart card visible in dashboard screen
- [ ] Line chart renders when 2+ snapshots exist
- [ ] Empty state shown when 0 or 1 snapshots exist
- [ ] trend-current shows correct live score
- [ ] trend-7d shows delta or em-dash if no data
- [ ] trend-30d shows delta or em-dash if no data
- [ ] No console errors on dashboard render
- [ ] No Chart.js duplicate canvas error on repeated renderDashboard calls
- [ ] Existing radarChart and weekChart unaffected
- [ ] All 6 new functions have JSDoc comments
- [ ] migrateDataV3 is idempotent (safe to call twice)

---

## Delivery Confirmation

**File**: `/a0/usr/projects/afge_rif_shield_demo/.agents/handoffs/sprint-9-arch-output.md`  
**Sections**: 18 (Sections 1-17 + Verification Checklist)  
**Baseline inspected**: `index.html` 2,249 lines  
**All grep commands executed**: confirmed  
**Line references**: exact, from live file  
**Zero code written**: specification only  
**Status**: READY FOR COORDINATOR GATE 3  
