# Sprint 9 — Dev Handoff Document
**Agent**: A3 Development Agent  
**Date**: 2026-03-15  
**Status**: ✅ COMPLETE — Ready for QA Gate (Step 5)

---

## Summary
Implemented Score History tracking feature: localStorage-persisted snapshots, Chart.js line chart visualization, trend badges, and schema v2→v3 migration. All 4 Coordinator directives applied.

---

## Coordinator Directives — Compliance Record

| # | Directive | Implementation | Status |
|---|-----------|---------------|--------|
| D1 | `saveData()` stamps `_schema: 3` | Line updated in saveData(): `{_schema: 3, ...}` | ✅ |
| D2 | `captureScoreSnapshot()` calls `totalScore(data)` | `var score = totalScore(data);` — full data obj passed | ✅ |
| D3 | Local date not `.toISOString().slice(0,10)` | `d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')` | ✅ |
| D4 | Chart destruction guard before every `new Chart()` | `if (historyChart){historyChart.destroy();historyChart=null;}` before both Chart() calls | ✅ |

---

## Implementation Steps Completed

### S1 — Constants (2 new)
```javascript
const SCORE_HISTORY_MAX_SNAPSHOTS = 90;  // rolling window
const SCORE_HISTORY_CHART_DAYS    = 30;  // chart display window
```

### S2 — State Variable
```javascript
let historyChart = null;  // Chart.js instance reference
```

### S3 — defaultData Extension
```javascript
scoreHistory: []  // added to defaultData object
```

### S4 — saveData() Schema Bump (D1)
- `_schema` stamp updated from `2` → `3`

### S5 — migrateDataV3() Function
- Idempotent guard: `if (stored._schema >= 3) return;`
- Ensures `scoreHistory: []` exists on older data objects
- Reads raw localStorage directly (bypasses loadData which strips _schema)
- try/catch with console.warn on failure

### S6 — migrateDataV3() Call in init()
- Called at app startup after migrateDataV2()

### S7 — CSS (11 classes)
`.hist-section`, `.hist-hdr`, `.hist-title`, `.trend-row`, `.trend-badge`, `.trend-badge.up`, `.trend-badge.down`, `.trend-badge.flat`, `.hist-canvas-wrap`, `.hist-empty`

### S8 — HTML Card
Inserted before `<div class="screen" id="s-journal">` (end of dashboard section):
- `#score-history-card` — outer card container  
- `#hist-last-snap` — last snapshot label  
- `#trend-row` — trend badge container  
- `#hist-canvas-wrap` — chart canvas wrapper  
- `#history-chart` — Chart.js canvas target  

### S9 — JS Module (6 functions) inserted before MODULE: REPORTS

| Function | Purpose |
|----------|---------|
| `getStoredScoreHistory()` | Reads scoreHistory from raw localStorage |
| `saveStoredScoreHistory(history)` | Persists history, stamps _schema:3 |
| `captureScoreSnapshot(data)` | Same-day dedup, 90-entry window, triggers render |
| `buildHistoryChartData()` | Trims to 30-day window, formats labels/scores |
| `renderHistoryChart()` | D4 guard, Chart.js line chart, updates last-snap label |
| `computeTrendIndicators()` | 7-day and 30-day delta computation |
| `renderTrendIndicators()` | Renders trend badges into #trend-row |

### S10 — Hook in toggleCourse()
```javascript
saveData(data);
captureScoreSnapshot(data); // Sprint 9
renderTraining();
```

### S11 — Hook in saveLog()
```javascript
saveData(data);
captureScoreSnapshot(data); // Sprint 9
if(taskEl)  taskEl.value
```

---

## File Changes

| File | Change | Lines Before | Lines After |
|------|--------|-------------|-------------|
| `index.html` | Sprint 9 score history feature | 2,274 | 2,398 |
| `sw.js` | No change this sprint | — | — |

**index.html**: 2,398 lines · 131,416 bytes (128 KB)

---

## Verification Suite — All 21 Checks PASSED

```
✓ D1: _schema=3
✓ S2: constants (SCORE_HISTORY_MAX_SNAPSHOTS)
✓ S3: state var (historyChart=null)
✓ S4: defaultData (scoreHistory:[])
✓ S5: fn defined (migrateDataV3)
✓ S6: fn called (migrateDataV3())
✓ S7: CSS (.hist-section)
✓ S8: HTML card (score-history-card)
✓ S8: canvas wrap (hist-canvas-wrap)
✓ S8: trend row (trend-row)
✓ S9: getStoredScoreHistory
✓ S9: saveStoredScoreHistory
✓ S9: captureScoreSnapshot
✓ S9: buildHistoryChartData
✓ S9: renderHistoryChart
✓ S9: computeTrendIndicators
✓ S9: renderTrendIndicators
✓ S10+S11: hooks present
✓ D3: local date not UTC
✓ D4: chart destroy guard
✓ D2: totalScore full obj
```

---

## Regression Risk Assessment

| Area | Risk | Mitigation |
|------|------|------------|
| migrateDataV3 | Low — idempotent guard prevents double-migration | `_schema >= 3` early return |
| captureScoreSnapshot hooks | Low — try/catch isolates failures | App continues if snapshot fails |
| Chart.js canvas | Low — destroy guard prevents duplicate instance errors | D4 directive applied |
| Schema bump to v3 | Low — all existing v2 data migrates cleanly | scoreHistory:[] default added |
| toggleCourse/saveLog | Low — hooks added after saveData, before existing logic | Non-breaking insertion |

---

## Ready for QA Gate
Handing off to **A4 QA Agent** for Sprint 9 validation.

Suggested QA focus areas:
1. Score history persists across page reload
2. Same-day deduplication (capture twice same day → only one entry, latest score)
3. Rolling window enforcement (>90 entries → oldest dropped)
4. Chart empty state (<2 entries → "Score history appears after 2+ saves")
5. Chart renders correctly with 2+ entries (Chart.js line chart visible)
6. Trend badges display correct ▲/▼/▶ with correct color classes
7. D3: Local date matches user timezone (not UTC)
8. D4: No duplicate Chart.js canvas errors on repeated saves
9. migrateDataV3 idempotent on repeated loads
10. Schema v3 stamp present in localStorage after any save
