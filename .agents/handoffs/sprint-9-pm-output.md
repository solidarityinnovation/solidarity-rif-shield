# Sprint 9 PM Specification — Score History Chart
**Product**: AFGE RIF Shield  
**Sprint**: 9  
**Author**: Product Manager Agent (A1)  
**Date**: 2026-03-14  
**Status**: READY FOR ARCHITECT REVIEW  
**Handoff To**: Solutions Architect Agent (A2)  

---

## Pre-Sprint Codebase Inspection Summary

Command run: `grep -n 'dashboard\|Dashboard\|score\|Score\|history\|History\|chart\|Chart\|snapshot\|trend\|renderDash' index.html | head -80`

| Line | Finding | Sprint 9 Relevance |
|------|---------|-------------------|
| 17 | Chart.js 4.4.0 loaded via CDN with SRI hash, `defer` attribute | No new CDN dependency needed |
| 409 | Dashboard screen `id="s-dashboard"` | New history card injected inside this screen |
| 426 | Radar chart `id="radarChart"`, card title "Score Profile" | New history card placed BELOW this card |
| 440 | Weekly Activity `id="weekChart"` height=160 | Existing chart pattern to mirror for history chart |
| 881 | `let radarChart=null, weekChart=null;` declared at module top | New `historyChart=null` follows this pattern |
| 888 | `function renderDashboard()` — main dashboard render entry point | Snapshot hook + history render called from here |
| 809 | `function totalScore(d)` — computes total 0–100 | Used by snapshot capture to read current score |
| 1348 | `renderDashboard()` called after training completion | Snapshot capture hook required here |
| 1505 | `renderDashboard()` called after manual score update | Snapshot capture hook required here |
| 487 | `id="stat-total-score"` — total score chip | Current Score trend stat references this value |
| 973 | Radar chart uses gold `#c9a227`, navy fill `rgba(201,162,39,.15)` | History chart uses identical color conventions |

**Gap confirmed:** No `scoreHistory` field, no snapshot logic, no trend indicators, no history chart exist anywhere in index.html. Sprint 9 introduces all of this from scratch on top of existing Chart.js and data infrastructure.

---

## 1. Sprint Feature Summary

### Feature A — Score Snapshot System

Today, when a federal employee improves their protection score — by logging a journal entry, completing a training course, or manually updating a category score — that improvement is reflected instantly on the dashboard ring and vitals panel. However, there is no memory of what the score was yesterday, last week, or last month. Once a number changes, the previous value is gone forever.

Feature A introduces a lightweight snapshot system that silently records the employee's total score each time it changes. Each snapshot is a small data record containing the calendar date, the score value, and a precise ISO timestamp. These snapshots are stored in a new `scoreHistory` array on the existing `data` object in localStorage. The system prevents duplicates: if the user updates their score multiple times on the same calendar day, only the most recent score for that day is retained. To prevent unbounded localStorage growth, the system keeps a maximum of 90 snapshots, automatically dropping the oldest entry when a new one would exceed that cap. Employees whose data predates this feature start with an empty history array and build it naturally from their next score-changing action.

### Feature B — 30-Day History Line Chart

Feature B makes the snapshot history visible to the employee as a line chart on their dashboard. The chart appears in a new card positioned directly below the existing "Score Profile" radar chart. It plots the employee's protection score over the last 30 calendar days — dates on the horizontal axis (formatted as "Mon D", e.g. "Mar 1") and score values 0–100 on the vertical axis. Days without a snapshot are simply absent from the line; the chart handles sparse data gracefully without interpolating missing days. The line and data points use the app's primary gold color (`#c9a227`). A subtle semi-transparent navy fill beneath the line adds visual depth. The chart is fully responsive and fits within the card width on both mobile and desktop. Chart.js — already loaded at line 17 — renders the chart with no new CDN dependencies introduced.

### Feature C — Trend Indicators

Feature C adds three summary statistics displayed inside the history chart card, above the chart canvas itself. These give the employee an immediate sense of whether their protection posture is improving, declining, or stable:

- **Current Score**: The employee's latest total score, shown as a context anchor for interpreting the chart.
- **7-Day Change**: Score delta compared to the most recent snapshot that is at least 7 calendar days old. Displayed as `▲ +5` in green if improved, `▼ −2` in red if declined, or `—` in muted gray if no qualifying comparison snapshot exists.
- **30-Day Change**: Same calculation but comparing against the most recent snapshot at least 30 calendar days old.

These three indicators update automatically every time the dashboard re-renders. They are computed on-the-fly from the snapshot array and require no additional storage.

### Feature D — Empty State

Feature D handles the period before enough data exists to draw a meaningful chart. When an employee has fewer than two snapshots recorded (including zero), the chart canvas is hidden and replaced with a friendly message: *"Keep logging activity to build your score history."* This message disappears automatically — without any user action — the moment two or more snapshots have been recorded. The 7-Day Change and 30-Day Change trend indicators display `—` until sufficient comparison data exists. This ensures the history card always presents a coherent, non-confusing experience regardless of how new the user is to the app.

### Fix 1 — Schema v3 Migration

The application currently uses data schema version 2. Adding the `scoreHistory` array requires formalizing schema version 3. This fix adds `scoreHistory: []` to `defaultData()` so all new user records include the field from creation. It also adds a `migrateDataV3()` function that runs after the existing `migrateDataV2()` call during app initialization. The migration checks whether the loaded data object is missing `scoreHistory`; if so, it adds the field as an empty array and bumps the schema version to 3. If the data is already at schema version 3 or higher, the function returns immediately without modification, ensuring full backward compatibility for all existing users.

### Fix 2 — Snapshot Capture Hook

The snapshot system only provides value if `captureScoreSnapshot()` is called whenever the score actually changes. Fix 2 identifies all locations in the codebase where a score change concludes and wires in a call to the new snapshot function at each one. Based on the codebase inspection, the confirmed hook points are: (1) after training course completion where `renderDashboard()` is called around line 1348, and (2) after manual category score update where `renderDashboard()` is called around line 1505. The hook is placed after data is persisted to localStorage but before the dashboard re-renders, ensuring every snapshot reflects the saved persisted state.
---

## 2. User Stories

### Feature A — Score Snapshot System

**A-1**  
As a **federal employee who logs journal entries daily**,  
I want my protection score to be automatically recorded each day I make a change,  
So that I can view a history of my progress without any extra effort on my part.

**A-2**  
As a **federal employee who updates my scores multiple times in one day**,  
I want only one snapshot recorded per calendar day (keeping the most recent score),  
So that my history chart shows a clean daily picture rather than multiple conflicting data points.

**A-3**  
As a **federal employee who has used the app for several months**,  
I want the app to automatically cap my stored snapshots at 90 entries,  
So that my device storage and app performance are never impacted by history accumulation.

**A-4**  
As a **federal employee whose saved data predates the history feature**,  
I want the app to load without errors even though my data has no `scoreHistory` field,  
So that I can start building history from today forward with no disruption to my existing data.

**A-5**  
As a **union representative reviewing a member's exported data**,  
I want score history snapshots to be stored as part of the member's portable data object,  
So that history is available for review outside the app when needed.

**A-6**  
As a **federal employee on the day of a RIF notice**,  
I want every score-changing action — training completions, journal saves, manual updates — to have been captured as a snapshot,  
So that my complete score trajectory is available as documentary evidence for my union rep.

### Feature B — 30-Day History Line Chart

**B-1**  
As a **federal employee checking my dashboard each morning**,  
I want to see a line chart of my protection score over the last 30 days,  
So that I can immediately understand my score trajectory without reading raw numbers.

**B-2**  
As a **federal employee who only logged activity on 3 days in the past month**,  
I want the chart to display only the days where I have snapshot data, without inventing in-between values,  
So that the chart is accurate and readable even when my activity has been sparse.

**B-3**  
As a **federal employee using the app on my phone**,  
I want the history chart to fit fully within the dashboard card on a small screen without horizontal scrolling,  
So that I can read the chart comfortably on mobile.

**B-4**  
As a **federal employee who cares about visual consistency**,  
I want the history chart to use the same gold and navy color scheme as the rest of the app,  
So that the chart feels native to the design rather than like a foreign widget.

**B-5**  
As a **federal employee whose score has been flat for 30 days**,  
I want the chart to render a flat horizontal line rather than an empty state,  
So that I can distinguish between "no data" and "no change."

**B-6**  
As a **union representative reviewing a member's progress**,  
I want the 30-day chart to be visible on the dashboard without navigating to another screen,  
So that I can assess a member's trajectory in a single glance.

### Feature C — Trend Indicators

**C-1**  
As a **federal employee building my score daily**,  
I want to see a 7-Day Change indicator showing how much my score improved this week,  
So that I feel motivated by short-term progress even before a full month of data exists.

**C-2**  
As a **federal employee who has not logged in for two weeks**,  
I want the trend indicators to show `—` rather than a misleading number when no valid comparison snapshot exists,  
So that I am not shown inaccurate data when history is too sparse for a reliable delta.

**C-3**  
As a **federal employee whose score improved over the last month**,  
I want the 30-Day Change stat to show a green upward arrow and a positive number,  
So that I have clear visual confirmation of my month-over-month protection improvement.

**C-4**  
As a **federal employee whose score declined after a performance event**,  
I want the trend indicators to show a red downward arrow and a negative number,  
So that I receive an honest signal and know I need to take corrective action.

**C-5**  
As a **union representative scanning multiple members' dashboards**,  
I want Current Score, 7-Day Change, and 30-Day Change all visible at a glance in the chart card,  
So that I can assess a member's trajectory in seconds without navigating away.

**C-6**  
As a **federal employee whose score has not changed in 30 days**,  
I want the 30-Day Change stat to show `—` or `0` rather than a misleading directional arrow,  
So that the indicator accurately reflects no net movement.

### Feature D — Empty State

**D-1**  
As a **brand-new federal employee who just installed the app**,  
I want to see a helpful explanatory message in the chart area instead of a blank or broken chart,  
So that I understand the chart will appear once I start logging activity.

**D-2**  
As a **federal employee who cleared all my app data**,  
I want the chart area to immediately return to the empty state after the reset,  
So that no stale chart data is displayed after a full data clear.

**D-3**  
As a **federal employee who just recorded my second snapshot**,  
I want the empty state message to disappear automatically and the chart to render without a page refresh,  
So that the transition from empty state to active chart is seamless.

**D-4**  
As a **federal employee with only one snapshot**,  
I want the empty state to remain visible rather than a single-point degenerate line,  
So that the chart area never presents a visually misleading one-data-point display.

### Fix 1 — Schema v3 Migration

**F1-1**  
As a **returning federal employee whose data was saved before Sprint 9**,  
I want the app to silently upgrade my stored data to add the `scoreHistory` field on first load,  
So that the app loads correctly and I can start building score history from my next activity.

**F1-2**  
As a **federal employee opening the app for the first time after Sprint 9**,  
I want my brand-new data record to include the `scoreHistory` field from the very start,  
So that the history system works correctly from my very first score-changing action.

**F1-3**  
As a **federal employee whose data is already at schema v3**,  
I want the v3 migration to skip silently without touching my data,  
So that repeated app loads produce no unwanted side effects.

### Fix 2 — Snapshot Capture Hook

**F2-1**  
As a **federal employee who just completed a training course**,  
I want a snapshot of my new score to be recorded automatically at training completion,  
So that the training progress improvement is reflected in my history chart.

**F2-2**  
As a **federal employee who manually updated a category score**,  
I want a snapshot recorded when my manual score change is saved,  
So that all score-changing actions contribute to my history, not only training completions.

**F2-3**  
As a **federal employee who saves a journal entry that affects my score**,  
I want a snapshot captured at journal save time,  
So that journal-driven score activity is correctly reflected in my history chart.

---

## 3. Acceptance Criteria

### Feature A — Score Snapshot System

**AC-A-1 — Snapshot recorded on score change**  
GIVEN a user has a current total score of 45  
WHEN they complete a training course and their score rises to 52  
THEN a snapshot `{ date: "2026-03-14", score: 52, timestamp: "2026-03-14T22:32:39.000Z" }` is appended to `data.scoreHistory`  
AND the snapshot is persisted to localStorage before `renderDashboard()` is called  
AND the history chart on the dashboard reflects the new data point on the next render.

**AC-A-2 — Daily deduplication: same-day update replaces earlier snapshot**  
GIVEN a user already has a snapshot for today with score 40  
WHEN they update their score again today and the new score is 45  
THEN the existing snapshot for today is replaced with score 45  
AND `data.scoreHistory` still contains exactly one entry for today's date  
AND no duplicate date entries exist in the array.

**AC-A-3 — Daily deduplication: different-day snapshot creates new entry**  
GIVEN a user has a snapshot for 2026-03-13  
WHEN they change their score on 2026-03-14  
THEN a new snapshot for 2026-03-14 is appended  
AND the 2026-03-13 snapshot is untouched  
AND `data.scoreHistory` now has two entries.

**AC-A-4 — 90-snapshot rolling cap enforced**  
GIVEN `data.scoreHistory` already contains exactly 90 snapshots  
WHEN a new snapshot is captured on a new calendar day  
THEN the oldest snapshot (index 0) is removed  
AND the new snapshot is appended at the end  
AND `data.scoreHistory.length` remains exactly 90.

**AC-A-5 — Missing scoreHistory field treated as empty array**  
GIVEN a user's stored data object has no `scoreHistory` field (pre-migration data)  
WHEN the app loads and a score change occurs  
THEN no JavaScript error is thrown  
AND the snapshot is appended to a freshly initialized empty array  
AND `data.scoreHistory` now contains exactly 1 entry.

**AC-A-6 — Snapshot shape is correct**  
GIVEN any score-changing action occurs  
WHEN the snapshot is written  
THEN the snapshot object has exactly three fields: `date` (string, format "YYYY-MM-DD"), `score` (integer 0–100), `timestamp` (valid ISO 8601 string)  
AND no extra fields are present on the snapshot object.

### Feature B — 30-Day History Line Chart

**AC-B-1 — Chart renders when 2+ snapshots exist**  
GIVEN `data.scoreHistory` contains at least 2 snapshots  
WHEN the dashboard screen is rendered  
THEN a canvas element with a line chart is visible in the history card below the radar chart  
AND the chart's x-axis shows dates formatted as "Mon D" (e.g. "Mar 14")  
AND the y-axis range is 0 to 100  
AND only the last 30 calendar days are represented on the x-axis.

**AC-B-2 — Chart uses correct colors**  
GIVEN the history chart is rendering  
WHEN the line and data points are drawn  
THEN the line color is `#c9a227` (gold)  
AND data point fill color is `#c9a227`  
AND the area fill beneath the line is a semi-transparent navy-toned color  
AND no other color scheme is used.

**AC-B-3 — Sparse data: only days with snapshots have plotted points**  
GIVEN a user has snapshots on only 3 of the last 30 days  
WHEN the chart renders  
THEN exactly 3 data points appear on the line  
AND the 27 days without snapshots have no plotted points and no interpolated values  
AND the chart is still readable and does not show errors.

**AC-B-4 — Chart is responsive on mobile**  
GIVEN the app is viewed on a screen 375px wide  
WHEN the dashboard renders the history chart card  
THEN the chart canvas fits within the card width without overflow  
AND no horizontal scrollbar appears on the dashboard  
AND the chart labels are legible without zooming.

**AC-B-5 — Chart updates after new snapshot is captured**  
GIVEN the history chart is currently displayed with N data points  
WHEN the user takes an action that changes their score and a new snapshot is captured  
THEN the history chart updates to reflect the new data point  
AND the chart does not require a manual page refresh to show the new point.

**AC-B-6 — Flat line for no-change scenario**  
GIVEN a user has 5 snapshots all with score 60 spread across 30 days  
WHEN the chart renders  
THEN a flat horizontal line at y=60 is visible  
AND the empty state message is NOT shown  
AND the chart displays correctly without visual glitches.

### Feature C — Trend Indicators

**AC-C-1 — Current Score shows latest total score**  
GIVEN the user's current total score is 67  
WHEN the dashboard renders  
THEN the "Current Score" stat in the history card displays "67"  
AND this value matches the score shown in the main dashboard ring.

**AC-C-2 — 7-Day Change: positive delta, green with upward arrow**  
GIVEN the user had a snapshot 7 days ago with score 50 and today's score is 58  
WHEN the dashboard renders  
THEN the 7-Day Change stat displays "▲ +8" in green text  
AND no red color or downward arrow is shown.

**AC-C-3 — 7-Day Change: negative delta, red with downward arrow**  
GIVEN the user had a snapshot 7 days ago with score 60 and today's score is 55  
WHEN the dashboard renders  
THEN the 7-Day Change stat displays "▼ −5" in red text  
AND no green color or upward arrow is shown.

**AC-C-4 — 7-Day Change: no qualifying snapshot, shows dash**  
GIVEN the user has snapshots but none older than 6 days  
WHEN the dashboard renders  
THEN the 7-Day Change stat displays "—" in muted gray text  
AND no directional arrow is shown.

**AC-C-5 — 30-Day Change: positive delta, green with upward arrow**  
GIVEN the user had a snapshot 30 days ago with score 30 and today's score is 65  
WHEN the dashboard renders  
THEN the 30-Day Change stat displays "▲ +35" in green text.

**AC-C-6 — 30-Day Change: no qualifying snapshot, shows dash**  
GIVEN the user has been using the app for only 15 days  
WHEN the dashboard renders  
THEN the 30-Day Change stat displays "—" in muted gray text  
AND no misleading delta number is shown.

**AC-C-7 — Trend indicators refresh on every dashboard render**  
GIVEN the trend indicators are currently showing specific values  
WHEN the user takes an action that changes their score and the dashboard re-renders  
THEN all three trend stats (Current Score, 7-Day Change, 30-Day Change) update to reflect the new data  
AND no stale cached values are displayed.

### Feature D — Empty State

**AC-D-1 — Empty state shown with 0 snapshots**  
GIVEN a brand-new user with `data.scoreHistory` empty  
WHEN the dashboard screen loads  
THEN the history chart canvas is NOT visible  
AND the text "Keep logging activity to build your score history" is visible in the history card  
AND no JavaScript errors are thrown.

**AC-D-2 — Empty state shown with exactly 1 snapshot**  
GIVEN `data.scoreHistory` contains exactly 1 entry  
WHEN the dashboard renders  
THEN the empty state message is still shown  
AND the chart canvas remains hidden  
AND the 7-Day Change and 30-Day Change stats both show "—".

**AC-D-3 — Empty state disappears automatically at 2 snapshots**  
GIVEN `data.scoreHistory` contains exactly 1 snapshot and the empty state is showing  
WHEN the user takes an action that creates a second snapshot on a new calendar day  
THEN the empty state message disappears without a page refresh  
AND the history chart canvas becomes visible and renders the 2-point line  
AND no user action beyond the score change is required.

**AC-D-4 — Empty state restored after data clear**  
GIVEN the user has a fully populated history chart visible  
WHEN the user clears all app data (resetting to defaults)  
THEN `data.scoreHistory` is reset to an empty array  
AND the empty state message appears immediately in the history card  
AND the chart canvas is hidden.

### Fix 1 — Schema v3 Migration

**AC-F1-1 — migrateDataV3 adds scoreHistory to pre-v3 data**  
GIVEN a user's stored data object has `_schema: 2` and no `scoreHistory` field  
WHEN the app loads and runs the migration sequence  
THEN `migrateDataV3()` adds `scoreHistory: []` to the data object  
AND `_schema` is set to `3`  
AND the migrated data is saved back to localStorage.

**AC-F1-2 — migrateDataV3 skips when _schema >= 3**  
GIVEN a user's stored data has `_schema: 3` and a populated `scoreHistory` array  
WHEN the app loads and runs the migration sequence  
THEN `migrateDataV3()` returns immediately without modifying any data  
AND the existing `scoreHistory` array is untouched  
AND `_schema` remains 3.

**AC-F1-3 — defaultData() includes scoreHistory field**  
GIVEN a completely new user with no prior localStorage data  
WHEN the app initializes and creates a default data object  
THEN the data object includes `scoreHistory: []` from the start  
AND no migration is needed for this user.

**AC-F1-4 — Migration runs after migrateDataV2**  
GIVEN a user's data is at schema v1 (pre-v2)  
WHEN the app loads  
THEN `migrateDataV2()` runs first, then `migrateDataV3()` runs second  
AND after both migrations the data is at schema v3 with both v2 and v3 fields present.

### Fix 2 — Snapshot Capture Hook

**AC-F2-1 — Snapshot captured after training completion**  
GIVEN a user completes a training course that increases their score from 40 to 48  
WHEN the training completion is saved to localStorage  
THEN `captureScoreSnapshot()` is called before `renderDashboard()`  
AND `data.scoreHistory` contains a new entry with score 48  
AND the history chart on the next dashboard render reflects the new snapshot.

**AC-F2-2 — Snapshot captured after manual score update**  
GIVEN a user manually updates their Seniority score from 20 to 28  
WHEN the update is saved  
THEN `captureScoreSnapshot()` is called before `renderDashboard()`  
AND the snapshot records the new total score (all categories summed)  
AND the snapshot persists in localStorage.

**AC-F2-3 — Snapshot NOT captured on read-only dashboard load**  
GIVEN a user opens the app and navigates to the dashboard without changing any score  
WHEN `renderDashboard()` is called  
THEN NO new snapshot is appended to `data.scoreHistory`  
AND the history array is unchanged from its state before the page load.

---

## 4. Edge Cases

The following edge cases MUST be handled gracefully. Each is a testable condition that the Developer and QA agents must explicitly verify.

---

### EC-1 — Only 1 snapshot exists

**Condition**: `data.scoreHistory.length === 1`  
**Expected behavior**:  
- The empty state message "Keep logging activity to build your score history" is displayed inside the history card.  
- The chart canvas element is hidden (not merely empty — it must not be visible to the user).  
- The 7-Day Change stat shows `—`.  
- The 30-Day Change stat shows `—`.  
- The Current Score stat still shows the correct current score.  
- No JavaScript error is thrown.  
- No partially-rendered chart artifact (axis lines, empty grid) appears beneath or alongside the empty state message.  
**Why this matters**: A single data point cannot define a line. Rendering a chart with one point would produce a dot with no context, which is visually misleading.

---

### EC-2 — All snapshots are from the same calendar day

**Condition**: User updated their score 5 times today; deduplication logic has correctly reduced `data.scoreHistory` to 1 entry.  
**Expected behavior**:  
- `data.scoreHistory.length === 1` after deduplication.  
- Empty state is shown (same as EC-1).  
- No duplicate date entries appear in the stored array.  
- The retained snapshot holds the most recent score value from that day (not the first, not the highest — the most recent).  
**Why this matters**: Without deduplication guard, a power user who updates their score repeatedly could see misleading multi-point charts for a single day, or incorrectly satisfy the 2-snapshot threshold for chart display.

---

### EC-3 — Score has not changed in 30 days

**Condition**: User has 10 snapshots over the last 30 days, all with identical score value (e.g. score=55 on 10 different dates).  
**Expected behavior**:  
- Chart renders a flat horizontal line at y=55 across all 10 data points.  
- Empty state is NOT shown (2+ snapshots exist).  
- 7-Day Change shows `—` or `0` if no directional movement detected (implementation choice, must be consistent).  
- 30-Day Change shows `—` or `0` similarly.  
- No visual glitches (chart must not collapse to zero height or show a line at y=0).  
**Why this matters**: A flat line is valid and meaningful data — it shows sustained protection posture. Must not be confused with "no data."

---

### EC-4 — Score goes up then comes back down (V-shape or inverted V)

**Condition**: User has snapshots: Day 1: 40, Day 5: 65, Day 10: 45 (inverted V / peak and drop).  
**Expected behavior**:  
- Chart renders an inverted-V shape correctly with the peak at Day 5.  
- 7-Day Change and 30-Day Change reflect the actual net delta (not the peak).  
- If today is Day 10, 7-Day Change = 45 − 40 = +5 (comparing day 10 vs day 3, the nearest snapshot ≥7 days ago).  
- Chart line does not smooth or distort the shape — points are connected in date order.  
**Why this matters**: Federal employees may experience score dips (e.g. a performance review period). The chart must accurately represent real score volatility, not just upward trends.

---

### EC-5 — User clears all app data

**Condition**: User triggers a full data reset ("Clear All Data" action) from the app settings or reports screen.  
**Expected behavior**:  
- `data.scoreHistory` is reset to `[]` (empty array) as part of `defaultData()` initialization.  
- On the next dashboard render, the empty state message appears in the history card.  
- The history chart canvas is hidden.  
- All three trend stats display `—`.  
- No stale chart instance from the previous session continues to render.  
- The Chart.js instance variable `historyChart` is destroyed or reset so it does not hold references to cleared data.  
**Why this matters**: A user who clears data to start fresh must not see ghost data from their previous session. Stale Chart.js instances can persist across re-renders if not explicitly destroyed.

---

### EC-6 — 90-snapshot cap: the 91st snapshot causes the oldest to be dropped

**Condition**: `data.scoreHistory` contains exactly 90 entries. A new score change on a new calendar day triggers snapshot capture.  
**Expected behavior**:  
- The snapshot at index 0 (oldest) is removed before the new snapshot is appended.  
- After the operation, `data.scoreHistory.length === 90` (not 91).  
- The dropped snapshot is gone permanently — it is not archived or recoverable.  
- The new snapshot appears as the last element (index 89).  
- The chart continues to display the 30 most recent days, which now no longer includes the dropped oldest date.  
**Why this matters**: Without a cap, a user active for 3+ months would accumulate hundreds of entries, increasing localStorage usage and slowing JSON parse/serialize on every data load.

---

### EC-7 — `data.scoreHistory` field missing entirely (pre-migration data)

**Condition**: User's localStorage data was saved before Sprint 9. The data object has no `scoreHistory` key at all (not null, not empty array — the key does not exist).  
**Expected behavior**:  
- App loads without throwing a TypeError or ReferenceError.  
- `migrateDataV3()` detects the missing field and adds `scoreHistory: []`.  
- After migration, all snapshot logic treats `scoreHistory` as an empty array.  
- Dashboard renders normally with the empty state shown in the history card.  
- No "Cannot read properties of undefined" errors appear in the browser console.  
**Why this matters**: This is the most likely real-world condition on Sprint 9 launch day — all existing users have pre-v3 data. Any crash here means the app is broken for 100% of returning users.

---

### EC-8 — Score changes on two consecutive days (minimum valid chart)

**Condition**: User has exactly 2 snapshots on two different calendar days.  
**Expected behavior**:  
- Empty state is hidden.  
- Chart canvas is visible and renders a line connecting exactly 2 points.  
- The line is a valid two-point line segment with correct x-axis date labels.  
- Trend indicators compute and display correctly where data permits.  
**Why this matters**: The transition from 1→2 snapshots is the critical threshold. The chart must render correctly at this minimum viable data size.

---

### EC-9 — User's snapshots span more than 30 days

**Condition**: User has 60 snapshots covering the past 60 days.  
**Expected behavior**:  
- Chart x-axis shows only the most recent 30 calendar days.  
- Snapshots older than 30 days are NOT plotted on the chart (though they remain in storage for trend calculation).  
- The 30-Day Change stat correctly uses the oldest snapshot that falls within or just before the 30-day window.  
**Why this matters**: The chart window is defined as 30 days. Older snapshots must be excluded from chart display but retained in storage for trend delta computation.

---

### EC-10 — Score is 0 (new user with no scores entered)

**Condition**: User's total score is 0. A snapshot is captured.  
**Expected behavior**:  
- Snapshot is recorded with `score: 0`.  
- Chart renders correctly with a data point at y=0 (bottom of chart).  
- No division-by-zero or null errors occur in trend calculation.  
- Current Score stat displays "0".  
**Why this matters**: Score 0 is a valid value for brand-new users. The system must handle zero without treating it as falsy/missing.

---

## 5. Out of Scope

The following items are explicitly NOT part of Sprint 9. Any implementation touching these areas without a new PM specification and Coordinator approval constitutes scope creep and must be rejected at QA.

| # | Out of Scope Item | Rationale / Future Sprint |
|---|-------------------|--------------------------|
| 1 | Score history export to PDF or CSV | PDF export is handled by Sprint 5 infrastructure; history export requires its own PM spec |
| 2 | Per-category history charts (individual seniority/performance/awards/tenure/veterans trend lines) | Adds 5 additional chart instances; complexity requires dedicated sprint |
| 3 | Annotations or notes on chart data points | Requires new UI interaction pattern (tooltips with custom content); out of sprint budget |
| 4 | Sharing or exporting the history chart as an image | Canvas-to-image export is a separate feature; not required for core tracking |
| 5 | Configurable chart date range (e.g. 7-day / 90-day toggle) | Currently fixed at 30 days; range selector requires additional UI controls |
| 6 | Server-side or cloud backup of score history | App is a client-only PWA in Phase 1; cloud sync is Phase 2 |
| 7 | Push notifications triggered by score changes | Notification system is a Phase 3 feature |
| 8 | Automatic goal-setting or score targets overlaid on chart | Requires goal-setting feature (not yet designed) |
| 9 | Comparison of score history across multiple user profiles | Single-user app; multi-profile support is not in Phase 1 scope |
| 10 | Animation of chart drawing on first render | Nice-to-have; Chart.js default animation is acceptable; custom sequencing is out of scope |
| 11 | Historical breakdown of WHICH actions caused score changes | Requires event-sourcing architecture; snapshot only records total score, not delta source |
| 12 | Retroactive history population from existing journal entries | Would require re-deriving past scores from journal data; complex and error-prone; deferred |
| 13 | Any changes to the radar chart, weekly activity chart, or journal chart | Existing charts must not be modified as part of Sprint 9 |
| 14 | Changes to the Reports screen | Score Snapshot section on Reports screen is pre-existing and must not be modified |
| 15 | New CDN dependencies or external libraries | Chart.js 4.4.0 is already loaded; no new script tags may be added |
| 16 | Changes to the onboarding flow | Out of sprint scope |
| 17 | Backend API integration for history | Phase 2+ only |
| 18 | Score history sync between devices | Requires backend; Phase 2+ |
| 19 | Deletion of individual snapshots by the user | No UI for per-snapshot management in this sprint |
| 20 | Schema version 4 or higher | Only v3 migration is in scope for Sprint 9 |

---

## 6. Definition of Done

Sprint 9 is complete ONLY when ALL of the following items are checked. This list must be verified by the QA Agent (A4) before the Coordinator (A0) commits to git.

### Feature A -- Score Snapshot System (10 items)

- [ ] **A-DOD-01** `captureScoreSnapshot()` function exists in index.html with JSDoc documentation
- [ ] **A-DOD-02** Snapshot shape `{ date: YYYY-MM-DD, score: N, timestamp: ISO string }` is correctly produced for every capture call
- [ ] **A-DOD-03** Deduplication: calling `captureScoreSnapshot()` twice on the same calendar day results in exactly 1 snapshot for that date (most recent score wins)
- [ ] **A-DOD-04** 90-snapshot rolling cap enforced: `data.scoreHistory.length` never exceeds 90 after any capture operation
- [ ] **A-DOD-05** On the 91st capture, index 0 (oldest) is dropped and new snapshot appended -- array length stays exactly 90
- [ ] **A-DOD-06** `captureScoreSnapshot()` reads score via `totalScore(data)` internally -- does not accept a score parameter from the caller
- [ ] **A-DOD-07** Snapshot is written and persisted to localStorage before `renderDashboard()` is called at every hook point
- [ ] **A-DOD-08** When `data.scoreHistory` is undefined or missing, `captureScoreSnapshot()` initializes it to empty array before appending -- no TypeError thrown
- [ ] **A-DOD-09** All snapshot date strings use local calendar date (not UTC), formatted as YYYY-MM-DD
- [ ] **A-DOD-10** Score value stored in snapshot is an integer in range 0-100; no floats, no out-of-range values stored

### Feature B -- 30-Day History Line Chart (10 items)

- [ ] **B-DOD-01** New dashboard card exists in the DOM below the radar chart card with a descriptive card title (e.g. Score History)
- [ ] **B-DOD-02** Chart canvas has a unique id (e.g. `historyChart`) and is rendered by Chart.js as type line
- [ ] **B-DOD-03** `historyChart` instance variable is declared at module top alongside `radarChart` and `weekChart`
- [ ] **B-DOD-04** X-axis shows only the last 30 calendar days, formatted as Mon D (e.g. Mar 1, Mar 14)
- [ ] **B-DOD-05** Y-axis range is fixed at 0-100 regardless of actual score distribution in data
- [ ] **B-DOD-06** Only days with existing snapshots are plotted -- no interpolation or invented data points for empty days
- [ ] **B-DOD-07** Line color is `#c9a227` (gold); area fill beneath line is semi-transparent navy-toned matching the design system
- [ ] **B-DOD-08** Chart is responsive: renders correctly at 375px viewport width without horizontal overflow or truncated labels
- [ ] **B-DOD-09** On subsequent `renderDashboard()` calls, chart updates via `.update()` -- no duplicate Chart.js instances created
- [ ] **B-DOD-10** On full data clear, existing `historyChart` instance is destroyed via `.destroy()` before resetting to empty state

### Feature C -- Trend Indicators (7 items)

- [ ] **C-DOD-01** Three stat elements render inside history card above the canvas: Current Score, 7-Day Change, 30-Day Change
- [ ] **C-DOD-02** Current Score displays the value of `totalScore(data)` and matches the main dashboard ring value
- [ ] **C-DOD-03** 7-Day Change computes delta between current score and the most recent snapshot dated at least 7 days before today
- [ ] **C-DOD-04** 30-Day Change computes delta between current score and the most recent snapshot dated at least 30 days before today
- [ ] **C-DOD-05** Positive delta: up-arrow symbol + green text. Negative delta: down-arrow symbol + red text. Zero or unavailable: em-dash in muted gray
- [ ] **C-DOD-06** All three stats display em-dash when `data.scoreHistory.length < 2`
- [ ] **C-DOD-07** Trend stats update on every `renderDashboard()` call -- no stale cached values persist across renders

### Feature D -- Empty State (5 items)

- [ ] **D-DOD-01** When `data.scoreHistory.length < 2`, chart canvas is hidden and empty state message is visible
- [ ] **D-DOD-02** Empty state message reads: Keep logging activity to build your score history (or PM-approved equivalent)
- [ ] **D-DOD-03** When `data.scoreHistory.length >= 2`, empty state hides and chart canvas appears -- no page refresh required
- [ ] **D-DOD-04** Empty state appears immediately after a full data clear without requiring navigation away from the dashboard
- [ ] **D-DOD-05** Empty state container is styled using the app design system (navy/gold, Plus Jakarta Sans font)

### Fix 1 -- Schema v3 Migration (6 items)

- [ ] **F1-DOD-01** `defaultData()` returns an object that includes `scoreHistory: []`
- [ ] **F1-DOD-02** `migrateDataV3()` function exists with JSDoc and is called immediately after `migrateDataV2()` in app init sequence
- [ ] **F1-DOD-03** `migrateDataV3()` adds `scoreHistory: []` and sets `_schema = 3` when input data has `_schema < 3` and no `scoreHistory` field
- [ ] **F1-DOD-04** `migrateDataV3()` returns immediately (guard: if stored._schema >= 3 return) when data is already v3+
- [ ] **F1-DOD-05** A user with v1 data migrates through v2 then v3 in a single app load -- final schema is 3, all fields present, no errors
- [ ] **F1-DOD-06** After migration, updated data is saved back to localStorage so the migration does not re-run on the next app load

### Fix 2 -- Snapshot Capture Hooks (4 items)

- [ ] **F2-DOD-01** `captureScoreSnapshot()` called at training completion hook point before `renderDashboard()` (around line 1348)
- [ ] **F2-DOD-02** `captureScoreSnapshot()` called at manual score update hook point before `renderDashboard()` (around line 1505)
- [ ] **F2-DOD-03** `captureScoreSnapshot()` is NOT called on read-only `renderDashboard()` calls (navigation without score change)
- [ ] **F2-DOD-04** QA manual verification: completing a training course AND updating a manual score BOTH produce new entries in `data.scoreHistory`

### QA Verification (8 items)

- [ ] **QA-DOD-01** All 10 specified edge cases (EC-1 through EC-10) tested and produce expected behavior with no console errors
- [ ] **QA-DOD-02** Full Sprint 1-8 regression suite passes: journal, training, radar chart, weekly chart, PDF export, search, gap analysis all functional
- [ ] **QA-DOD-03** Browser console shows zero errors and zero warnings during all test scenarios including all edge cases
- [ ] **QA-DOD-04** localStorage verified post-Sprint-9: `data.scoreHistory` is array, `data._schema === 3`, all pre-existing fields untouched
- [ ] **QA-DOD-05** Chart.js instance management verified: no duplicate chart instances after repeated `renderDashboard()` calls
- [ ] **QA-DOD-06** QA Agent produces formal sprint-9-qa-report.md with explicit pass/fail for every AC in this document
- [ ] **QA-DOD-07** E2E test (new user): fresh data > 2 score changes on different days > chart appears > trend stats correct
- [ ] **QA-DOD-08** E2E test (returning user): pre-v3 data loads > migration runs silently > empty state shown > first snapshot captured correctly

### Security (5 items)

- [ ] **SEC-DOD-01** No snapshot field is rendered to innerHTML without passing through `escapeHtml()` first
- [ ] **SEC-DOD-02** Score values written to snapshots are validated as integers 0-100 -- no user-supplied strings stored as score values
- [ ] **SEC-DOD-03** Date strings in snapshots are generated programmatically from `new Date()` -- no user input constructs snapshot dates
- [ ] **SEC-DOD-04** No new CDN script tags added -- Chart.js 4.4.0 at line 17 with existing SRI hash remains the sole chart dependency
- [ ] **SEC-DOD-05** Automated vulnerability scan on updated index.html returns 0 Critical, 0 High, 0 Medium findings (matching Sprint 8 baseline)

### Accessibility (4 items)

- [ ] **ACC-DOD-01** History chart canvas has `aria-label` attribute describing content (e.g. Protection score history over the last 30 days)
- [ ] **ACC-DOD-02** Empty state message is readable by screen readers (not hidden with aria-hidden when displayed)
- [ ] **ACC-DOD-03** Trend indicator color cues (green/red) are supplemented by text symbols (up-arrow/down-arrow/em-dash) so color-blind users receive the same directional information
- [ ] **ACC-DOD-04** History card and all child elements are keyboard-navigable in logical DOM order

### Code Quality and Delivery (6 items)

- [ ] **CQ-DOD-01** All new JS functions have JSDoc blocks with @param, @returns, and @description consistent with codebase standards
- [ ] **CQ-DOD-02** New code contains zero `alert()` calls, zero `console.log()` calls, zero `eval()` calls
- [ ] **CQ-DOD-03** A new MODULE header comment block (matching the existing 17 module headers) delineates the score history code section
- [ ] **CQ-DOD-04** Service worker cache version bumped from rif-shield-v4 to rif-shield-v5 and @version updated to 5.0 in sw.js
- [ ] **CQ-DOD-05** Final index.html line count is within expected range of Sprint 8 baseline (2,249 lines) -- net addition expected 100-180 lines
- [ ] **CQ-DOD-06** Dev Agent produces sprint-9-dev-output.md documenting all changes with exact line numbers before QA begins

**Total Definition of Done items: 65**
*(Minimum required: 45 -- this specification exceeds minimum by 20 items)*

---

## Appendix A: Handoff Checklist

| Artifact | Owner | Status |
|----------|-------|--------|
| sprint-9-pm-output.md | PM Agent (A1) | COMPLETE |
| sprint-9-arch-output.md | Architect Agent (A2) | PENDING |
| Coordinator Approval (Gate 3) | Coordinator (A0) | PENDING |
| sprint-9-dev-output.md | Dev Agent (A3) | PENDING |
| sprint-9-qa-report.md | QA Agent (A4) | PENDING |
| Git commit + PROGRESS.md update | Coordinator (A0) | PENDING |

---

## Appendix B: Data Shape Reference (Schema v3)

Snapshot object shape (new in Sprint 9):

    { date: "YYYY-MM-DD", score: <integer 0-100>, timestamp: "<ISO 8601 string>" }

Example snapshot entry:

    { date: "2026-03-14", score: 67, timestamp: "2026-03-14T22:39:22.000Z" }

Updated data object (schema v3) adds one field to existing v2 shape:

    data._schema    = 3                   (was 2)
    data.scoreHistory = [ ...snapshots ]  (new -- array of snapshot objects, max 90 entries)

All existing fields (seniority, performance, awards, tenure, veterans, journal, etc.) are UNCHANGED.

---

## Appendix C: Key Technical Constraints for Architect

| Constraint | Detail |
|------------|--------|
| File architecture | Single-file PWA -- all changes in index.html and sw.js only |
| Chart library | Chart.js 4.4.0 already loaded at line 17 -- no new dependencies |
| Existing charts | radarChart and weekChart (both at line 881) must not be modified |
| Color system | Gold: #c9a227 / Navy: #0f1c3f -- history chart must use these values |
| Font | Plus Jakarta Sans -- all new UI elements use this font stack |
| Storage pattern | Existing loadData() / saveData() pattern -- no new localStorage keys needed |
| Schema bump | v2 to v3 only -- no further schema changes in this sprint |
| Hook locations | Training completion approx line 1348, manual score update approx line 1505 |
| Cache version | sw.js must bump rif-shield-v4 to rif-shield-v5 |
| Codebase baseline | 2,249 lines, 63 functions, 17 MODULE headers, 21 escapeHtml() call sites |
| XSS standard | All new innerHTML assignments must use escapeHtml() on any dynamic data |
| Zero-error standard | Zero console errors/warnings in all test scenarios |

---

*End of Sprint 9 PM Specification*
*Document generated: 2026-03-14 22:39:22-04:00*
*PM Agent (A1) -- AFGE RIF Shield Multi-Agent Development System*
