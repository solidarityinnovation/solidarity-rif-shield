# Sprint 8 PM Specification — Training Gap Analysis
**Project**: AFGE RIF Shield  
**Sprint**: 8  
**Agent**: A1 — Product Manager  
**Date**: 2026-03-14  
**Status**: READY FOR ARCHITECT REVIEW (Step 2)  
**Handoff To**: A2 — Solutions Architect

---

## Preamble: Codebase Audit Findings

Agent A1 performed a targeted inspection of `index.html` (2,119 lines, Sprint 7 production state) before specifying requirements. The following findings establish the baseline.

### What Currently Exists in the Training Screen

**Static HTML Structure (lines 463-476)**:
- Screen container `#s-training` with section header
- Info alert banner with static label "Training Gap Analysis" — label only, zero functional gap detection
- Hero card: SVG ring (`#t-ring-fg`), ring number (`#t-ring-num`), score display (`#t-score-val`), potential text (`#t-potential`), XP bar (`#t-xp-fill`)
- Four hardcoded `<div class="ti">` training items as static HTML: `#ti-deia`, `#ti-cyber`, `#ti-ethics`, `#ti-eeo`
- Each static item uses `toggleCourse()` with localStorage key `rif_train_<integer-index>` (indices 0–3)

**renderTraining() function (line 1340)**:
- Handles ring animation and XP bar updates for the training sub-score display only
- Does NOT perform gap detection
- Does NOT read `data.scores` (seniority, performance, awards, tenure, veterans)
- Does NOT dynamically generate gap cards or sort content by severity

**Score System constants (line 714)**:
- MAXES = seniority:30, performance:25, awards:20, tenure:15, veterans:10
- Total: 100 points
- Levels: L5=90+, L4=80-89, L3=70-79, L2=60-69, L1=0-59

**Critical Design Clarification — Gap Threshold**:

The Sprint 8 scope defines score < 70 as the gap threshold. Since each category has a distinct maximum (veterans:10, tenure:15, awards:20, performance:25, seniority:30), applying a raw threshold of 70 is mathematically impossible for any category whose maximum is 69 or below. Therefore this specification defines the gap threshold as percentage-based:

  A gap exists when: (category_score / category_max) < GAP_THRESHOLD_PCT
  where GAP_THRESHOLD_PCT = 0.70 (configurable constant)

This is consistent with the L3 level boundary (70-79 total out of 100), applies equitably across all five categories regardless of their individual maximums, and allows the threshold to be reconfigured in one location.

**Relationship Between Existing Training Courses and Protection Categories**:
The four existing static training items (DEIA, Cybersecurity, Ethics, EEO) are OPM-mandated courses that contribute points to the total score. These items are in static HTML and are NOT managed by `renderTraining()`. Sprint 8 inserts a new **Gap Analysis Panel** dynamically between the hero card and the static course list. The static course items are preserved without modification.

---

## 1. Sprint Feature Summary

### Feature A — Training Gap Detection

The Training screen gains a live gap detection engine that evaluates each of the five protection categories (seniority, performance, awards, tenure, veterans) against a configurable percentage threshold. A gap is detected when `(category_score / category_max) < GAP_THRESHOLD_PCT` (default 0.70). Detection runs inside `renderTraining()` on every invocation, ensuring results always reflect the current state of `data.scores`. Each detected gap produces a structured gap record containing: category key (e.g., seniority), human-readable display name (e.g., Seniority), current raw score, category maximum, percentage achieved (float 0.0-1.0), raw point deficit to reach the 70% threshold, and priority rank (integer, 1 = most severe = lowest percentage). The engine returns an empty array when all five categories meet or exceed the threshold, triggering the All Clear state downstream.

### Feature B — Priority-Sorted Gap Card List

Detected gaps are rendered as a vertical list of gap cards sorted by severity (lowest percentage first = rank 1 at top). Each card displays: human-readable category display name; color-coded severity badge (red "Critical" when percentage < 0.50, amber "Warning" when 0.50 <= percentage < 0.70); current score formatted as "X / MAX"; a horizontal progress bar filled to the percentage achieved and colored red (critical) or amber (warning); and the category-specific recommended action from Feature C. A completion toggle from Fix 2 appears on each card. When zero gaps are detected the entire gap card list is replaced by a single "All Clear" panel confirming strong protection standing. The gap card container is a named DOM element within `#s-training`, populated on every `renderTraining()` call.

### Feature C — Recommended Training Actions

For each of the five protection categories, exactly one recommended action is defined as a constant and displayed on the corresponding gap card. All five recommendations reference specific federal HR processes and documentation:

- Seniority: "Document your full federal service history and submit SF-50 corrections"
- Performance: "Request a performance rating from your supervisor and file with HR"
- Awards: "Compile all awards, commendations, and recognition letters"
- Tenure: "Verify your service computation date with your agency HR office"
- Veterans: "Submit DD-214 and any additional veterans preference documentation"

These five strings are defined in a structured constant CATEGORY_META in the CONSTANTS module section, not as inline strings. They do not vary by score level and appear verbatim on gap cards and in the header stats highest-priority callout (Feature D).

### Feature D — Training Screen Header Stats Panel

A summary stats banner is rendered at the top of the Training screen (below the hero card, above the gap card list) on every `renderTraining()` call. The panel displays: total protection score (sum of all five capped category scores, 0-100); number of gap categories detected (integer count of categories below GAP_THRESHOLD_PCT); display name of the highest-priority gap (the category with the lowest percentage score); and a deficit callout showing how many raw points separate the worst category from its 70% threshold. When zero gaps are detected the panel shows an "All Clear" confirmation with green visual treatment and hides the gap count and worst-category fields. The panel is rendered entirely by `renderTraining()` with no separate render function.

### Fix 1 — renderTraining() Refactor

The existing `renderTraining()` function is refactored to a data-driven flow. New execution order: (1) read live scores from `data.scores`; (2) invoke gap detection engine to produce sorted gap records array; (3) render header stats panel from gap records; (4) render gap cards in priority order with recommended actions and completion toggles; (5) handle zero-gap All Clear state; (6) preserve existing ring animation and XP bar update logic for the training sub-score display. The function signature `renderTraining()` is unchanged so all existing call sites (line 832) require no modification. The static course items (deia, cyber, ethics, eeo) are NOT touched by this refactor.

### Fix 2 — Training Progress Tracking per Category

Each gap card includes a "Mark Action Complete" toggle button. Completion state is persisted in localStorage using category-keyed names: `rif_train_done_<category>` (e.g., `rif_train_done_seniority`, `rif_train_done_veterans`). This scheme is additive and independent from the existing `rif_train_<integer>` keys used for the four static OPM training items — those keys are untouched. On every `renderTraining()` call, each gap card reads its category completion key from localStorage before rendering. A completed gap card displays a checkmark indicator and visually muted styling but remains visible in the list — the score gap persists regardless of user acknowledgment. Toggling a completed card back to incomplete removes the localStorage key.

---

## 2. User Stories

### Feature A — Training Gap Detection

**Story A1**  
As a federal employee facing a potential RIF,  
I want the Training screen to automatically detect which of my five protection categories (seniority, performance, awards, tenure, veterans) score below 70% of their maximum,  
So that I know which areas of my federal record need urgent attention without manually calculating thresholds.

**Story A2**  
As a union representative reviewing a member profile,  
I want gap detection to recompute on every Training screen render without using cached results,  
So that the gap list always reflects the most current scores including journal entries made since the last visit.

**Story A3**  
As a first-time user with all five category scores at default zero,  
I want all five categories to appear as gaps immediately on my first visit to the Training screen,  
So that I receive comprehensive guidance on all five protection dimensions from the moment I open the app.

**Story A4**  
As a federal employee who has recently improved a category score above the threshold,  
I want that category to disappear from the gap list on the next render,  
So that the Training screen accurately reflects my progress and does not display false alerts.

**Story A5**  
As a federal employee with a strong overall total score but one weak individual category,  
I want gap detection to evaluate each category independently against its own maximum rather than the total score,  
So that a strong total score does not mask a specific weakness in one protection dimension.

---

### Feature B — Priority-Sorted Gap Card List

**Story B1**  
As a federal employee with limited time to take action,  
I want my most critical gap (lowest percentage of maximum achieved) to appear at the top of the gap list,  
So that my first effort is directed to the area where I am most vulnerable in a RIF scenario.

**Story B2**  
As a federal employee reviewing training priorities,  
I want each gap card to display a color-coded severity badge — red Critical for below 50% of max, amber Warning for 50-69% of max —  
So that I can distinguish urgent gaps from moderate ones at a glance without reading numerical scores.

**Story B3**  
As a visual learner reviewing my protection status,  
I want each gap card to include a horizontal progress bar filled to the percentage of the category maximum I have achieved,  
So that I can gauge proximity to the threshold without performing mental arithmetic.

**Story B4**  
As a union representative explaining scores to a member,  
I want each gap card to display the current raw score and the category maximum formatted as X / MAX,  
So that I can explain exactly how many points the member needs to add to close the gap.

**Story B5**  
As a first-time user unfamiliar with internal code key names,  
I want gap cards to use human-readable display names (Seniority, Performance, Awards, Tenure, Veterans Preference) rather than internal keys,  
So that I understand which aspect of my employment record each card refers to without needing a glossary.

**Story B6**  
As a federal employee who has addressed all protection gaps,  
I want the gap list to be replaced by an All Clear confirmation panel when all five categories are at or above 70% of their maximum,  
So that I feel confident my protection record is strong and do not assume the screen is broken or empty.

**Story B7**  
As a first-time user opening the Training screen for the first time,  
I want to see all five gap cards rendered when my scores are at default zero,  
So that I immediately understand the full scope of documentation I need to gather.

---

### Feature C — Recommended Training Actions

**Story C1**  
As a federal employee with a gap in the Seniority category,  
I want to see the specific recommendation "Document your full federal service history and submit SF-50 corrections" on the Seniority gap card,  
So that I know exactly what document to obtain and what federal HR process to follow.

**Story C2**  
As a federal employee with a gap in the Performance category,  
I want to see the recommendation "Request a performance rating from your supervisor and file with HR" on the Performance gap card,  
So that I have a concrete next step referencing the real federal HR process for obtaining a performance rating.

**Story C3**  
As a federal employee with a Veterans preference gap,  
I want to see the recommendation "Submit DD-214 and any additional veterans preference documentation" on the Veterans gap card,  
So that I receive veterans-specific guidance rather than a generic action inapplicable to my situation.

**Story C4**  
As a federal employee with a gap in the Awards category,  
I want to see the recommendation "Compile all awards, commendations, and recognition letters" on the Awards gap card,  
So that I know exactly which physical documents to gather to strengthen my awards score.

**Story C5**  
As a federal employee with a Tenure gap,  
I want to see the recommendation "Verify your service computation date with your agency HR office" on the Tenure gap card,  
So that I know the specific HR contact and documentation step needed to strengthen my tenure standing.

**Story C6**  
As a union representative coaching multiple members across different sessions,  
I want recommended actions to be identical constants for all users with the same category gap,  
So that my coaching scripts are consistent and I can prepare printed reference materials in advance.

---

### Feature D — Training Screen Header Stats Panel

**Story D1**  
As a federal employee opening the Training screen,  
I want to see my total protection score (out of 100) in the header stats panel,  
So that I have immediate context on my overall standing before reviewing individual gaps.

**Story D2**  
As a federal employee reviewing protection status,  
I want the header stats panel to show the count of gap categories below 70% of their maximum,  
So that I understand at a glance how many areas of my record need attention.

**Story D3**  
As a federal employee with multiple gaps,  
I want the header stats panel to identify my highest-priority gap by display name,  
So that even before scrolling to the gap list I know my single most critical area.

**Story D4**  
As a federal employee who has achieved strong scores across all five categories,  
I want the header stats panel to display an All Clear confirmation instead of a gap count,  
So that I receive positive reinforcement and do not need to scroll the gap list to confirm zero gaps.

**Story D5**  
As a union representative demonstrating the app to a member,  
I want the header stats panel to update in real time when I navigate back to the Training screen after making score changes,  
So that the member can see the live impact of documentation improvements on the gap analysis.

---

### Fix 1 — renderTraining() Refactor

**Story F1-1**  
As a federal employee who logs a new journal entry and then opens the Training screen,  
I want the gap analysis to reflect my most current scores rather than a stale snapshot,  
So that logging activity immediately and visibly reduces or closes gaps on the Training screen.

**Story F1-2**  
As a developer maintaining the codebase,  
I want `renderTraining()` to read live score data from `data.scores` on every invocation,  
So that there is a single authoritative data path for the Training screen and no stale local state.

**Story F1-3**  
As a developer maintaining the codebase,  
I want the function signature `renderTraining()` to remain unchanged,  
So that the existing call site at line 832 requires no modification and regression risk is minimized.

---

### Fix 2 — Training Progress Tracking per Category

**Story F2-1**  
As a federal employee who has submitted their DD-214 to HR,  
I want to mark the Veterans gap card action as Complete so it displays a checkmark,  
So that I can track which recommended actions I have already taken without the card disappearing.

**Story F2-2**  
As a federal employee who marked an action complete in a previous session,  
I want the completion state of each gap card to persist across app restarts and screen navigation,  
So that I do not need to re-mark actions I have already completed every time I open the Training screen.

**Story F2-3**  
As a federal employee who accidentally marked a gap action as complete,  
I want to toggle the completion state back to incomplete by clicking the button again,  
So that the card reverts to its normal appearance and I am reminded to complete the action.

---

## 3. Acceptance Criteria

### AC-A1 — Automatic Gap Detection on Screen Open

GIVEN seniority=15 (50% of 30), performance=20 (80% of 25), awards=12 (60% of 20), tenure=12 (80% of 15), veterans=6 (60% of 10)  
WHEN the user navigates to the Training screen  
THEN three gap cards are rendered for seniority, awards, and veterans  
AND performance and tenure gap cards are NOT rendered  
AND seniority displays a red Critical badge (50% < 50% threshold — see edge case below)  
AND awards displays an amber Warning badge (60%)  
AND veterans displays an amber Warning badge (60%)

GIVEN a category score is exactly at 70% of its maximum (e.g., veterans=7 of 10)  
WHEN gap detection evaluates that category  
THEN that category is NOT flagged as a gap (threshold is strictly less than 0.70, not less than or equal)

GIVEN all five category scores are at 0  
WHEN the gap detection engine runs  
THEN all five categories are flagged as gaps with 0% achieved  
AND all five cards show a red Critical badge

---

### AC-A2 — Gap Detection Recomputes on Every Render

GIVEN the user viewed the Training screen when seniority=10 (33%, gap flagged)  
AND the user navigated to Journal, added entries raising seniority to 25 (83%)  
WHEN the user navigates back to the Training screen  
THEN renderTraining() reads seniority=25 from data.scores  
AND the seniority gap card is NOT rendered  
AND the header stats panel shows an updated lower gap count

GIVEN the user navigates away from and back to Training without making score changes  
WHEN renderTraining() is called  
THEN the gap list is identical to the previous render (no flicker, no reordering)

---

### AC-A3 — All Five Gaps Shown for Default Zero State

GIVEN a brand-new user has never logged a journal entry (all scores remain at 0)  
WHEN the Training screen is opened for the first time  
THEN exactly five gap cards are rendered, one per category  
AND all five display a red Critical badge  
AND the header stats panel shows total score=0, gaps detected=5, and the highest-priority gap name  
AND no All Clear panel is visible

---

### AC-A4 — Resolved Gaps Removed from List

GIVEN veterans=4 (40% of 10, flagged as gap)  
AND the user adds journal entries raising veterans to 8 (80% of 10)  
WHEN the Training screen is opened  
THEN the veterans gap card is NOT present  
AND all remaining gap cards are unaffected and retain correct sort order

---

### AC-A5 — Per-Category Independent Evaluation

GIVEN total score=88 (L4 level) but seniority=18 (60% of 30)  
WHEN gap detection runs  
THEN seniority is flagged as a gap despite the high total score  
AND the seniority gap card is rendered with an amber Warning badge  
AND the header stats panel shows gaps detected=1

---

### AC-B1 — Priority Sort Order

GIVEN gaps exist: veterans=4 (40%), seniority=15 (50%), awards=12 (60%)  
WHEN the gap card list is rendered  
THEN the first card in DOM order is veterans (40%, rank 1)  
AND the second card is seniority (50%, rank 2)  
AND the third card is awards (60%, rank 3)  
AND this order is stable on repeated renders with unchanged scores

GIVEN two categories have equal percentages (e.g., both at 50%)  
WHEN rendered  
THEN their order is deterministic between renders (alphabetical key tiebreaker acceptable)

---

### AC-B2 — Severity Badge Color Coding

GIVEN a category score is below 50% of its maximum (e.g., seniority=10, 33%)  
WHEN the gap card is rendered  
THEN a red Critical badge is visible on the card  
AND the progress bar fill color is red

GIVEN a category score is between 50% and 69% of its maximum inclusive (e.g., performance=15, 60%)  
WHEN the gap card is rendered  
THEN an amber Warning badge is visible on the card  
AND the progress bar fill color is amber

GIVEN a category score is at exactly 50% of its maximum (e.g., awards=10, 50%)  
WHEN the gap card is rendered  
THEN the badge is amber Warning (50% is the lower boundary of the warning zone, not critical)

---

### AC-B3 — Progress Bar Fill

GIVEN seniority=18 (60% of 30)  
WHEN the Seniority gap card is rendered  
THEN the progress bar is filled to 60% of the bar width  
AND the bar color is amber (60% is in warning zone)

GIVEN a category score is 0  
WHEN the gap card is rendered  
THEN the progress bar is empty (0% fill)  
AND the bar color is red

---

### AC-B4 — Raw Score and Maximum Display

GIVEN seniority=18, MAXES.seniority=30  
WHEN the Seniority gap card is rendered  
THEN the card displays the text 18 / 30 in the score field  
AND no other score formatting is used (no decimals, no percent symbol in the score field)

---

### AC-B5 — Human-Readable Category Display Names

GIVEN a gap exists in the seniority category (internal key)  
WHEN the gap card is rendered  
THEN the card header reads Seniority (not seniority or SENIORITY)  
AND the same applies to all five categories: Performance, Awards, Tenure, Veterans Preference

---

### AC-B6 — All Clear Panel When Zero Gaps

GIVEN all five category scores are at or above 70% of their respective maximums  
WHEN the Training screen is rendered  
THEN no individual gap cards are rendered  
AND a single All Clear panel is displayed in their place  
AND the All Clear panel contains a green visual indicator and a confirmation message  
AND the header stats panel shows All Clear state (no gap count, no worst-category field)

---

### AC-B7 — All Five Gap Cards for Zero-Score User

GIVEN all scores are 0  
WHEN Training screen renders  
THEN five cards are rendered in this order: seniority (0%), performance (0%), awards (0%), tenure (0%), veterans (0%)  
AND tiebreaker order is alphabetical by key: awards, performance, seniority, tenure, veterans  
AND all five show red Critical badges

---

### AC-C1 — Seniority Recommendation Text

GIVEN the Seniority category is flagged as a gap  
WHEN the Seniority gap card is rendered  
THEN the card body contains the exact text: Document your full federal service history and submit SF-50 corrections  
AND this text is the same on every render and for every user

---

### AC-C2 — Performance Recommendation Text

GIVEN the Performance category is flagged as a gap  
WHEN the Performance gap card is rendered  
THEN the card body contains the exact text: Request a performance rating from your supervisor and file with HR

---

### AC-C3 — Veterans Recommendation Text

GIVEN the Veterans category is flagged as a gap  
WHEN the Veterans gap card is rendered  
THEN the card body contains the exact text: Submit DD-214 and any additional veterans preference documentation

---

### AC-C4 — Awards Recommendation Text

GIVEN the Awards category is flagged as a gap  
WHEN the Awards gap card is rendered  
THEN the card body contains the exact text: Compile all awards, commendations, and recognition letters

---

### AC-C5 — Tenure Recommendation Text

GIVEN the Tenure category is flagged as a gap  
WHEN the Tenure gap card is rendered  
THEN the card body contains the exact text: Verify your service computation date with your agency HR office

---

### AC-C6 — Recommendations Are Constants

GIVEN CATEGORY_META is defined in the CONSTANTS section  
WHEN the codebase is inspected  
THEN each of the five recommendation strings appears exactly once in the codebase (in the CATEGORY_META constant)  
AND zero inline recommendation strings appear in renderTraining() or any render helper

---

### AC-D1 — Header Shows Total Score

GIVEN seniority=20, performance=18, awards=14, tenure=10, veterans=8 (total=70)  
WHEN the Training screen is rendered  
THEN the header stats panel displays total score as 70  
AND this value matches the output of totalScore(data)

---

### AC-D2 — Header Shows Gap Count

GIVEN three categories are below 70% of their maximum  
WHEN the Training screen renders  
THEN the header stats panel displays gaps detected: 3  
AND this count matches the length of the gap records array

---

### AC-D3 — Header Shows Highest-Priority Gap Name

GIVEN veterans has the lowest percentage score (40%) of all gap categories  
WHEN the Training screen renders  
THEN the header stats panel displays the highest-priority gap as Veterans Preference  
AND this matches the display name of the rank-1 gap card

---

### AC-D4 — All Clear State in Header Panel

GIVEN all five category scores are at or above 70% of their maximums  
WHEN the Training screen renders  
THEN the header stats panel displays an All Clear message  
AND the gap count field is hidden or not rendered  
AND the highest-priority gap field is hidden or not rendered  
AND the total score is still visible

---

### AC-D5 — Header Updates After Score Change

GIVEN the header shows gaps detected: 3 with highest priority: Veterans Preference  
AND the user navigates to Journal and adds entries raising veterans to above threshold  
WHEN the user returns to the Training screen  
THEN the header updates to gaps detected: 2  
AND the highest-priority gap field reflects the new worst category  
AND no page refresh is required

---

### AC-F1-1 — renderTraining Reads Live Data

GIVEN data.scores.seniority was 10 on a previous Training screen visit  
AND the user has since logged entries raising it to 22  
WHEN renderTraining() is called  
THEN it reads data.scores.seniority and receives 22  
AND the seniority gap card reflects the updated score

---

### AC-F1-2 — Single Data Path

GIVEN renderTraining() is inspected  
WHEN the code is reviewed  
THEN all five category scores are sourced exclusively from data.scores  
AND no hardcoded score values appear in the function body  
AND no module-level variables are read in place of data.scores

---

### AC-F1-3 — Signature Preserved

GIVEN the existing call site at line 832 calls renderTraining() with no arguments  
WHEN the refactored function is deployed  
THEN the call site requires no modification  
AND the function continues to be called as renderTraining() with zero parameters

---

### AC-F2-1 — Mark Action Complete Persists

GIVEN the Veterans gap card is rendered and uncompleted  
WHEN the user clicks the Mark Action Complete toggle  
THEN localStorage key rif_train_done_veterans is set to a truthy value  
AND the card displays a checkmark indicator  
AND the card styling becomes visually muted  
AND the card remains visible in the gap list

---

### AC-F2-2 — Completion State Survives Navigation

GIVEN the user marked the Seniority action complete and navigated away  
WHEN the user returns to the Training screen  
THEN renderTraining() reads localStorage key rif_train_done_seniority  
AND the Seniority gap card renders in completed state (checkmark, muted styling) without user interaction

---

### AC-F2-3 — Toggle Back to Incomplete

GIVEN the Veterans gap card is in completed state  
WHEN the user clicks the toggle button again  
THEN localStorage key rif_train_done_veterans is removed  
AND the card reverts to normal (incomplete) appearance  
AND no page reload is required

---

## 4. Edge Cases

### EC-1 — All Five Scores Above Threshold (Zero Gaps)
Scenario: seniority=25 (83%), performance=20 (80%), awards=15 (75%), tenure=12 (80%), veterans=8 (80%).
- Gap detection engine returns empty array (length 0)
- No gap cards rendered
- All Clear panel displays in gap card container with green visual indicator
- Header stats panel shows All Clear state: total score visible, gap count hidden, worst-category hidden
- Four static OPM training course items (deia, cyber, ethics, eeo) remain fully visible and functional
- Completion toggles on static items are unaffected
Risk: All Clear panel is mandatory. An empty container with no feedback is a defect.

### EC-2 — All Five Scores at Zero (Maximum Gap State)
Scenario: Brand-new user, all category scores at 0.
- Gap detection returns five records, each with pct=0.0
- Deficits to reach 70% threshold: seniority=21, performance=17.5, awards=14, tenure=10.5, veterans=7
- Non-integer deficit display (17.5, 10.5): rounding behavior is an Architect decision; must be consistent across all five cards
- All five cards show red Critical badge (0% < 50%)
- Progress bars empty (0% fill)
- Sort tiebreaker alphabetical: awards, performance, seniority, tenure, veterans
- Header: total=0, gaps=5, highest-priority=Awards (first alphabetically among all-zero ties)
- No All Clear panel
- All five completion toggles default to incomplete

### EC-3 — Score Exactly at Threshold (Exclusive Boundary)
Scenario A: veterans=7 (7/10 = exactly 70.0%)
- veterans is NOT a gap (condition is strictly < 0.70, not <=)
- Veterans gap card is NOT rendered
Scenario B: seniority=21 (21/30 = exactly 70.0%)
- seniority is NOT a gap for the same reason
Scenario C: awards=13 (65%, gap) then user adds 1 point to reach awards=14 (70.0%)
- Before: awards gap card rendered
- After re-navigation: awards gap card NOT rendered (14/20 = 0.70 = not a gap)
Risk: Floating point arithmetic may produce 0.6999... instead of 0.7. Architect must specify the exact comparison expression to prevent boundary bugs.

### EC-4 — Score Changes While User Is on Training Screen
Scenario: User on Training screen opens Log Modal, logs an entry raising a gap category score, closes modal.
- Gap list does NOT update in real time while user remains on Training screen
- No live data binding or reactive re-render in Sprint 8
- On next navigation away and back, renderTraining() runs and shows updated analysis
- Existing nav() call at line 832 is sufficient; no additional trigger needed
Out of scope: Real-time updates after saveLog() completes. Phase 3 enhancement.

### EC-5 — GAP_THRESHOLD_PCT Constant Changed
Scenario: Developer changes GAP_THRESHOLD_PCT from 0.70 to 0.80.
- All gap computations use the new threshold immediately
- Categories at 70-79% of max now appear as gaps
- Zero hardcoded 0.70 values in gap detection, deficit calculation, or header stats
- Change propagates to: gap engine, deficit calculation, header stats panel
- GAP_CRITICAL_PCT = 0.50 is independent and does not change
Risk: If severity boundary is not a named constant, changing GAP_THRESHOLD_PCT leaves hardcoded severity values. Both constants must be named.

### EC-6 — Single Category at Zero, Others Strong
Scenario: seniority=0 (0%), all others above threshold.
- Exactly one gap card rendered for Seniority
- Red Critical badge (0% < 50%)
- Header: gaps=1, highest-priority=Seniority
- All Clear panel NOT rendered
- Four static OPM course items remain visible below the single gap card

### EC-7 — Completion Toggle Persists When Gap Later Closes
Scenario: User marks Seniority action complete. Later raises seniority above threshold.
- Seniority gap card NOT rendered (score above threshold)
- localStorage key rif_train_done_seniority remains in storage (not cleaned up)
- If seniority later drops below threshold again, gap card re-renders with completed state already set
Risk: Stale localStorage keys accumulate. Acceptable in Sprint 8. Cleanup is out of scope.

### EC-8 — CATEGORY_META Lookup for Unknown Key (Defensive)
Scenario: A gap record is generated with a category key not in CATEGORY_META.
- Gap card renderer does not throw uncaught exception
- Card displays fallback display name (raw key) and fallback recommendation (empty string or generic)
- No crash, no blank screen, no console error causing functional failure
Risk: Defensive programming concern for Architect/Dev. PM flags; implementation deferred to architecture phase.

---

## 5. Out of Scope — Sprint 8

The following items are explicitly excluded. Any inclusion requires a new PM specification cycle.

1. Real-time gap list updates while user is actively on Training screen — updates occur only on re-navigation
2. Modification of any of the four static OPM training course items (DEIA, Cybersecurity, Ethics, EEO) — HTML, content, URLs, localStorage keys rif_train_0 through rif_train_3, and toggle behavior are unchanged
3. Addition of new gap categories or new protection dimensions beyond the existing five
4. AI-generated, dynamic, or score-level-varying recommended actions — all five are static string constants
5. Score entry or editing from the Training screen — users add scores exclusively via the Journal Log Modal
6. Linking gap cards to the Journal Log Modal or navigating to Journal on gap card interaction
7. Push notifications, email alerts, or any out-of-app communication based on gap detection
8. Gap history tracking, trend analysis, or time-series storage of gap states
9. Per-user configurable GAP_THRESHOLD_PCT — the threshold is a developer constant, not a user preference
10. Sharing or exporting the gap analysis as a standalone artifact — the existing PDF report module is not modified
11. Animated transitions or micro-animations between gap card states beyond existing design system
12. Internationalization, localization, or translation of recommendation strings
13. Backend, API, or cloud synchronization — all gap data is computed locally from localStorage-backed data.scores
14. Modification of the MAXES constants or the scoring system — seniority:30, performance:25, awards:20, tenure:15, veterans:10 are locked
15. Replacement or removal of the hero ring SVG, ring number, score value, potential text, or XP bar — preserved unchanged
16. Cross-device or cross-session syncing of completion toggle state via any backend — localStorage only
17. Gamification features, achievement badges, or reward systems for completing gap actions
18. Tooltips, help modals, or contextual explanations for gap categories in Sprint 8
19. Cleanup of stale rif_train_done_* localStorage keys from resolved gaps
20. Changes to Journal screen, Dashboard screen, Reports screen, or Onboarding flow

---

## 6. Definition of Done

Sprint 8 is complete when ALL items below are checked. Agent A4 (QA) records PASS/FAIL for each item. Zero open FAILs permitted for sprint sign-off. Minimum 55 items; all must pass.

### Feature A — Gap Detection Engine (10 items)
- [ ] A01. GAP_THRESHOLD_PCT = 0.70 defined as a named constant in the CONSTANTS module section
- [ ] A02. GAP_CRITICAL_PCT = 0.50 defined as a named constant in the CONSTANTS module section
- [ ] A03. CATEGORY_META constant defined with all five entries; each entry has fields: key, displayName, max, recommendation
- [ ] A04. Gap detection computes pct = category_score / category_max for all five categories
- [ ] A05. Gap condition uses strictly-less-than comparison (pct < GAP_THRESHOLD_PCT, never <=)
- [ ] A06. Gap detection returns empty array when all five categories are at or above threshold
- [ ] A07. Each gap record contains all required fields: key, displayName, score, max, pct, deficit, rank
- [ ] A08. Gap records array sorted by pct ascending (lowest pct = index 0 = rank 1)
- [ ] A09. Tiebreaker for equal pct values is deterministic (alphabetical by key confirmed by Architect)
- [ ] A10. All five category scores sourced exclusively from data.scores; zero hardcoded score values in gap logic

### Feature B — Gap Card List Rendering (12 items)
- [ ] B01. Gap card container DOM element exists in #s-training between hero card and static course list
- [ ] B02. Gap cards render in priority sort order matching gap records array (rank 1 card first in DOM)
- [ ] B03. Each gap card displays human-readable displayName from CATEGORY_META, not raw key string
- [ ] B04. Each gap card displays score formatted as X / MAX using raw integer values
- [ ] B05. Red Critical badge rendered when gap pct < GAP_CRITICAL_PCT (below 50%)
- [ ] B06. Amber Warning badge rendered when GAP_CRITICAL_PCT <= pct < GAP_THRESHOLD_PCT (50-69%)
- [ ] B07. Progress bar fill percentage matches gap pct value (60% pct produces 60% fill width)
- [ ] B08. Progress bar fill color is red for Critical severity, amber for Warning severity
- [ ] B09. All Clear panel renders when gap records array has length 0
- [ ] B10. All Clear panel contains green visual indicator and positive confirmation message text
- [ ] B11. All Clear panel is absent from DOM when one or more gaps exist
- [ ] B12. All five gap cards render correctly when all category scores are at zero

### Feature C — Recommended Actions (7 items)
- [ ] C01. Seniority recommendation text on card matches exactly: Document your full federal service history and submit SF-50 corrections
- [ ] C02. Performance recommendation text matches exactly: Request a performance rating from your supervisor and file with HR
- [ ] C03. Awards recommendation text matches exactly: Compile all awards, commendations, and recognition letters
- [ ] C04. Tenure recommendation text matches exactly: Verify your service computation date with your agency HR office
- [ ] C05. Veterans recommendation text matches exactly: Submit DD-214 and any additional veterans preference documentation
- [ ] C06. All five recommendation strings defined exclusively in CATEGORY_META; zero inline recommendation strings appear in renderTraining() or any render helper
- [ ] C07. Recommendation text is visible and readable on each rendered gap card at mobile viewport width

### Feature D — Header Stats Panel (8 items)
- [ ] D01. Header stats panel DOM element exists in #s-training HTML and is rendered on every renderTraining() call
- [ ] D02. Panel displays total protection score value matching output of totalScore(data)
- [ ] D03. Panel displays gap count integer matching length of gap records array
- [ ] D04. Panel displays displayName of rank-1 gap record (category with lowest pct)
- [ ] D05. Panel shows All Clear state when gap records array length is 0
- [ ] D06. Gap count field and worst-category field are hidden or not rendered in All Clear state
- [ ] D07. Total score field remains visible and correct in All Clear state
- [ ] D08. Panel displays updated values after user navigates away, makes score changes, and returns to Training screen

### Fix 1 — renderTraining() Refactor (8 items)
- [ ] F101. renderTraining() reads all five category scores from data.scores on every invocation
- [ ] F102. renderTraining() calls gap detection engine and receives sorted gap records array
- [ ] F103. renderTraining() renders header stats panel using gap records array output
- [ ] F104. renderTraining() renders gap cards in priority order with recommended actions and completion toggles
- [ ] F105. renderTraining() handles zero-gap state by rendering All Clear panel without errors or console exceptions
- [ ] F106. renderTraining() preserves existing SVG ring animation logic (ring fill, ring number, score value, potential text)
- [ ] F107. renderTraining() preserves existing XP bar fill update logic
- [ ] F108. Function signature renderTraining() is unchanged; existing call site at line 832 requires zero modification

### Fix 2 — Training Progress Tracking (7 items)
- [ ] F201. Each gap card includes a clearly labeled Mark Action Complete toggle button
- [ ] F202. Clicking the toggle when incomplete writes localStorage key rif_train_done_{category} with truthy value
- [ ] F203. Clicking the toggle when complete removes localStorage key rif_train_done_{category}
- [ ] F204. Completed gap card displays a checkmark icon indicator
- [ ] F205. Completed gap card applies visually muted or dimmed styling distinct from incomplete state
- [ ] F206. Completed gap card remains visible in the gap list and is not removed from DOM
- [ ] F207. On renderTraining() call, each gap card reads its rif_train_done_{category} key from localStorage before rendering and restores completed state
- [ ] F208. Existing localStorage keys rif_train_0 through rif_train_3 for static OPM course items are untouched and unmodified

### QA Verification (8 items)
- [ ] QA01. All 10 Feature A acceptance criteria (AC-A1 through AC-A5) verified with live score data permutations
- [ ] QA02. All Feature B acceptance criteria (AC-B1 through AC-B7) verified with visual inspection at 390px mobile viewport
- [ ] QA03. All Feature C acceptance criteria (AC-C1 through AC-C6) verified with exact string comparison against CATEGORY_META constants
- [ ] QA04. All Feature D acceptance criteria (AC-D1 through AC-D5) verified across zero-gap, partial-gap, and full-gap states
- [ ] QA05. All Fix 1 acceptance criteria (AC-F1-1 through AC-F1-3) verified with function inspection and live render walkthrough
- [ ] QA06. All Fix 2 acceptance criteria (AC-F2-1 through AC-F2-3) verified with localStorage key inspection in browser DevTools
- [ ] QA07. All 8 Edge Cases (EC-1 through EC-8) manually tested with documented expected vs. actual results
- [ ] QA08. Full regression test of Sprints 1-7 features confirms zero regressions introduced by Sprint 8 changes

### Security (5 items)
- [ ] SEC01. No new user-supplied input is rendered to DOM without escapeHtml() sanitization
- [ ] SEC02. Gap card content (displayName, recommendation, score values) sourced from constants, not user input; escapeHtml not required but no raw data.scores string values rendered without sanitization
- [ ] SEC03. localStorage keys for completion state use category name constants, not dynamic string concatenation from user input
- [ ] SEC04. No new eval(), alert(), document.write(), or console.log() calls introduced in Sprint 8 changes
- [ ] SEC05. Zero new XSS vectors introduced; security audit of all new innerHTML assignments confirms safe content

### Accessibility (5 items)
- [ ] ACC01. Gap card container and All Clear panel are keyboard navigable (tab order is logical)
- [ ] ACC02. Severity badges (Critical, Warning, All Clear) convey meaning through text as well as color (not color alone)
- [ ] ACC03. Progress bars include an aria-label or aria-valuenow/aria-valuemax attributes for screen reader support
- [ ] ACC04. Mark Action Complete toggle buttons have descriptive aria-label including the category name
- [ ] ACC05. All new interactive elements meet minimum 44x44px touch target size at mobile viewport

### Delivery (5 items)
- [ ] DEL01. Sprint 8 changes confined to renderTraining() refactor, new gap detection functions, new constants, and gap card container HTML; no other screens modified
- [ ] DEL02. Service Worker cache version incremented (rif-shield-v3 to rif-shield-v4) to force cache refresh for returning users
- [ ] DEL03. Sprint 8 dev handoff document written and saved to .agents/handoffs/
- [ ] DEL04. Sprint 8 QA report written and saved to .agents/handoffs/
- [ ] DEL05. PROGRESS.md updated to reflect Sprint 8 complete status with cumulative test check count

---

## Appendix: Constant Reference Sheet

For Architect and Developer reference. All constants defined in CONSTANTS module section.

| Constant Name      | Value  | Purpose                                         |
|--------------------|--------|-------------------------------------------------|
| GAP_THRESHOLD_PCT  | 0.70   | Minimum passing percentage per category         |
| GAP_CRITICAL_PCT   | 0.50   | Boundary below which severity is Critical (red) |
| CATEGORY_META      | object | Five category entries with key/displayName/max/recommendation |

Category maxes locked from existing MAXES constant:

| Category Key | Display Name        | Max Points |
|--------------|---------------------|------------|
| seniority    | Seniority           | 30         |
| performance  | Performance         | 25         |
| awards       | Awards              | 20         |
| tenure       | Tenure              | 15         |
| veterans     | Veterans Preference | 10         |

localstorage Key Schema for Sprint 8:

| Key Pattern                    | Purpose                              | Managed By       |
|-------------------------------|--------------------------------------|------------------|
| rif_train_done_{category}     | Gap card action completion state     | Fix 2 (new)      |
| rif_train_0 through rif_train_3 | Static OPM course completion state | Existing (unchanged) |

---

*End of Sprint 8 PM Specification*  
*Agent A1 — Product Manager*  
*Ready for Step 2: Solutions Architect handoff*
