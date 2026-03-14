# Sprint 6 Architecture Specification
## Agent: A2 — Solutions Architect
## Date: 2026-03-14
## Sprint Goal: Form UX Hardening + QA Suite Improvements
## Input Sources: sprint-6-pm-output.md | sprint-6-brief.md | index.html (1,297 lines · 84,817 bytes)

---

## Pre-Implementation Conflicts and Decisions

### CONFLICT-1: Category Element ID Mismatch
- Current HTML: `<select id="log-cat">` (line 353)
- Current JS: `document.getElementById('log-cat')` in `saveLog()` (line 810)
- Sprint spec requires: hidden input `id="log-category"`, grid `id="log-category-grid"`
- Decision: Dev Agent renames all `log-cat` references to `log-category`. Affected locations:
  - HTML `<label for="log-cat">` → `for="category-label"` (label gets `id="category-label"` instead)
  - `saveLog()` `getElementById('log-cat')` → `getElementById('log-category')`
  - `closeLogModal()` reset block

### CONFLICT-2: Category Value Breaking Change (DATA MODEL)
- Current stored values: `exp`, `perf`, `res`, `team`, `train`
- New button-grid data-values: `seniority`, `performance`, `awards`, `tenure`, `veterans`
- Impact surfaces:
  - `catPts` map in `saveLog()` (lines 839-840) — keys must change
  - `catL` lookup object in `renderJournal()` (line 669) — keys must change
  - `data[cat]` write paths in `saveLog()` (line 841) — will write to new keys
  - `MAXES` const keys (`exp`, `perf`, `train`, `res`, `team`) are the SCORE DIMENSION system and are NOT changed in Sprint 6
- Decision: `catPts` and `catL` maps updated to new keys (see §Feature C §3.8). MAXES keys are out of scope.
- SEE RISK 10.4 for legacy data migration concern.

### CONFLICT-3: HTML maxlength Attributes Out of Date
- `id="log-task"` currently has `maxlength="200"` → update to `500` (= TASK_MAX_CHARS)
- `id="log-notes"` currently has `maxlength="500"` → update to `1000` (= NOTES_MAX_CHARS)
- Dev Agent updates both attributes as part of Feature A HTML changes.

### CONFLICT-4: Save Button Has No id Attribute
- Line 357: `<button class="btn btn-p btn-full" onclick="saveLog()">` — no `id` attribute
- Dev Agent MUST add `id="log-save-btn"` to this element before Feature B implementation.

### CONFLICT-5: Validation Uses showToast(), Not alert()
- `saveLog()` uses `showToast()` for validation errors (lines 818, 823, 826, 830, 834) — not `alert()`
- Sprint brief intent is to replace pop-up validation with inline field errors
- Decision: All five validation `showToast()` calls inside `saveLog()` are replaced by `showFieldError()` + `return` pattern
- The success `showToast()` call on save (line 858: `'✓ Entry saved! +N pts'`) is PRESERVED unchanged.

### CONFLICT-6: Hours Reset on Save Uses Hard-Coded String
- Line 853: `if(hoursEl) hoursEl.value = '8';` — hard-coded, bypasses stepper logic
- After Feature D: reset block in `saveLog()` must call `resetHoursStepper()` instead.

---

## 1. Feature A — Character Counters

### 1.1 New Constants
Added to CONSTANTS module (see §7 for full list):
- `TASK_MAX_CHARS = 500`
- `NOTES_MAX_CHARS = 1000`

### 1.2 HTML maxlength Attribute Updates
- `<input id="log-task">`: change `maxlength="200"` to `maxlength="500"`
- `<textarea id="log-notes">`: change `maxlength="500"` to `maxlength="1000"`

### 1.3 New HTML: Counter Elements
Two `<span>` elements inserted **inside** their `.form-group` div, **after** the field element.

**After `<input id="log-task">`, before closing `</div>` of its form-group:**
```html
<span class="char-counter" id="task-char-counter" aria-live="polite">500 / 500</span>
```

**After `<textarea id="log-notes">`, before closing `</div>` of its form-group:**
```html
<span class="char-counter" id="notes-char-counter" aria-live="polite">1000 / 1000</span>
```

- `aria-live="polite"` — screen readers announce counter updates without interrupting
- Initial text content pre-rendered as `{MAX} / {MAX}` (visible immediately on modal open)

### 1.4 CSS Classes (added to `<style>` block, adjacent to `.form-input` rules)

| Class | CSS Declaration |
|---|---|
| `.char-counter` | `display: block; font-size: 11px; text-align: right; margin-top: 3px; color: var(--muted); transition: color .18s;` |
| `.char-counter--warn` | `color: #b45309;` |
| `.char-counter--danger` | `color: #dc2626;` |
| `.char-counter--blocked` | `color: #dc2626; font-weight: 700;` |

Note: `#b45309` (amber) and `#dc2626` (red) are approved for validation states per locked architecture constraints. State modifier classes are mutually exclusive — only one is applied at a time alongside the base `.char-counter` class.

### 1.5 Function: updateCharCounter(inputEl, counterEl, maxLen)

**Signature:**
`updateCharCounter(inputEl, counterEl, maxLen)` → `boolean`

**Parameters:**
- `inputEl` `{HTMLElement}` — The `<input>` or `<textarea>` element being measured
- `counterEl` `{HTMLElement}` — The `span.char-counter` element to update
- `maxLen` `{number}` — Maximum character count (pass `TASK_MAX_CHARS` or `NOTES_MAX_CHARS`)

**Return type:** `boolean` — `true` if field is at or over `maxLen` (blocked); `false` otherwise.

**Logic sequence:**
1. `len = inputEl.value.length`
2. `remaining = Math.max(0, maxLen - len)` — clamped, never negative
3. `counterEl.textContent = remaining + ' / ' + maxLen`
4. Remove all modifier classes: `counterEl.classList.remove('char-counter--warn', 'char-counter--danger', 'char-counter--blocked')`
5. `pct = len / maxLen`
6. Apply single modifier class by threshold:
   - `pct >= 1.0` → add `char-counter--blocked`; return `true`
   - `pct >= 0.95` → add `char-counter--danger`; return `false`
   - `pct >= 0.80` → add `char-counter--warn`; return `false`
   - otherwise → no modifier; return `false`

**JSDoc tags required:** `@param {HTMLElement} inputEl`, `@param {HTMLElement} counterEl`, `@param {number} maxLen`, `@returns {boolean}`

### 1.6 Function: initCharCounters()

**Signature:** `initCharCounters()` → `void`

**Logic sequence:**
1. Obtain element references: `taskEl`, `notesEl`, `taskCounter` (`id="task-char-counter"`), `notesCounter` (`id="notes-char-counter"`)
2. Attach `input` event listener to `taskEl`:
   - calls `updateCharCounter(taskEl, taskCounter, TASK_MAX_CHARS)`
   - calls `updateSaveButtonState()`
3. Attach `input` event listener to `notesEl`:
   - calls `updateCharCounter(notesEl, notesCounter, NOTES_MAX_CHARS)`
   - calls `updateSaveButtonState()`
4. Perform initial render (call both `updateCharCounter()` invocations immediately on init)

**Called from:** `DOMContentLoaded` handler in INITIALIZATION module.
**JSDoc tags required:** `@returns {void}`

### 1.7 Save Button Blocked State Integration
The save button enable/disable is managed exclusively by `updateSaveButtonState()` (§2.5). It is called from within the `input` event listeners attached by `initCharCounters()`. No separate disable logic lives in Feature A.


---

## 2. Feature B — Inline Validation (Replace showToast() Validation)

### 2.1 New HTML: Error Span Elements

Four `<span>` error elements inserted into the form. Each goes **inside** its `.form-group` div, **immediately after** the associated field (or field widget after Features C/D are applied). All are empty and hidden by default.

| Error Element | Insertion Position |
|---|---|
| `<span class="field-error" id="task-error"></span>` | After `<input id="log-task">`, before `<span id="task-char-counter">` |
| `<span class="field-error" id="hours-error"></span>` | After `<div id="hours-stepper-widget">` (Feature D widget) |
| `<span class="field-error" id="category-error"></span>` | After `<div id="log-category-grid">` and hidden `<input id="log-category">` |
| `<span class="field-error" id="notes-error"></span>` | After `<textarea id="log-notes">`, before `<span id="notes-char-counter">` |

### 2.2 Add id to Save Button

Line 357 save button must receive `id="log-save-btn"`:
```html
<button class="btn btn-p btn-full" id="log-save-btn" onclick="saveLog()" style="margin-bottom:10px">&#10003; Save Entry</button>
```

### 2.3 CSS: .field-error (added to `<style>` block, adjacent to `.form-input` rules)

```
.field-error         { display: none; color: #dc2626; font-size: 11px;
                       font-weight: 600; margin-top: 3px; }
.field-error.visible { display: block; }
```

Visibility toggled via `.visible` class (not inline `style.display`), preserving CSS override capability.

### 2.4 Function: showFieldError(fieldId, message)

**Signature:** `showFieldError(fieldId, message)` → `void`

**Parameters:**
- `fieldId` `{string}` — Field base id: one of `'task'`, `'hours'`, `'category'`, `'notes'`
- `message` `{string}` — Human-readable error text

**Logic sequence:**
1. `el = document.getElementById(fieldId + '-error')`
2. Guard: `if (!el) return`
3. `el.textContent = message`
4. `el.classList.add('visible')`
5. Call `updateSaveButtonState()`

**JSDoc tags required:** `@param {string} fieldId`, `@param {string} message`, `@returns {void}`

### 2.5 Function: clearFieldError(fieldId)

**Signature:** `clearFieldError(fieldId)` → `void`

**Parameters:**
- `fieldId` `{string}` — Field base id: one of `'task'`, `'hours'`, `'category'`, `'notes'`

**Logic sequence:**
1. `el = document.getElementById(fieldId + '-error')`
2. Guard: `if (!el) return`
3. `el.classList.remove('visible')`
4. `el.textContent = ''`
5. Call `updateSaveButtonState()`

**JSDoc tags required:** `@param {string} fieldId`, `@returns {void}`

### 2.6 Function: updateSaveButtonState()

**Signature:** `updateSaveButtonState()` → `void`

**Purpose:** Single authority for enabling/disabling `log-save-btn`. Called by `showFieldError()`, `clearFieldError()`, and the `input` event listeners in `initCharCounters()`.

**Logic sequence:**
1. `btn = document.getElementById('log-save-btn')`
2. Guard: `if (!btn) return`
3. `hasErrors = document.querySelectorAll('.field-error.visible').length > 0`
4. `taskCounter  = document.getElementById('task-char-counter')`
5. `notesCounter = document.getElementById('notes-char-counter')`
6. `taskBlocked  = taskCounter  && taskCounter.classList.contains('char-counter--blocked')`
7. `notesBlocked = notesCounter && notesCounter.classList.contains('char-counter--blocked')`
8. If `hasErrors || taskBlocked || notesBlocked`:
   - `btn.disabled = true`
   - `btn.style.opacity = '0.5'`
   - `btn.style.cursor = 'not-allowed'`
9. Else:
   - `btn.disabled = false`
   - `btn.style.opacity = ''`
   - `btn.style.cursor = ''`

**JSDoc tags required:** `@returns {void}`

### 2.7 Function: validateLogForm()

**Signature:** `validateLogForm()` → `boolean`

**Return type:** `boolean` — `true` if ALL validation rules pass; `false` if ANY error was shown.

**Logic sequence:**
1. `isValid = true`
2. Clear all four errors first (fresh validation pass):
   - `clearFieldError('task')`, `clearFieldError('hours')`, `clearFieldError('category')`, `clearFieldError('notes')`
3. **Rule — task required + min length:**
   - `task = document.getElementById('log-task').value.trim()`
   - If `!task || task.length < 3`: `showFieldError('task', 'Task description is required (min 3 characters)')` → `isValid = false`
4. **Rule — task max length** (else-if, only when task is non-empty):
   - If `task.length > TASK_MAX_CHARS`: `showFieldError('task', 'Task is too long (max ' + TASK_MAX_CHARS + ' characters)')` → `isValid = false`
5. **Rule — category required:**
   - `cat = document.getElementById('log-category').value`
   - If `!cat`: `showFieldError('category', 'Please select a category')` → `isValid = false`
6. **Rule — hours range:**
   - `hours = parseFloat(document.getElementById('log-hours').value)`
   - If `isNaN(hours) || hours < HOURS_MIN || hours > HOURS_MAX`: `showFieldError('hours', 'Hours must be between ' + HOURS_MIN + ' and ' + HOURS_MAX)` → `isValid = false`
7. **Rule — notes max length** (optional field, only validate if non-empty):
   - `notes = document.getElementById('log-notes').value.trim()`
   - If `notes.length > NOTES_MAX_CHARS`: `showFieldError('notes', 'Notes are too long (max ' + NOTES_MAX_CHARS + ' characters)')` → `isValid = false`
8. Return `isValid`

**JSDoc tags required:** `@returns {boolean}`

### 2.8 Modifications to saveLog()

`saveLog()` is modified as follows. All other logic (catPts, data write, renderDashboard, success toast) is UNCHANGED.

**Remove:** Lines 817-834 (the five `if` blocks that call `showToast()` and `return`)

**Replace with:**
```
if (!validateLogForm()) return;
```

**Remove:** Lines 813-816 individual field reads (task, cat, hours, notes) — these are now re-read inside `validateLogForm()` and must also be read again locally for the data save. Dev Agent reads them AFTER `validateLogForm()` passes, using the same element IDs.

**Updated catEl reference:** Change `getElementById('log-cat')` → `getElementById('log-category')`

**Updated catPts map** (new category keys replacing old):
```
const catPts = { seniority: 2, performance: 2, awards: 2, tenure: 1, veterans: 1 };
```

**Updated hours reset** (line 853):
- Old: `if(hoursEl) hoursEl.value = '8';`
- New: call `resetHoursStepper()` (defined in Feature D §4.7)

### 2.9 Auto-Clear: input/change Listeners on Each Field

Each field clears its own error on user input. Listeners attached in `initCharCounters()` (for task/notes via `input` event already call `updateSaveButtonState()`). Additional `clearFieldError` listeners:

| Field | Event | Action |
|---|---|---|
| `log-task` | `input` | `clearFieldError('task')` (add alongside existing counter listener in `initCharCounters()`) |
| `log-hours` | `input` and `change` | `clearFieldError('hours')` (attached in `initHoursStepper()`) |
| `log-category` (hidden input) | `change` | `clearFieldError('category')` (dispatched internally by `selectCategory()`) |
| `log-notes` | `input` | `clearFieldError('notes')` (add alongside existing counter listener in `initCharCounters()`) |


---

## 3. Feature C — Category Button-Grid

### 3.1 HTML: Replace `<select id="log-cat">`

**Remove entirely (line 353):**
```html
<div class="form-group"><label class="form-label" for="log-cat">Category</label><select class="form-input" id="log-cat">...</select></div>
```

**Replace with:**
```html
<div class="form-group">
  <label class="form-label" id="category-label">Category</label>
  <div id="log-category-grid" class="cat-grid" role="group" aria-labelledby="category-label">
    <button type="button" class="cat-btn" data-value="seniority"
            role="radio" aria-checked="false" aria-label="Seniority">
      <span class="cat-btn-icon">&#128197;</span>
      <span class="cat-btn-label">Seniority</span>
    </button>
    <button type="button" class="cat-btn" data-value="performance"
            role="radio" aria-checked="false" aria-label="Performance">
      <span class="cat-btn-icon">&#11088;</span>
      <span class="cat-btn-label">Performance</span>
    </button>
    <button type="button" class="cat-btn" data-value="awards"
            role="radio" aria-checked="false" aria-label="Awards">
      <span class="cat-btn-icon">&#127942;</span>
      <span class="cat-btn-label">Awards</span>
    </button>
    <button type="button" class="cat-btn" data-value="tenure"
            role="radio" aria-checked="false" aria-label="Tenure">
      <span class="cat-btn-icon">&#127384;</span>
      <span class="cat-btn-label">Tenure</span>
    </button>
    <button type="button" class="cat-btn" data-value="veterans"
            role="radio" aria-checked="false" aria-label="Veterans Preference">
      <span class="cat-btn-icon">&#129333;</span>
      <span class="cat-btn-label">Veterans</span>
    </button>
  </div>
  <input type="hidden" id="log-category" name="log-category" value="">
  <span class="field-error" id="category-error"></span>
</div>
```

### 3.2 Category Button Definitions

| data-value | aria-label | Icon (emoji codepoint) | Label Text |
|---|---|---|---|
| `seniority` | `Seniority` | `&#128197;` (📅 calendar) | Seniority |
| `performance` | `Performance` | `&#11088;` (⭐ star) | Performance |
| `awards` | `Awards` | `&#127942;` (🏆 trophy) | Awards |
| `tenure` | `Tenure` | `&#127384;` (🎘 medal) | Tenure |
| `veterans` | `Veterans Preference` | `&#129333;` (🫡 salute) | Veterans |

Note: `aria-label` on each button is the full descriptive name. `role="radio"` + `aria-checked` provides ARIA radiogroup semantics. `role="group"` + `aria-labelledby="category-label"` on the container provides group context.

### 3.3 CSS: .cat-grid and .cat-btn (added to `<style>` block)

```
/* Category button grid container */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-top: 4px;
}

/* Base category button */
.cat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  background: #fff;
  color: var(--text);
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color .18s, background .18s, color .18s;
  gap: 4px;
  outline: none;
}

/* Focus ring — keyboard accessibility */
.cat-btn:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}

/* Icon span inside button */
.cat-btn-icon {
  font-size: 18px;
  line-height: 1;
}

/* Label span inside button */
.cat-btn-label {
  font-size: 10px;
  font-weight: 700;
  color: inherit;
  text-align: center;
  line-height: 1.2;
}

/* Selected state: gold border + navy background + white text */
.cat-btn--selected {
  border-color: var(--gold);
  background: var(--navy);
  color: #fff;
}

/* Mobile: stack to 3+2 on very narrow viewports */
@media (max-width: 360px) {
  .cat-grid { grid-template-columns: repeat(3, 1fr); }
}
```

### 3.4 Function: initCategoryGrid()

**Signature:** `initCategoryGrid()` → `void`

**Logic sequence:**
1. `buttons = document.querySelectorAll('#log-category-grid .cat-btn')`
2. For each `btn` in `buttons`:
   a. Add `click` event listener: calls `selectCategory(btn.dataset.value)`
   b. Add `keydown` event listener:
      - If `event.key === 'Enter' || event.key === ' '`: prevent default, call `selectCategory(btn.dataset.value)`
      - Tab key: default browser tab behavior (do NOT intercept — natural tab order through buttons is correct)

**Called from:** `DOMContentLoaded` handler in INITIALIZATION module.
**JSDoc tags required:** `@returns {void}`

### 3.5 Function: selectCategory(value)

**Signature:** `selectCategory(value)` → `void`

**Parameters:**
- `value` `{string}` — The `data-value` of the selected button: one of `'seniority'`, `'performance'`, `'awards'`, `'tenure'`, `'veterans'`

**Logic sequence:**
1. `buttons = document.querySelectorAll('#log-category-grid .cat-btn')`
2. For each `btn` in `buttons`:
   - `btn.classList.remove('cat-btn--selected')`
   - `btn.setAttribute('aria-checked', 'false')`
3. `target = document.querySelector('#log-category-grid .cat-btn[data-value="' + value + '"]')`
4. If `target` exists:
   - `target.classList.add('cat-btn--selected')`
   - `target.setAttribute('aria-checked', 'true')`
5. `hiddenInput = document.getElementById('log-category')`
6. If `hiddenInput`: `hiddenInput.value = value`
7. Call `clearFieldError('category')` — clears any "please select a category" error immediately

**JSDoc tags required:** `@param {string} value`, `@returns {void}`

### 3.6 Function: clearCategoryGrid()

**Signature:** `clearCategoryGrid()` → `void`

**Purpose:** Resets all category buttons to unselected state and clears the hidden input. Called on modal close and form reset.

**Logic sequence:**
1. `buttons = document.querySelectorAll('#log-category-grid .cat-btn')`
2. For each `btn`:
   - `btn.classList.remove('cat-btn--selected')`
   - `btn.setAttribute('aria-checked', 'false')`
3. `hiddenInput = document.getElementById('log-category')`
4. If `hiddenInput`: `hiddenInput.value = ''`

**JSDoc tags required:** `@returns {void}`

### 3.7 Keyboard Navigation Specification

| Key | Behavior |
|---|---|
| `Tab` | Moves focus to next `.cat-btn` in DOM order (browser default — not intercepted) |
| `Shift+Tab` | Moves focus to previous `.cat-btn` (browser default) |
| `Enter` | Selects the focused button (calls `selectCategory`) |
| `Space` | Selects the focused button (calls `selectCategory`) |
| All other keys | No effect on grid |

Tab exits the grid after the last button and enters the next focusable form element (hours stepper decrement button).

### 3.8 Updated catPts and catL Maps in saveLog() and renderJournal()

**saveLog() — replace catPts map:**
```
const catPts = { seniority: 2, performance: 2, awards: 2, tenure: 1, veterans: 1 };
```

**renderJournal() — replace catL lookup (line 669):**
```
const catL = { seniority: 'Seniority', performance: 'Performance',
               awards: 'Awards', tenure: 'Tenure', veterans: 'Veterans' };
```

Note: `data[cat]` writes in `saveLog()` will write to new keys (`data.seniority`, `data.performance`, etc.) which are NOT in the existing `MAXES` const. Dev Agent must add matching entries to the data initialisation block in `loadData()` and bump `_schema` version. See Risk 10.4.


---

## 4. Feature D — Hours Stepper

### 4.1 New Constants
Added to CONSTANTS module (see §7 for full list):
- `HOURS_STEP    = 0.25`
- `HOURS_MIN     = 0.25`
- `HOURS_MAX     = 24`
- `HOURS_DEFAULT = 1.0`

### 4.2 HTML: Replace `<input id="log-hours">`

**Remove (line 355):**
```html
<div class="form-group"><label class="form-label" for="log-hours">Hours worked</label><input class="form-input" id="log-hours" type="number" min="0.5" max="24" step="0.5" value="8" placeholder="8"></div>
```

**Replace with:**
```html
<div class="form-group">
  <label class="form-label" for="log-hours">Hours worked</label>
  <div class="hours-stepper" id="hours-stepper-widget">
    <button type="button" class="hours-btn" id="hours-decrement"
            aria-label="Decrease hours">&#8722;</button>
    <input class="form-input hours-input" id="log-hours"
           type="number" min="0.25" max="24" step="0.25"
           value="1" inputmode="decimal" autocomplete="off">
    <button type="button" class="hours-btn" id="hours-increment"
            aria-label="Increase hours">&#43;</button>
  </div>
  <span class="field-error" id="hours-error"></span>
</div>
```

Key attribute changes from current:
- `min` changes from `0.5` → `0.25` (= HOURS_MIN)
- `step` changes from `0.5` → `0.25` (= HOURS_STEP)
- `value` changes from `8` → `1` (= HOURS_DEFAULT)
- `placeholder` removed (formatted display makes it redundant)
- `id="log-hours"` is PRESERVED — `saveLog()` reads this element ID

### 4.3 CSS: .hours-stepper and .hours-btn (added to `<style>` block)

```
/* Hours stepper composite widget */
.hours-stepper {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

/* Stepper +/- buttons */
.hours-btn {
  width: 40px;
  min-width: 40px;
  height: 40px;
  background: var(--bg);
  border: none;
  border-radius: 0;
  font-size: 20px;
  font-weight: 300;
  color: var(--navy);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .15s, opacity .15s;
  flex-shrink: 0;
}

.hours-btn:active {
  background: var(--border);
}

/* Disabled state for boundary enforcement */
.hours-btn:disabled,
.hours-btn[disabled] {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Inner number input — no borders, flush with stepper */
.hours-input {
  flex: 1;
  border: none !important;
  border-left: 1.5px solid var(--border) !important;
  border-right: 1.5px solid var(--border) !important;
  border-radius: 0 !important;
  text-align: center;
  min-width: 0;
  padding: 10px 4px;
}

/* Remove native number input spinners */
.hours-input::-webkit-inner-spin-button,
.hours-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.hours-input[type=number] { -moz-appearance: textfield; }
```

### 4.4 Function: initHoursStepper()

**Signature:** `initHoursStepper()` → `void`

**Logic sequence:**
1. `decBtn = document.getElementById('hours-decrement')`
2. `incBtn = document.getElementById('hours-increment')`
3. `hoursEl = document.getElementById('log-hours')`
4. Attach `click` listener to `decBtn`: calls `stepHours(-1)`
5. Attach `click` listener to `incBtn`: calls `stepHours(1)`
6. Attach `change` event listener to `hoursEl`:
   - Parse `parseFloat(hoursEl.value)` → `val`
   - If `isNaN(val)`: `showFieldError('hours', 'Please enter a valid number')` → `updateStepperButtonStates()` → return
   - If `val < HOURS_MIN || val > HOURS_MAX`: `showFieldError('hours', 'Hours must be between ' + HOURS_MIN + ' and ' + HOURS_MAX)` → `updateStepperButtonStates()` → return
   - Otherwise: `clearFieldError('hours')`, `hoursEl.value = clampHours(val)`, `updateStepperButtonStates()`
7. Attach `input` listener to `hoursEl`: calls `clearFieldError('hours')`
8. Call `resetHoursStepper()` immediately for initial render

**Called from:** `DOMContentLoaded` handler in INITIALIZATION module.
**JSDoc tags required:** `@returns {void}`

### 4.5 Function: stepHours(direction)

**Signature:** `stepHours(direction)` → `void`

**Parameters:**
- `direction` `{number}` — `1` for increment, `-1` for decrement

**Logic sequence:**
1. `hoursEl = document.getElementById('log-hours')`
2. `current = parseFloat(hoursEl.value) || HOURS_DEFAULT`
3. `next = clampHours(current + direction * HOURS_STEP)`
4. `hoursEl.value = next`
5. Call `updateStepperButtonStates()`
6. Call `clearFieldError('hours')`

**JSDoc tags required:** `@param {number} direction`, `@returns {void}`

### 4.6 Function: clampHours(value)

**Signature:** `clampHours(value)` → `number`

**Parameters:**
- `value` `{number}` — Raw hours value to clamp

**Return type:** `number` — Value clamped to `[HOURS_MIN, HOURS_MAX]`, rounded to 2 decimal places.

**Logic sequence:**
1. `clamped = Math.min(HOURS_MAX, Math.max(HOURS_MIN, value))`
2. Return `Math.round(clamped / HOURS_STEP) * HOURS_STEP` rounded to 2 decimal places via `parseFloat(result.toFixed(2))`

**JSDoc tags required:** `@param {number} value`, `@returns {number}`

### 4.7 Function: updateStepperButtonStates()

**Signature:** `updateStepperButtonStates()` → `void`

**Purpose:** Visually disables/enables the decrement and increment buttons based on current input value versus HOURS_MIN/HOURS_MAX boundaries.

**Logic sequence:**
1. `hoursEl = document.getElementById('log-hours')`
2. `decBtn  = document.getElementById('hours-decrement')`
3. `incBtn  = document.getElementById('hours-increment')`
4. `val = parseFloat(hoursEl.value)`
5. `decBtn.disabled = (!isNaN(val) && val <= HOURS_MIN)`
6. `incBtn.disabled = (!isNaN(val) && val >= HOURS_MAX)`

**JSDoc tags required:** `@returns {void}`

### 4.8 Function: resetHoursStepper()

**Signature:** `resetHoursStepper()` → `void`

**Purpose:** Resets the hours input to `HOURS_DEFAULT` and updates button states. Called by `initHoursStepper()` (initial render) and `closeLogModal()` (form reset).

**Logic sequence:**
1. `hoursEl = document.getElementById('log-hours')`
2. If `hoursEl`: `hoursEl.value = HOURS_DEFAULT`
3. Call `updateStepperButtonStates()`

**JSDoc tags required:** `@returns {void}`

### 4.9 Direct Text Entry Behaviour

- User may type directly into `<input id="log-hours">`
- `input` event: calls `clearFieldError('hours')` only (no clamping during typing)
- `change` event (on focus-loss): validates range, clamps if valid, shows inline error if invalid — as specified in `initHoursStepper()` §4.4 step 6
- The `type="number"` attribute with `min`, `max`, `step` provides native browser constraint hints but is NOT relied upon for validation (JS validation is authoritative)
- Native spinner arrows are hidden via CSS (§4.3) — stepper buttons are the sole stepping UI

### 4.10 Formatted Display Note

The PM output specifies display format `"X.XX hrs"`. However, `<input type="number">` cannot display non-numeric suffix text (`" hrs"`). Resolution:
- The `value` attribute stores the numeric value only (e.g. `1.00`)
- A read-only `<span class="hours-display-label">hrs</span>` is placed **after** the `<input>` but **inside** the `.hours-stepper` div, between the input and the increment button, styled to appear inline at reduced opacity. This provides the unit label without contaminating the numeric field value that `saveLog()` reads via `parseFloat(hoursEl.value)`.
- Alternatively, the label may be placed **after** the `.hours-stepper` widget div as a static text label. Dev Agent chooses the cleaner rendering option.
- `saveLog()` continues to use `parseFloat(hoursEl.value)` — this remains valid.


---

## 5. QA Suite Fixes

### 5.0 QA Suite File

No persistent QA suite Python script currently exists. Dev Agent must CREATE:
`/a0/usr/projects/afge_rif_shield_demo/.agents/qa/qa_suite.py`

This file encodes the three corrected check implementations described below, alongside the existing passing check patterns carried forward from the Sprint 5 QA report. The QA Agent runs this script against `index.html` to produce its audit report.

### 5.1 Fix 1 — gen.js Exclusion from Single-File Architecture Check

**Problem (Sprint 5 FP-1):** The single-file architecture check scans all `.js` files in the project root and flags any file other than `sw.js` as a violation. `gen.js` is a Node.js build-time generator (not a browser runtime file, not referenced in `index.html` or `sw.js`) and triggers a false positive.

**Current check logic (pseudocode):**
```python
js_files = [f for f in os.listdir(project_root) if f.endswith('.js')]
violations = [f for f in js_files if f != 'sw.js']
assert len(violations) == 0
```

**Corrected check logic:**
```python
js_files = [f for f in os.listdir(project_root) if f.endswith('.js')]
violations = [f for f in js_files if f not in ('sw.js', 'gen.js')]
assert len(violations) == 0
```

**Change summary:** Single condition `f != 'sw.js'` replaced with membership test `f not in ('sw.js', 'gen.js')`.

### 5.2 Fix 2 — Canvas DOM Check Scoped to drawScoreRingCanvas Function Body Only

**Problem (Sprint 5 FP-2):** The canvas DOM co-presence check reads the entire file content `c` and tests:
```python
not ('appendChild' in c and 'canvas' in c and 'drawScoreRingCanvas' in c)
```
This fires a false positive because `appendChild` and `canvas` appear in the file (in other functions/comments) alongside the expected `drawScoreRingCanvas` reference.

**Corrected check logic:**
```python
import re

with open(index_html_path, 'r', encoding='utf-8') as fh:
    source = fh.read()

# Extract the body of drawScoreRingCanvas only
match = re.search(
    r'function\s+drawScoreRingCanvas\s*\([^)]*\)\s*\{',
    source
)
if match:
    start = match.end()
    depth = 1
    i = start
    while i < len(source) and depth > 0:
        if source[i] == '{': depth += 1
        elif source[i] == '}': depth -= 1
        i += 1
    fn_body = source[start:i-1]
else:
    fn_body = ''

# Check: canvas must NOT be appended to DOM inside this function
appended_to_dom = 'appendChild' in fn_body and 'canvas' in fn_body.lower()
assert not appended_to_dom, 'canvas is appended to DOM inside drawScoreRingCanvas'
```

**Change summary:** File-wide string scan replaced with brace-matched function body extraction using `re.search()` + depth-counting parser. The check now only inspects `drawScoreRingCanvas` body, not the whole file.

### 5.3 Fix 3 — @returns JSDoc Threshold: 8 → 15

**Problem:** The JSDoc `@returns` coverage check threshold of `>= 8` is too low given codebase growth. Sprint 5 found 39 `@returns` tags. The check no longer serves as a meaningful quality gate.

**Current check logic:**
```python
returns_count = source.count('@returns')
assert returns_count >= 8, f'Only {returns_count} @returns tags found (need >= 8)'
```

**Corrected check logic:**
```python
returns_count = source.count('@returns')
assert returns_count >= 15, f'Only {returns_count} @returns tags found (need >= 15)'
```

**Change summary:** Threshold integer literal changed from `8` to `15`. No other logic changes.

### 5.4 New Sprint 6 QA Checks to Add

The QA Agent for Sprint 6 must add the following new checks to `qa_suite.py` in addition to the three fixes above and all carried-forward Sprint 1-5 checks:

| Check | Pattern |
|---|---|
| CONST: `TASK_MAX_CHARS` present | `'TASK_MAX_CHARS' in source` |
| CONST: `NOTES_MAX_CHARS` present | `'NOTES_MAX_CHARS' in source` |
| CONST: `HOURS_STEP` present | `'HOURS_STEP' in source` |
| CONST: `HOURS_MIN` present | `'HOURS_MIN' in source` |
| CONST: `HOURS_MAX` present | `'HOURS_MAX' in source` |
| CONST: `HOURS_DEFAULT` present | `'HOURS_DEFAULT' in source` |
| HTML: `id="task-char-counter"` | `'id="task-char-counter"' in source` |
| HTML: `id="notes-char-counter"` | `'id="notes-char-counter"' in source` |
| HTML: `id="log-save-btn"` | `'id="log-save-btn"' in source` |
| HTML: `id="log-category-grid"` | `'id="log-category-grid"' in source` |
| HTML: `id="log-category"` (hidden) | `'id="log-category"' in source` |
| HTML: `id="hours-stepper-widget"` | `'id="hours-stepper-widget"' in source` |
| HTML: `id="hours-decrement"` | `'id="hours-decrement"' in source` |
| HTML: `id="hours-increment"` | `'id="hours-increment"' in source` |
| HTML: `id="task-error"` | `'id="task-error"' in source` |
| HTML: `id="hours-error"` | `'id="hours-error"' in source` |
| HTML: `id="category-error"` | `'id="category-error"' in source` |
| HTML: `id="notes-error"` | `'id="notes-error"' in source` |
| FN: `function updateCharCounter` | `'function updateCharCounter' in source` |
| FN: `function initCharCounters` | `'function initCharCounters' in source` |
| FN: `function showFieldError` | `'function showFieldError' in source` |
| FN: `function clearFieldError` | `'function clearFieldError' in source` |
| FN: `function validateLogForm` | `'function validateLogForm' in source` |
| FN: `function updateSaveButtonState` | `'function updateSaveButtonState' in source` |
| FN: `function initCategoryGrid` | `'function initCategoryGrid' in source` |
| FN: `function selectCategory` | `'function selectCategory' in source` |
| FN: `function clearCategoryGrid` | `'function clearCategoryGrid' in source` |
| FN: `function initHoursStepper` | `'function initHoursStepper' in source` |
| FN: `function stepHours` | `'function stepHours' in source` |
| FN: `function clampHours` | `'function clampHours' in source` |
| FN: `function updateStepperButtonStates` | `'function updateStepperButtonStates' in source` |
| FN: `function resetHoursStepper` | `'function resetHoursStepper' in source` |
| CSS: `.char-counter` class | `'.char-counter' in source` |
| CSS: `.char-counter--warn` class | `'.char-counter--warn' in source` |
| CSS: `.char-counter--blocked` class | `'.char-counter--blocked' in source` |
| CSS: `.field-error` class | `'.field-error' in source` |
| CSS: `.cat-grid` class | `'.cat-grid' in source` |
| CSS: `.cat-btn` class | `'.cat-btn' in source` |
| CSS: `.cat-btn--selected` class | `'.cat-btn--selected' in source` |
| CSS: `.hours-stepper` class | `'.hours-stepper' in source` |
| NO alert() calls in form | `'alert(' not in source` (regression — already passing) |
| No `getElementById('log-cat')` remaining | `"getElementById('log-cat')" not in source` |
| INIT: `initCharCounters()` called | `'initCharCounters()' in source` |
| INIT: `initCategoryGrid()` called | `'initCategoryGrid()' in source` |
| INIT: `initHoursStepper()` called | `'initHoursStepper()' in source` |
| JSDOC: `@returns` count >= 15 | `source.count('@returns') >= 15` |


---

## 6. Files to Modify

| File | Section / Location | Change | Reason |
|---|---|---|---|
| `index.html` | `<style>` block — adjacent to `.form-input` rules | Add CSS classes: `.char-counter`, `.char-counter--warn`, `.char-counter--danger`, `.char-counter--blocked`, `.field-error`, `.field-error.visible`, `.cat-grid`, `.cat-btn`, `.cat-btn:focus-visible`, `.cat-btn-icon`, `.cat-btn-label`, `.cat-btn--selected`, `.hours-stepper`, `.hours-btn`, `.hours-btn:disabled`, `.hours-input`, spinner-hide rules, `@media (max-width:360px)` | All Sprint 6 UI features require new CSS |
| `index.html` | CONSTANTS module (lines ~408-476) | Add 6 new constants: `TASK_MAX_CHARS`, `NOTES_MAX_CHARS`, `HOURS_STEP`, `HOURS_MIN`, `HOURS_MAX`, `HOURS_DEFAULT` | Feature A and D constants |
| `index.html` | Log modal HTML (lines 348-358) | (1) Add `id="log-save-btn"` to save button; (2) Replace `<select id="log-cat">` with button-grid + hidden input; (3) Replace `<input id="log-hours">` with stepper widget; (4) Add char counter spans; (5) Add field-error spans; (6) Update `maxlength` on task (200→500) and notes (500→1000); (7) Update label `for` attributes | Features A, B, C, D |
| `index.html` | LOG MODAL module — `openLogModal()` (line ~784) | No body change; label `for="log-cat"` in HTML already removed by Feature C | N/A |
| `index.html` | LOG MODAL module — `closeLogModal()` (line 796) | Augment to call: `clearCategoryGrid()`, `resetHoursStepper()`, clear all `.field-error` elements via `clearFieldError()` x4, reset char counters via `updateCharCounter()` x2, call `updateSaveButtonState()` | Modal Reset §9 |
| `index.html` | LOG MODAL module — `saveLog()` (line 807) | (1) Replace 5 `showToast()` validation calls with `if (!validateLogForm()) return;`; (2) Change `getElementById('log-cat')` → `getElementById('log-category')`; (3) Update `catPts` map to new category keys; (4) Replace hard-coded hours reset with `resetHoursStepper()`; (5) Update JSDoc comment | Features B, C, D |
| `index.html` | JOURNAL module — `renderJournal()` (line ~669) | Update `catL` lookup object to new category key → label pairs | Feature C (CONFLICT-2) |
| `index.html` | DATA module — `loadData()` | Add new category keys to default data object: `seniority: 0`, `performance: 0`, `awards: 0`, `tenure: 0`, `veterans: 0`; bump `_schema` version | Feature C (CONFLICT-2) data model |
| `index.html` | New functions — LOG MODAL module (insert after `saveLog()`, before PDF ENHANCEMENTS module header) | Add 12 new functions: `updateCharCounter`, `initCharCounters`, `showFieldError`, `clearFieldError`, `updateSaveButtonState`, `validateLogForm`, `initCategoryGrid`, `selectCategory`, `clearCategoryGrid`, `initHoursStepper`, `stepHours`, `clampHours`, `updateStepperButtonStates`, `resetHoursStepper` (14 functions total) | All Sprint 6 features |
| `index.html` | INITIALIZATION module — `DOMContentLoaded` handler (line ~1279) | Add calls: `initCharCounters()`, `initCategoryGrid()`, `initHoursStepper()` after existing `initOfflineDetection()` call | Features A, C, D bootstrap |
| `.agents/qa/qa_suite.py` | NEW FILE | Create with: 3 corrected check implementations (§5.1–5.3) + all Sprint 1-5 carried-forward checks + Sprint 6 new checks (§5.4) | QA Suite Fixes + Sprint 6 verification |

---

## 7. New Constants Required

All constants are added to the CONSTANTS module, grouped after the existing `OFFLINE_ONLINE_FLASH_DURATION_MS` constant. Module header comment updated to reflect additions.

```
// ── Form UX Constants (Sprint 6) ──────────────────────────────────────────
const TASK_MAX_CHARS  = 500;   // Maximum characters for task description field
const NOTES_MAX_CHARS = 1000;  // Maximum characters for notes field
const HOURS_STEP      = 0.25;  // Hours stepper increment/decrement step
const HOURS_MIN       = 0.25;  // Minimum allowable hours value
const HOURS_MAX       = 24;    // Maximum allowable hours value
const HOURS_DEFAULT   = 1.0;   // Default hours value on form open/reset
```

Existing constants MUST NOT be modified. Existing `MAXES` const keys (`exp`, `perf`, `train`, `res`, `team`) are unchanged.

---

## 8. Implementation Order

Dev Agent executes changes in the following numbered sequence. Validate `index.html` loads without JS errors after each phase before proceeding.

1. **Add `id="log-save-btn"` to save button** (line 357)
   - Single attribute addition; low risk; required by all subsequent features

2. **Add 6 new constants to CONSTANTS module**
   - `TASK_MAX_CHARS`, `NOTES_MAX_CHARS`, `HOURS_STEP`, `HOURS_MIN`, `HOURS_MAX`, `HOURS_DEFAULT`
   - No functional impact yet; constants must exist before any function references them

3. **Add all new CSS classes to `<style>` block**
   - All `.char-counter*`, `.field-error*`, `.cat-grid`, `.cat-btn*`, `.hours-stepper`, `.hours-btn*`, `.hours-input` rules
   - No functional impact yet; classes must exist before JS applies them

4. **Feature A HTML — update maxlength attributes and add counter spans**
   - Update `log-task` `maxlength` from 200 → 500
   - Update `log-notes` `maxlength` from 500 → 1000
   - Insert `<span id="task-char-counter">` and `<span id="notes-char-counter">`

5. **Feature B HTML — add field-error spans**
   - Insert `<span id="task-error">`, `<span id="hours-error">`, `<span id="category-error">`, `<span id="notes-error">` at correct positions

6. **Feature C HTML — replace category select with button-grid**
   - Remove `<select id="log-cat">` and its containing label
   - Insert button-grid div, all 5 `<button>` elements, hidden `<input id="log-category">`
   - Verify `id="log-cat"` no longer appears anywhere in index.html

7. **Feature D HTML — replace hours input with stepper widget**
   - Remove plain `<input id="log-hours">` and its form-group
   - Insert `.hours-stepper` composite widget preserving `id="log-hours"` on the inner input

8. **Add all 14 new JavaScript functions** (inserted as a single block after `saveLog()`, before the PDF ENHANCEMENTS module banner)
   - Order within the block: `updateCharCounter`, `initCharCounters`, `showFieldError`, `clearFieldError`, `updateSaveButtonState`, `validateLogForm`, `initCategoryGrid`, `selectCategory`, `clearCategoryGrid`, `initHoursStepper`, `stepHours`, `clampHours`, `updateStepperButtonStates`, `resetHoursStepper`
   - Each function must have complete JSDoc block with `@param` and `@returns` tags

9. **Modify saveLog()**
   - Replace 5 `showToast()` validation blocks with `if (!validateLogForm()) return;`
   - Change `getElementById('log-cat')` → `getElementById('log-category')`
   - Update `catPts` map to new keys
   - Replace hours reset line with `resetHoursStepper()`
   - Update JSDoc comment block

10. **Modify renderJournal() — update catL map**
    - Replace `catL` object keys with new category values

11. **Modify loadData() — add new category score keys and bump _schema**
    - Add `seniority: 0`, `performance: 0`, `awards: 0`, `tenure: 0`, `veterans: 0` to default data object
    - Increment `_schema` version integer by 1

12. **Modify closeLogModal() — full reset logic**
    - See §9 for exact additions

13. **Modify INITIALIZATION — add init calls to DOMContentLoaded**
    - Append `initCharCounters()`, `initCategoryGrid()`, `initHoursStepper()` to handler body

14. **Create `.agents/qa/qa_suite.py`**
    - Encode all Sprint 1-5 carried-forward checks
    - Apply 3 corrected check implementations (§5.1-5.3)
    - Add all Sprint 6 new checks (§5.4)


---

## 9. Modal Reset Specification

`closeLogModal()` currently (line 796-798) only removes the `open` class from the modal overlay. After Sprint 6, it must fully reset all form state. The existing `if(m)m.classList.remove('open')` line is PRESERVED; the following calls are appended after it.

### 9.1 Updated closeLogModal() Logic Sequence

```
function closeLogModal() {
  // EXISTING — preserved unchanged
  const m = document.getElementById('log-modal');
  if (m) m.classList.remove('open');

  // SPRINT 6 ADDITIONS — execute in this order:

  // 1. Clear all inline field errors
  clearFieldError('task');
  clearFieldError('hours');
  clearFieldError('category');
  clearFieldError('notes');

  // 2. Reset category grid to unselected state
  clearCategoryGrid();

  // 3. Reset hours stepper to HOURS_DEFAULT
  resetHoursStepper();

  // 4. Reset task and notes text fields
  const taskEl  = document.getElementById('log-task');
  const notesEl = document.getElementById('log-notes');
  if (taskEl)  taskEl.value  = '';
  if (notesEl) notesEl.value = '';

  // 5. Re-render char counters to initial MAX / MAX state
  const taskEl2      = document.getElementById('log-task');
  const notesEl2     = document.getElementById('log-notes');
  const taskCounter  = document.getElementById('task-char-counter');
  const notesCounter = document.getElementById('notes-char-counter');
  if (taskEl2  && taskCounter)  updateCharCounter(taskEl2,  taskCounter,  TASK_MAX_CHARS);
  if (notesEl2 && notesCounter) updateCharCounter(notesEl2, notesCounter, NOTES_MAX_CHARS);

  // 6. Re-evaluate save button state (should re-enable after all clears)
  updateSaveButtonState();
}
```

Note: Steps 4 and 5 may share element references — Dev Agent may combine into fewer `getElementById` calls for efficiency. The logical sequence above is authoritative; variable naming is illustrative.

### 9.2 Reset State Summary

| Element | Reset Value / State |
|---|---|
| `#log-task` value | `''` (empty string) |
| `#task-char-counter` text | `'500 / 500'`; no modifier class |
| `#task-error` | hidden, text cleared |
| `#log-category` hidden input value | `''` |
| `#log-category-grid` buttons | all `aria-checked="false"`, no `.cat-btn--selected` |
| `#category-error` | hidden, text cleared |
| `#log-hours` value | `HOURS_DEFAULT` (1) |
| `#hours-decrement` disabled | `false` (1.0 > HOURS_MIN) |
| `#hours-increment` disabled | `false` (1.0 < HOURS_MAX) |
| `#hours-error` | hidden, text cleared |
| `#log-notes` value | `''` (empty string) |
| `#notes-char-counter` text | `'1000 / 1000'`; no modifier class |
| `#notes-error` | hidden, text cleared |
| `#log-save-btn` disabled | `false`; opacity and cursor restored |

### 9.3 openLogModal() Changes

`openLogModal()` body is NOT changed. The `closeLogModal()` reset ensures the form is clean on every subsequent open. No additional reset logic is needed in `openLogModal()`.

---

## 10. Risks

### 10.1 Keyboard Accessibility on Custom Category Grid

**Risk:** Custom `role="radio"` button grid may not behave as expected by all screen readers. ARIA radio group convention uses arrow keys for navigation between options, but this spec uses Tab + Enter/Space to match the PM output and avoid intercepting arrow keys that users may rely on for scrolling.

**Mitigation:**
- The grid uses `role="group"` + `aria-labelledby` (not `role="radiogroup"`) to avoid triggering screen reader arrow-key navigation expectations
- Each button uses `role="radio"` + `aria-checked` for clear selection state announcement
- `.cat-btn:focus-visible` provides a high-contrast gold outline focus ring
- Tab key naturally sequences through all 5 buttons without custom key handling
- Dev Agent must verify with VoiceOver (Safari/iOS) and NVDA (Chrome/Windows) that button selection announces correctly

**Residual risk level:** Low-Medium. If screen reader testing reveals issues, Coordinator may approve switching to `role="radiogroup"` with arrow-key navigation in a follow-up patch.

### 10.2 Hours Input type=number Formatting Conflicts

**Risk:** `<input type="number">` browsers normalise values differently:
- Chrome/Safari: trailing zeros in `toFixed(2)` may be stripped on display
- Firefox: accepts non-numeric input before `change` fires
- Mobile iOS: shows numeric keypad via `inputmode="decimal"` but value format varies

**Mitigation:**
- `parseFloat(hoursEl.value)` in `saveLog()` is robust to all numeric string formats
- `clampHours()` uses `parseFloat(result.toFixed(2))` to normalise to 2 decimal places
- The `inputmode="decimal"` attribute triggers the correct mobile keyboard without affecting the stored value
- The `" hrs"` display label is a separate `<span>` (see §4.10) — it is NOT part of the input value, avoiding the type=number suffix incompatibility
- Native spinner arrows are suppressed via CSS across Chrome, Firefox, and Safari

**Residual risk level:** Low. The `parseFloat` + `clampHours` pipeline handles all reasonable numeric inputs.

### 10.3 Existing saveLog() References to category/hours Fields

**Risk:** `saveLog()` currently reads `getElementById('log-cat')` (line 810) and `hoursEl.value` as a bare number string. Both change in Sprint 6.

**Mitigation:**
- CONFLICT-1 is fully specified: every `log-cat` reference is explicitly renamed to `log-category`
- `getElementById('log-hours')` ID is PRESERVED on the inner stepper input — `parseFloat(hoursEl.value)` continues to work
- `catPts` map is explicitly updated to new keys (§3.8)
- Hours reset from hard-coded `'8'` to `resetHoursStepper()` is explicitly specified (CONFLICT-6)
- Dev Agent must grep for any remaining `log-cat` strings after implementation and confirm zero results

**Residual risk level:** Low, if CONFLICT-1 remediation is followed precisely.

### 10.4 Category Value Breaking Change — Legacy Data Migration

**Risk:** Existing localStorage entries use `cat` field values of `exp`, `perf`, `res`, `team`, `train`. After Sprint 6, the `catL` lookup will not recognise these old values and will render them as `undefined` in `renderJournal()`. The `data[cat]` score keys also change (e.g. `data.exp` → `data.seniority`), meaning existing score data under old keys is abandoned.

**Mitigation options (Dev Agent chooses one, must be noted in dev output):**
- **Option A (Recommended for Sprint 6):** Add a migration function `migrateDataV2()` called once from `loadData()` when `_schema` version is below new version. Maps old cat values to new: `exp → seniority`, `perf → performance`, `res → awards`, `team → tenure`, `train → veterans`. Rewrites `journal[].cat` and transfers score values. Then increments `_schema`.
- **Option B (Safe fallback):** `catL` retains both old and new key mappings during a transition period. Old cat values render with a legacy label. No score migration performed.

**If Option A is selected**, the data schema version bump and migration function are in scope for Sprint 6 and must be included in the dev output. Dev Agent must flag this choice to Coordinator before implementing.

**Residual risk level:** HIGH if not addressed. Unmitigated, existing users lose their journal category labels and their accumulated score data.

### 10.5 Single-File Architecture Line Count Projection

**Current state:** 1,297 lines · 84,817 bytes

**Sprint 6 additions estimate:**
- New CSS rules: ~70 lines
- New HTML (modal): ~35 lines (net after replacements)
- New JS functions (14 functions, avg ~20 lines each with JSDoc): ~280 lines
- Modified functions (saveLog, closeLogModal, renderJournal, loadData, INIT): ~15 lines net
- QA suite file (separate file, no line count impact on index.html)

**Projected index.html after Sprint 6:** ~1,700 lines · ~108,000 bytes

**Constraint check:** Single HTML file architecture is locked until Sprint 11. At the current growth rate (~100-200 lines/sprint), the file will reach approximately 2,000-2,500 lines by Sprint 11 — manageable within browser parsing limits. No action required this sprint.

**Residual risk level:** Low. No split needed before Sprint 11 per locked architecture decision.

### 10.6 validateLogForm() Called from Both saveLog() and Real-Time Events

**Risk:** `validateLogForm()` clears all errors before re-running rules (step 2 in §2.7). If called from real-time input listeners, it would clear errors on OTHER fields while the user is still editing the first one — poor UX.

**Mitigation:** `validateLogForm()` is called ONLY from `saveLog()` (on save attempt). Real-time error clearing uses `clearFieldError(fieldId)` on a per-field basis from the individual `input`/`change`/`selectCategory` listeners. These are separate code paths. Dev Agent must NOT wire `validateLogForm()` to any real-time event listener.

**Residual risk level:** None, if implementation follows §2.9 Auto-Clear specification.

---

## Document Sign-Off

| Field | Value |
|---|---|
| Output file | `.agents/handoffs/sprint-6-arch-output.md` |
| Agent | A2 — Solutions Architect |
| Status | COMPLETE — ready for Coordinator Gate A review |
| Blocking | Step 3 (Coordinator approval) before Dev Agent (A3) may begin |
| Functions specified | 14 new + 4 modified |
| Constants specified | 6 new |
| CSS classes specified | 13 new |
| HTML element IDs specified | 14 new/changed |
| Files to create | 1 (qa_suite.py) |
| Files to modify | 1 (index.html) |
| Conflicts flagged | 6 |
| Risks flagged | 6 |

*End of Sprint 6 Architecture Specification — Agent A2*
