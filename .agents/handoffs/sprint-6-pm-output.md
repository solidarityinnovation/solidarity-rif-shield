# Sprint 6 PM Output
## Agent: A1 — Product Manager
## Date: 2026-03-14
## Sprint Goal: Form UX Hardening + QA Suite Improvements

---

## Table of Contents
1. [Sprint Feature Summary](#1-sprint-feature-summary)
2. [User Stories](#2-user-stories)
3. [Acceptance Criteria](#3-acceptance-criteria)
4. [Edge Cases](#4-edge-cases)
5. [Out of Scope](#5-out-of-scope)
6. [Definition of Done](#6-definition-of-done)

---

## 1. Sprint Feature Summary

### Overview

Sprint 6 focuses on hardening the log entry form so that it feels professional, forgiving, and
guiding rather than relying on browser pop-ups and bare HTML controls. All four features address
the gap between the polished visual design already in place and the raw, unpolished data-entry
experience that currently greets users when they open the log modal. A carry-over QA improvement
from Sprint 5 is also included.

---

### Feature A: Character Counters on Task and Notes Inputs

Right now users have no way of knowing how long their text can be before the form rejects it.
This feature adds a small, live counter beneath each text field that shows how many characters
remain out of the allowed maximum. As the user types, the counter updates in real time. When
they get close to the limit (80% used) it turns amber as a gentle warning; at 95% it turns red
as an urgent warning; and at 100% the field is full and the form cannot be submitted until the
text is shortened. This prevents silent failures where a long entry is rejected at submit time
with no indication of what went wrong.

- Task field: maximum 500 characters
- Notes field: maximum 1,000 characters
- Counter format: "[remaining] / [max]" (e.g. "347 / 500")
- Colour states: default -> amber at 80% used -> red at 95% used -> blocked at 100%

---

### Feature B: Live Inline Validation (Replace alert())

Currently, when a user fills in the log entry form incorrectly and clicks Save, a browser alert
pop-up appears with an error message. This is jarring, blocks the whole screen, and gives no
indication of which specific field caused the problem. This feature removes every alert() call
from the validation flow and replaces them with small, clearly worded error messages that appear
directly beneath the problematic field. As soon as the user corrects the input the error
disappears automatically, without needing to click anything. The Save button remains disabled
for as long as any error is visible, so partial or invalid entries can never be accidentally
submitted.

- Error text appears inline, directly beneath the relevant field
- Errors clear automatically when the user's input becomes valid
- No alert(), confirm(), or prompt() calls anywhere in the form
- Submit button is disabled while any error message is visible

---

### Feature C: Category Selector Button-Grid

The category field currently uses a plain browser dropdown (select box). It looks out of place
in the navy-and-gold design and gives no visual indication of what each category means. This
feature replaces the dropdown with a grid of five styled buttons, one per category. Each button
shows a recognisable icon alongside the category name so users can scan and select visually.
When a category is selected its button gets a gold border and navy background to make the
selection unmistakable. The grid is also fully operable with a keyboard: users can tab into it
and select a category with the Enter or Space key.

- Five categories: Seniority, Performance, Awards, Tenure, Veterans Preference
- Each button displays an icon + text label
- Selected state: gold border + navy fill
- Keyboard accessible: Tab to focus, Enter or Space to select
- Visible focus ring required for keyboard navigation

---

### Feature D: Hours Stepper Control

The hours field currently shows a plain number input box. Users can type any number, including
impossible values like "-3" or "0", and there is no guidance on the allowed range or preferred
increment. This feature replaces the raw input with a stepper control: a minus (-) button on
the left, the current value in the centre, and a plus (+) button on the right. Each button
press adjusts the value by 0.25 hours. The displayed value is formatted as a decimal with a
unit label (e.g. "2.50 hrs"). Users can still type a value directly. The minus button is
visually disabled at the minimum (0.25) and the plus button at the maximum (24.00).

- Step increment/decrement: 0.25 hours
- Minimum: 0.25 hours; Maximum: 24.00 hours
- Display format: "X.XX hrs"
- Direct keyboard entry into the value field remains supported
- Minus button visually disabled at minimum; Plus button visually disabled at maximum
- Invalid direct-entry values trigger an inline validation error

---

### Fix: QA Suite Improvements (Sprint 5 Carry-Over)

The automated QA suite produced three false-positive failures in Sprint 5. This fix corrects
the three affected checks so the suite only flags real issues, restoring full confidence in
the QA pass/fail signal.

1. gen.js exclusion: The single-HTML-file architecture check raises a false alarm about gen.js.
   gen.js is a build-time generator, not a runtime dependency, so it is excluded from that
   check the same way sw.js is already excluded.

2. Canvas DOM check scoping: The check that verifies canvas DOM references currently scans the
   entire file and can match references in comments or unrelated functions. It is scoped to
   the body of the drawScoreRingCanvas function only.

3. JSDoc @returns threshold: The minimum @returns JSDoc tag count is raised from 8 to 15 to
   reflect codebase growth and enforce a higher documentation standard.

---

## 2. User Stories

### Feature A — Character Counters

**A-S1** — Federal employee, task field awareness
> As a federal employee logging my daily work, I want to see how many characters I have
> remaining in the task description field as I type, so that I am never surprised by a
> silent rejection when I try to save a long entry.

**A-S2** — Federal employee, colour-coded warning
> As a federal employee writing a detailed task description, I want the character counter
> to change colour as I approach the limit, so that I have advance warning and time to
> edit my text before being blocked from submitting.

**A-S3** — Federal employee, notes field awareness
> As a federal employee writing supporting notes for a log entry, I want a separate
> character counter on the notes field, so that I can write as much contextual detail as
> the field allows without losing text on save.

**A-S4** — Keyboard-only user, real-time updates
> As a keyboard-only user navigating the log form, I want the character counter to update
> with every keystroke without requiring a mouse click or focus change, so that I always
> know my remaining character budget while typing.

---

### Feature B — Live Inline Validation

**B-S1** — Federal employee, targeted error feedback
> As a federal employee filling in the log entry form, I want validation errors to appear
> directly below the field that caused them, so that I can immediately see which specific
> field needs correction without a pop-up dialog covering the rest of the form.

**B-S2** — Federal employee, automatic error recovery
> As a federal employee who has corrected a validation error, I want the error message to
> disappear automatically once my input is valid, so that I can confirm the fix at a glance
> without having to dismiss any dialog.

**B-S3** — Mobile user, unobstructed form view
> As a mobile user filling in the log form on a phone, I want validation errors to appear
> inline rather than as browser alert boxes, so that the error is readable without an alert
> overlay obscuring the form fields behind it.

**B-S4** — Federal employee, submit safety guard
> As a federal employee submitting a log entry, I want the Save button to remain disabled
> while any validation error is present, so that I cannot accidentally submit an
> incomplete or invalid entry.

---

### Feature C — Category Selector Button-Grid

**C-S1** — Federal employee, visual category scanning
> As a federal employee choosing a category for my log entry, I want to see all five
> categories displayed as clearly labelled buttons with icons, so that I can identify
> and select the right category at a glance without opening a dropdown.

**C-S2** — Federal employee, confirmed selection state
> As a federal employee who has selected a category, I want the selected button to appear
> visually distinct from the unselected ones (gold border, navy fill), so that I can
> confirm my selection before saving without rereading a field label.

**C-S3** — Keyboard-only user, full grid navigation
> As a keyboard-only user navigating the log form, I want to tab into the category grid
> and select a category using Enter or Space, so that I can complete the entire form
> without needing a mouse.

**C-S4** — Union rep, category verification
> As a union representative reviewing a colleague's log entry, I want the selected
> category to be immediately and clearly visible in the form, so that I can verify the
> correct RIF protection category was credited without re-interacting with the selector.

---

### Feature D — Hours Stepper Control

**D-S1** — Federal employee, quarter-hour stepping
> As a federal employee logging time spent on an activity, I want to increment or
> decrement the hours value in 0.25-hour steps using plus and minus buttons, so that I
> can accurately record partial hours without manually typing decimal values.

**D-S2** — Federal employee, formatted value display
> As a federal employee reading the hours field, I want the value displayed as a formatted
> decimal with a unit label (e.g. "2.50 hrs"), so that I can verify the logged time at a
> glance without performing mental unit conversion.

**D-S3** — Federal employee, boundary awareness
> As a federal employee using the stepper, I want the plus and minus buttons to appear
> visually disabled when the value reaches the maximum (24.00 hrs) or minimum (0.25 hrs),
> so that I immediately understand I have reached the boundary of the allowed range.

**D-S4** — Keyboard-only user, direct numeric entry
> As a keyboard-only user wanting to enter a specific hours value quickly, I want to type
> a number directly into the hours display field, so that I am not forced to press the
> stepper buttons many times to reach a value like "8.00 hrs".

---

### QA Fix — Suite Improvements

**QA-S1** — Developer running CI checks
> As a developer running the automated QA suite after a sprint, I want the suite to report
> only genuine failures, so that I can trust a PASS result as a true signal of code quality
> and stop dismissing known false positives on every run.

**QA-S2** — QA agent validating documentation coverage
> As the QA agent evaluating JSDoc @returns coverage, I want the threshold to reflect the
> current codebase size, so that the check remains a meaningful quality gate rather than
> one that minimal effort can trivially satisfy.

---

## 3. Acceptance Criteria

---

### A-S1: Federal employee sees remaining characters on task field

Happy path — counter visible on open:
- GIVEN the log entry modal has just been opened
- WHEN the user views the Task Description field before typing anything
- THEN a counter reading "500 / 500" is visible directly below the field

Happy path — counter decrements per keystroke:
- GIVEN the Task Description field is empty, counter reads "500 / 500"
- WHEN the user types exactly 50 characters
- THEN the counter reads "450 / 500", updating in real time with each keystroke

Edge case — no negative count:
- GIVEN the Task Description field contains exactly 500 characters
- WHEN the user attempts to type one more character
- THEN the character is not accepted, counter stays at "0 / 500", no negative value shown

---

### A-S2: Counter changes colour at warning thresholds

Happy path — amber at 80%:
- GIVEN the Task Description counter is in default colour
- WHEN the count reaches 400 characters (80% of 500)
- THEN the counter text changes to amber colour

Happy path — red at 95%:
- GIVEN the counter is amber
- WHEN the count reaches 475 characters (95% of 500)
- THEN the counter text changes to red

Happy path — colour reverts on deletion:
- GIVEN the counter is red (>= 475 chars)
- WHEN the user deletes until count falls below 400
- THEN the counter returns to default colour

Edge case — form blocked at 100%:
- GIVEN the Task Description field contains exactly 500 characters
- WHEN the user attempts to click Save with all other fields valid
- THEN the form does not submit and the Save button remains visually disabled

---

### A-S3: Notes field has its own independent counter

Happy path — separate counter present:
- GIVEN the log entry modal is open
- WHEN the user views the Notes textarea
- THEN a counter reading "1000 / 1000" is visible directly below Notes,
  separate from the Task Description counter

Happy path — counters are independent:
- GIVEN the Task Description counter reads "450 / 500"
- WHEN the user types 200 characters into Notes
- THEN the Notes counter reads "800 / 1000" and the Task counter still reads "450 / 500"

Edge case — Notes thresholds at its own 80% / 95%:
- GIVEN the Notes counter is default colour
- WHEN the user types 800 characters into Notes (80% of 1000)
- THEN the Notes counter turns amber
- WHEN the user types to 950 characters (95% of 1000)
- THEN the Notes counter turns red

---

### A-S4: Counter updates for keyboard-only user

Happy path — updates on every keypress:
- GIVEN the user has tabbed to the Task Description field using only the keyboard
- WHEN the user types characters
- THEN the counter updates with each keypress, no mouse interaction required

Edge case — counter updates after keyboard paste:
- GIVEN the Task Description field is empty
- WHEN the user pastes text via Ctrl+V
- THEN the counter immediately reflects the length of the pasted content

---

### B-S1: Validation error appears inline below the offending field

Happy path — inline error on submit with empty required field:
- GIVEN the log entry modal is open and Task Description is empty
- WHEN the user clicks Save
- THEN an error message (e.g. "Task description is required") appears directly
  below the Task Description field — not in a browser alert dialog

Happy path — correct field identified:
- GIVEN the form has multiple fields and only the Hours field is invalid
- WHEN the user clicks Save
- THEN the error message appears below the Hours field only; no errors appear
  below any other field

Edge case — no alert() dialog ever fires:
- GIVEN the log entry modal contains one or more invalid fields
- WHEN the user clicks Save
- THEN no browser alert(), confirm(), or prompt() dialog appears under any
  circumstances

---

### B-S2: Error clears automatically when user corrects input

Happy path — error disappears on valid correction:
- GIVEN an inline error "Task description is required" is visible below the field
- WHEN the user types valid content into the Task Description field
- THEN the error message disappears automatically without the user dismissing anything

Edge case — error does not flicker on partial fix:
- GIVEN an inline error is visible for Task Description (field empty, min 3 chars)
- WHEN the user types 1 character (still below minimum)
- THEN the error message remains visible and does not flash or briefly disappear

Edge case — error reappears if user re-invalidates:
- GIVEN the user previously cleared an error by entering valid text
- WHEN the user deletes all text making the field invalid again
- THEN the inline error message reappears below the field

---

### B-S3: Mobile user sees inline errors without form obstruction

Happy path — inline error visible on narrow viewport:
- GIVEN the user is viewing the modal on a mobile-width viewport (< 480px)
- WHEN the user submits with an invalid field
- THEN the inline error text is visible below the offending field and the
  rest of the form remains fully visible and scrollable behind it

Edge case — multiple errors visible simultaneously on mobile:
- GIVEN the user submits with Task Description empty and Category unselected
- WHEN both inline errors appear
- THEN both are visible by scrolling the form; neither is hidden behind
  the modal footer or the virtual keyboard

---

### B-S4: Save button disabled while any error is active

Happy path — Save disabled with active error:
- GIVEN at least one inline validation error is currently visible
- WHEN the user attempts to click Save
- THEN Save does not trigger form submission and is visually styled as
  disabled (reduced opacity, cursor: not-allowed)

Happy path — Save re-enables when all errors resolved:
- GIVEN Save is disabled due to one active validation error
- WHEN the user corrects the invalid field so zero error messages are visible
- THEN Save returns to its active enabled state and can submit the form

Edge case — Save remains disabled until ALL errors are cleared:
- GIVEN two errors are visible (Task Description and Category)
- WHEN the user fixes only the Task Description error
- THEN Save remains disabled because the Category error is still visible
- WHEN the user also fixes the Category error
- THEN Save becomes enabled

---

### C-S1: Federal employee sees icon-labelled category buttons

Happy path — grid visible on modal open:
- GIVEN the log entry modal is open
- WHEN the user views the Category section
- THEN exactly five buttons are visible in a grid layout, each displaying
  an icon and a text label: Seniority, Performance, Awards, Tenure, Veterans Preference

Happy path — no dropdown present:
- GIVEN the log entry modal is open
- WHEN the user views the Category section
- THEN no HTML select dropdown element is visible in that area

Edge case — all five buttons always shown:
- GIVEN the log entry modal is open regardless of previous selection history
- WHEN the user views the Category section
- THEN all five category buttons are rendered and visible; none are hidden
  or conditionally suppressed based on context

---

### C-S2: Selected category button appears visually distinct

Happy path — gold border and navy fill on selection:
- GIVEN no category is currently selected (all buttons in unselected state)
- WHEN the user clicks the Seniority button
- THEN the Seniority button immediately shows a gold border and navy background,
  and all other four buttons remain in their unselected visual state

Happy path — only one button selected at a time:
- GIVEN Performance is currently selected (gold border, navy fill)
- WHEN the user clicks the Awards button
- THEN Awards shows the selected state and Performance returns to unselected;
  exactly one button is selected at any moment

Edge case — selection persists after scrolling:
- GIVEN the user has selected Tenure and scrolled the modal up and back down
- WHEN the user returns to the Category section
- THEN the Tenure button still shows the gold border and navy fill

---

### C-S3: Keyboard-only user can navigate and select in the grid

Happy path — Tab navigates into the grid:
- GIVEN the user is navigating the form with the Tab key only
- WHEN Tab focus reaches the Category section
- THEN the first category button receives a visible keyboard focus ring

Happy path — Enter or Space selects focused button:
- GIVEN the Performance category button has keyboard focus (visible focus ring)
- WHEN the user presses Enter or Space
- THEN Performance enters the selected state (gold border, navy fill) and the
  selection is registered for form submission

Edge case — focus ring is visible and meets contrast:
- GIVEN the user has tabbed to any category button
- WHEN that button has keyboard focus
- THEN a clearly visible focus ring (outline or border) is rendered around
  it and is not suppressed or hidden by any CSS rule

---

### C-S4: Union rep can verify selected category at a glance

Happy path — selected category identifiable without interaction:
- GIVEN a log entry has been opened with Veterans Preference as the selected category
- WHEN the reviewer views the Category section
- THEN the Veterans Preference button displays the gold border and navy fill,
  making it immediately identifiable without any click or hover

Edge case — no selection state is also clear:
- GIVEN a form is opened with no category yet selected
- WHEN the reviewer views the Category section
- THEN all five buttons appear unselected; no button misleadingly appears active

---

### D-S1: Federal employee steps hours in 0.25 increments

Happy path — plus button increments by 0.25:
- GIVEN the hours stepper displays "1.00 hrs"
- WHEN the user clicks the plus (+) button once
- THEN the display updates to "1.25 hrs"

Happy path — minus button decrements by 0.25:
- GIVEN the hours stepper displays "2.50 hrs"
- WHEN the user clicks the minus (-) button once
- THEN the display updates to "2.25 hrs"

Edge case — plus button stops at maximum:
- GIVEN the stepper displays "23.75 hrs"
- WHEN the user clicks plus once
- THEN the display updates to "24.00 hrs" and the plus button becomes visually disabled
- WHEN the user clicks plus again
- THEN the value remains "24.00 hrs" and does not increment further

Edge case — minus button stops at minimum:
- GIVEN the stepper displays "0.50 hrs"
- WHEN the user clicks minus once
- THEN the display updates to "0.25 hrs" and the minus button becomes visually disabled
- WHEN the user clicks minus again
- THEN the value remains "0.25 hrs" and does not decrement further

---

### D-S2: Hours displayed as formatted decimal with unit label

Happy path — format is "X.XX hrs":
- GIVEN the stepper value is two and a half hours
- WHEN the user views the hours display
- THEN the text reads "2.50 hrs" (two decimal places + space + "hrs")

Happy path — format applied after direct text entry:
- GIVEN the hours field accepts direct entry
- WHEN the user types "3" and moves focus away
- THEN the displayed value normalises to "3.00 hrs"

Edge case — quarter-hour values display correctly:
- GIVEN the user has stepped to 0.75 hours
- WHEN the user views the display
- THEN the value reads "0.75 hrs" — not "0.7500" or any other format

---

### D-S3: Stepper buttons visually disabled at boundaries

Happy path — minus disabled at minimum:
- GIVEN the stepper displays "0.25 hrs" (the minimum)
- WHEN the user views the stepper
- THEN the minus (-) button is visually styled as disabled (reduced opacity,
  cursor: not-allowed) and clicking it has no effect

Happy path — plus disabled at maximum:
- GIVEN the stepper displays "24.00 hrs" (the maximum)
- WHEN the user views the stepper
- THEN the plus (+) button is visually styled as disabled and clicking has no effect

Edge case — buttons re-enable when stepping away from boundary:
- GIVEN the minus button is disabled at "0.25 hrs"
- WHEN the user clicks plus (incrementing to "0.50 hrs")
- THEN the minus button returns to its active visual state

---

### D-S4: Keyboard-only user can type directly into hours field

Happy path — direct keyboard entry accepted:
- GIVEN the user has tabbed to the hours display field
- WHEN the user types "8"
- THEN the field accepts the input and on focus-loss displays "8.00 hrs",
  without requiring stepper buttons to be used

Edge case — out-of-range direct entry triggers inline error:
- GIVEN the user has typed "-1" directly into the hours field
- WHEN the user moves focus away from the field
- THEN an inline error appears below the field (e.g. "Hours must be between
  0.25 and 24") and the Save button is disabled

Edge case — non-numeric direct entry triggers inline error:
- GIVEN the user types "abc" directly into the hours field
- WHEN the user moves focus away
- THEN an inline error appears (e.g. "Please enter a valid number") and
  the Save button is disabled

---

### QA-S1: QA suite reports only genuine failures after fix

Happy path — gen.js exclusion eliminates false positive:
- GIVEN the updated QA suite is run against the current codebase
- WHEN the single-file architecture check executes
- THEN gen.js does not trigger a failure in that check, consistent with how
  sw.js is already excluded

Happy path — canvas check scoped to correct function:
- GIVEN the QA suite runs the canvas DOM reference check
- WHEN the check executes
- THEN it only inspects the body of the drawScoreRingCanvas function and does
  not flag canvas references found elsewhere in the file as violations

Edge case — false positives eliminated, real failures still caught:
- GIVEN the three fixes are applied to the QA suite
- WHEN a genuine violation is introduced (e.g. a canvas reference outside
  drawScoreRingCanvas)
- THEN the suite still reports that violation as a failure, confirming
  the fix narrowed scope without removing the check entirely

---

### QA-S2: JSDoc @returns threshold reflects codebase size

Happy path — threshold passes at >= 15 documented functions:
- GIVEN the codebase contains 15 or more functions with @returns JSDoc tags
- WHEN the QA suite runs the documentation coverage check
- THEN the check passes with no failure reported

Edge case — threshold fails below 15:
- GIVEN the codebase contains only 14 functions with @returns tags
- WHEN the QA suite runs
- THEN the documentation coverage check reports a failure, confirming
  the higher threshold is enforced

---

## 4. Edge Cases

---

### EC-1: User pastes 600 characters into the 500-character Task Description field

**Scenario:** A user copies a block of text from another document and pastes it into the
Task Description field. The pasted content is 600 characters — 100 over the maximum.

**Expected behaviour:**
- The paste operation is accepted but the field content is truncated to exactly 500 characters.
  The first 500 characters of the pasted text are retained; the excess 100 characters are silently
  dropped. The user is NOT shown a browser alert.
- Alternatively (equally acceptable): the paste is accepted in full and the counter immediately
  shows "0 / 500" in red with an inline error indicating the field exceeds its limit, so the user
  can manually trim the text. The form's Save button is disabled until the count is at or below 500.
- Under no circumstances does the counter display a negative remaining count (e.g. "-100 / 500").
- The counter updates immediately on paste — the user does not need to click or type to see the
  updated count.

**Why this matters:** Federal employees frequently copy task descriptions from email or documents.
A silent truncation or confusing negative counter would corrupt log entries without the user
realising it.

---

### EC-2: User submits the form with no category selected

**Scenario:** A user fills in all other fields correctly (task description, hours, optionally notes)
but never clicks any category button and attempts to save the entry.

**Expected behaviour:**
- When the user clicks Save, an inline validation error appears directly below (or within) the
  Category section. The error message clearly states that a category must be selected
  (e.g. "Please select a category").
- No browser alert() fires.
- The Save button does not submit the form and remains visually disabled.
- The error message remains visible until the user clicks any one of the five category buttons,
  at which point the error clears automatically and the Save button becomes enabled (assuming
  no other errors are present).
- No default category is silently pre-selected on the user's behalf.

**Why this matters:** Category determines which RIF protection score dimension receives credit.
An entry saved without a category would be unscored and useless for the user's protection record.

---

### EC-3: User types 0 or a negative value directly into the hours field

**Scenario A — Zero:** The user clears the hours field and types "0" then moves focus away.
**Scenario B — Negative:** The user types "-2" or "-0.5" into the hours field.
**Scenario C — Zero via stepper:** The user starts at 0.25 (minimum) and attempts to step
down via the minus button.

**Expected behaviour:**
- Scenarios A and B (direct entry): On focus-loss, an inline validation error appears below
  the hours field stating the value is out of range (e.g. "Hours must be between 0.25 and 24").
  The field value is NOT auto-corrected silently. The Save button is disabled until the user
  enters a value within the valid range (0.25 to 24.00).
- Scenario C (stepper): The minus button is already visually disabled at 0.25 hrs. Clicking a
  disabled minus button has no effect — the value stays at 0.25 and no error message appears
  (the disabled state is itself the feedback).
- Under no circumstances can a value of 0 or a negative number be submitted as part of a log entry.

**Why this matters:** Zero or negative hours would corrupt the scoring calculation. The
combination of stepper boundary enforcement and direct-entry validation provides defence in depth.

---

### EC-4: User tabs through the category grid without a mouse

**Scenario:** A keyboard-only user (or a screen reader user) tabs through the form and reaches
the category selector grid. They navigate through all five category buttons using Tab and
Shift+Tab without pressing Enter or Space on any of them, then continue tabbing to the next
field.

**Expected behaviour:**
- Each category button receives visible keyboard focus in sequence as the user tabs through the
  grid. The focus ring is clearly visible on each focused button.
- Tabbing through the buttons without pressing Enter or Space does NOT select any category.
  The buttons' visual selected state (gold border, navy fill) is only triggered by an explicit
  Enter or Space keypress.
- After tabbing past the last category button, focus moves to the next focusable element in the
  form (e.g. the hours stepper or notes field) in a logical tab order.
- If the user later returns to the grid and presses Enter or Space on a button, that button
  becomes selected as expected.
- If the user submits the form without ever pressing Enter or Space on any button, the
  "Please select a category" inline error appears as described in EC-2.

**Why this matters:** Keyboard and assistive-technology users must be able to navigate past
the category grid without accidentally making an unwanted selection. Tab = move focus;
Enter/Space = activate.

---

### EC-5: Validation error appears, user fixes the input — does the error clear?

**Scenario:** An inline validation error is visible below a field (e.g. "Task description is
required" below a blank Task Description field). The user types valid content into that field.

**Expected behaviour:**
- The error message disappears automatically as soon as the user's input transitions from
  invalid to valid — with no extra click, tab, or button press required.
- The error does not wait for the user to attempt Save again before clearing.
- The error does not linger for a timed delay after the input becomes valid.
- If the user makes the field invalid again (e.g. deletes all text), the error reappears
  immediately.
- The Save button re-evaluates its enabled/disabled state each time an error appears or clears;
  it becomes enabled only when zero error messages are visible across the entire form.

**Why this matters:** The core promise of inline validation is that the form responds live to
user corrections. A stale error that requires a re-submit to clear is as jarring as the
original alert() experience and undermines user trust in the UI feedback.

---

### EC-6: User rapidly clicks the plus (+) button on the hours stepper past the maximum (24)

**Scenario:** The hours stepper is at a value near the maximum (e.g. "23.25 hrs"). The user
rapidly clicks the plus (+) button three or more times in quick succession — more clicks than
are needed to reach 24.00.

**Expected behaviour:**
- The value increments correctly with each click: 23.25 -> 23.50 -> 23.75 -> 24.00.
- On reaching 24.00 the plus button immediately becomes visually disabled.
- Any subsequent rapid clicks on the now-disabled plus button have no effect. The value does
  NOT exceed 24.00, does not wrap around to 0, and does not produce a value like "24.25" or
  "25.00".
- No inline error message is shown for attempting to click a disabled button — the disabled
  visual state is sufficient feedback.
- The displayed value "24.00 hrs" remains stable until the user clicks the minus button or
  edits the field directly.

**Why this matters:** Rapid clicking is common on mobile and trackpad devices. The stepper
must enforce the 24-hour ceiling robustly regardless of click speed, preventing impossible
hours values from entering the log and corrupting the scoring calculation.

---

## 5. Out of Scope

The following items are explicitly NOT being built, fixed, or modified in Sprint 6.
Any request to include these during Sprint 6 must be deferred to the appropriate
future sprint and logged as a backlog item.

---

### Form and UI Features NOT in Sprint 6

- **Journal search and filter UI** — The ability to search, sort, or filter existing log
  entries is deferred to Sprint 7. Sprint 6 only improves the entry creation experience.

- **Rich text or markdown formatting in task/notes fields** — Task Description and Notes
  remain plain-text fields. No bold, bullet, or formatting controls are added this sprint.

- **Auto-save or draft functionality** — The log entry modal does not gain auto-save or
  draft recovery in Sprint 6. If the user closes the modal without saving, changes are lost
  as before.

- **Category description tooltips or help text** — Although category buttons gain icons and
  labels, no hover tooltips, popovers, or inline help text explaining what each category
  means are included in Sprint 6.

- **Custom or user-defined categories** — The five categories (Seniority, Performance,
  Awards, Tenure, Veterans Preference) are fixed. No ability to add, rename, or reorder
  categories is in scope.

- **Hours entry in HH:MM time format** — The hours stepper uses decimal format only
  (e.g. "2.50 hrs"). A time-picker (hours and minutes separately) is not in scope.

- **Minimum character enforcement on Task Description** — Sprint 6 only adds a maximum
  character limit with a counter. Enforcing a minimum character count (e.g. at least 10
  characters) is not included unless already present from a prior sprint.

---

### Application Layers NOT in Sprint 6

- **Any backend or API changes** — All Sprint 6 work is confined to the front-end form UI.
  No server-side validation, API endpoint changes, or database schema modifications are made.

- **Any authentication or authorisation changes** — Login flow, session management, JWT
  handling, MFA, RBAC, and SSO/SAML are entirely untouched.

- **Any PWA or Service Worker changes** — The service worker (sw.js), cache versioning,
  offline shell, and install prompt logic are not modified.

- **iOS PWA install fallback** — The Safari/iOS-specific install instructions UI is
  deferred to Sprint 7.

---

### Future Sprint Features

- **Training gap analysis** — Deferred to Sprint 8.
- **Score history chart** — Deferred to Sprint 9.
- **AI chatbot / RAG knowledge integration** — Phase 2 feature, not in Phase 1 scope.
- **Voice log entry** — Phase 2 feature.
- **Geolocation tagging of log entries** — Phase 3 feature.
- **Push notifications or weekly digest** — Phase 3 feature.

---

### Technical Constraints That Are Fixed (Not Negotiable)

The following are constraints, not scope items — they must not be changed as a side-effect
of Sprint 6 work:

- Single HTML file architecture must be preserved.
- No new CDN dependencies may be introduced.
- Navy/Gold design tokens remain the primary palette (amber and red approved for
  validation states only).
- All rendered user input must continue to be passed through escapeHtml().
- All new functions must include JSDoc documentation.
- No alert(), confirm(), or prompt() calls are permitted anywhere in the codebase.

---

## 6. Definition of Done

Sprint 6 is considered complete when ALL of the following conditions are met.
Each item must be independently verifiable by the QA Agent.

---

### Feature A — Character Counters

- [ ] A character counter is visible beneath the Task Description field showing
      remaining characters in the format "[remaining] / 500"
- [ ] A character counter is visible beneath the Notes textarea showing remaining
      characters in the format "[remaining] / 1000"
- [ ] Both counters update in real time with every keystroke and paste event
- [ ] Both counters update correctly after a keyboard paste (Ctrl+V / Cmd+V)
- [ ] Task counter turns amber when Task Description reaches 400 characters (80% of 500)
- [ ] Task counter turns red when Task Description reaches 475 characters (95% of 500)
- [ ] Notes counter turns amber at 800 characters (80% of 1000)
- [ ] Notes counter turns red at 950 characters (95% of 1000)
- [ ] Neither counter displays a negative remaining count under any circumstance
- [ ] The form Save button is disabled when either field is at 100% of its maximum
- [ ] Counter colours revert correctly when the user deletes text below each threshold
- [ ] The two counters are independent — typing in one field does not affect the
      other field's counter

---

### Feature B — Live Inline Validation

- [ ] Zero alert(), confirm(), or prompt() calls exist anywhere in the form codebase
- [ ] Each validation error message appears as inline text directly below the
      specific field it relates to
- [ ] Inline errors appear immediately on a failed save attempt — no page reload needed
- [ ] Each inline error message is descriptive and identifies the specific problem
      (e.g. "Task description is required" not just "Error")
- [ ] Inline errors clear automatically when the user corrects the input — no manual
      dismiss action required
- [ ] Inline errors reappear if the user re-invalidates a previously corrected field
- [ ] The Save button is visually disabled (reduced opacity, cursor: not-allowed)
      while any inline error is visible
- [ ] The Save button re-enables only when all inline errors have been cleared
- [ ] Inline errors are visible and readable on mobile-width viewports (< 480px)
      without any error text being obscured by the modal footer

---

### Feature C — Category Selector Button-Grid

- [ ] The plain HTML select dropdown for Category has been removed from the form
- [ ] Exactly five category buttons are rendered in the Category section:
      Seniority, Performance, Awards, Tenure, Veterans Preference
- [ ] Each button displays both an icon and a text label
- [ ] Clicking a category button applies the selected visual state:
      gold border + navy background fill
- [ ] Only one category button can be in the selected state at any time;
      clicking a new button deselects the previous one
- [ ] The selected state persists visually for the duration of the modal session
- [ ] All five category buttons are reachable via the Tab key
- [ ] A visible focus ring is rendered on the focused button during keyboard navigation
- [ ] Pressing Enter or Space while a button has focus selects that category
- [ ] Tabbing through buttons without pressing Enter/Space does not change the selection
- [ ] Submitting the form without selecting any category triggers an inline validation
      error in the Category section and prevents Save
- [ ] The selected category value is correctly recorded in the log entry on save

---

### Feature D — Hours Stepper Control

- [ ] The plain number input for Hours has been replaced with a stepper control
      consisting of a minus (-) button, a value display, and a plus (+) button
- [ ] The plus button increments the value by exactly 0.25 hours per click
- [ ] The minus button decrements the value by exactly 0.25 hours per click
- [ ] The value is displayed in the format "X.XX hrs" at all times
- [ ] The minimum allowed value is 0.25 hours; the maximum is 24.00 hours
- [ ] The minus button is visually disabled (reduced opacity, cursor: not-allowed)
      when the value is at 0.25 and clicking has no effect
- [ ] The plus button is visually disabled when the value is at 24.00 and clicking
      has no effect
- [ ] Rapidly clicking the plus button cannot push the value above 24.00
- [ ] Rapidly clicking the minus button cannot push the value below 0.25
- [ ] The value field accepts direct keyboard text entry
- [ ] After direct text entry, the value is normalised to "X.XX hrs" format on focus-loss
- [ ] Direct entry of 0, a negative number, or a non-numeric string triggers an inline
      validation error below the hours field
- [ ] Direct entry of a value above 24.00 triggers an inline validation error
- [ ] The hours stepper is navigable and operable via keyboard alone

---

### QA Suite Fix

- [ ] The single-file architecture check excludes gen.js (alongside the existing
      sw.js exclusion) and produces no false-positive failure for gen.js
- [ ] The canvas DOM reference check is scoped to the body of drawScoreRingCanvas
      only and does not flag canvas references found in other parts of the file
- [ ] The JSDoc @returns coverage threshold has been raised from 8 to 15
- [ ] All three previously failing QA checks now pass on the current codebase
- [ ] No previously passing QA checks have been broken by the suite fix changes

---

### Cross-Cutting Quality Gates

- [ ] All new functions introduced in Sprint 6 have JSDoc documentation
      (@param and @returns tags where applicable)
- [ ] All user-supplied input rendered to the DOM continues to pass through escapeHtml()
- [ ] The single HTML file architecture is preserved — no new separate .js or .css
      runtime files have been introduced
- [ ] No new CDN dependencies have been added
- [ ] Navy/Gold design tokens are used throughout; amber and red are used only for
      validation state indicators
- [ ] The full automated QA suite passes with zero failures on the Sprint 6 build
- [ ] The application loads and functions correctly on Chrome, Firefox, and Safari
      (latest stable versions)
- [ ] The application loads and functions correctly on a mobile-width viewport (375px)
- [ ] The git commit for Sprint 6 is tagged and references this PM output document

---

*End of Sprint 6 PM Output — Agent A1*
*Document path: .agents/handoffs/sprint-6-pm-output.md*
