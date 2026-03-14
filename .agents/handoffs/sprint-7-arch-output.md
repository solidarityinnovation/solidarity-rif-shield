# Sprint 7 Architecture Specification
## Agent: A2 — Solutions Architect
## Date: 2026-03-14
## Sprint Goal: Journal Search, Filters + WCAG/Code Quality Fixes
## Phase: 1 — Core Platform | Sprint 7 of 12
## Input: sprint-7-pm-output.md (A1) | Grep-verified against current index.html + sw.js

---

## Pre-Specification: Grep Verification Summary

All element IDs, line numbers, and function locations verified by live grep against
current source files before this document was written. Line numbers reference
the state of index.html at Sprint 6 commit 2b5f35d.

| Item | File | Line(s) | Status |
|------|------|---------|--------|
| `#journal-list` element | index.html | 324 | Verified |
| `#j-count` span in sec-hd (existing) | index.html | 323 | Verified |
| `function renderJournal()` | index.html | 787–824 | Verified |
| `function openLogModal()` | index.html | 910–913 | Verified |
| `function nav()` journal branch | index.html | 675–676 | Verified |
| `#s-journal` screen div | index.html | 319 | Verified |
| `#log-category-grid` element | index.html | 379 | Verified |
| `CACHE_VERSION` constant | sw.js | 13 | Verified |
| CONSTANTS module header | index.html | 483 | Verified |
| INITIALIZATION DOMContentLoaded | index.html | 1677 | Verified |
| `console.log` to remove | index.html | 1592 | Verified |
| Numeric innerHTML — vitals forEach | index.html | 719 | Verified |
| Numeric innerHTML — vtot score | index.html | 724 | Verified |
| Numeric innerHTML — jsumm (2 values) | index.html | 809 | Verified |

---

## Locked Architecture Constraints (Confirmed No Conflicts)

- Single HTML file PWA: PRESERVED — all new code in index.html only
- Navy #0f1c3f / Gold #c9a227 design tokens: USED for all new CSS
- localStorage primary store: UNCHANGED — filters are in-memory state only
- escapeHtml() mandatory: APPLIED in renderFilteredJournal() on all entry data
- Schema version: NO DATA STRUCTURE CHANGE — no schema bump required
- CDN scripts: NO NEW CDN DEPENDENCIES added
- SW cache name format rif-shield-vN: PRESERVED — bump v2 to v3
- No skipWaiting(): sw.js NOT touched beyond CACHE_VERSION constant

---

## Section 1 — Feature A: Journal Text Search

### 1.1 DOM Insertion Point

Current journal section HTML structure (lines 319–325 of index.html):

```
Line 319: <div class="screen" id="s-journal">
Line 320:   <div class="sec-hd">Daily Journal ... + Log Entry button</div>
Line 321:   <div class="card"> Weekly Activity chart (weekChart canvas) </div>
Line 322:   <div class="card"> Week Summary / #j-summary </div>
Line 323:   <div class="sec-hd"> Recent Entries | <span id="j-count"></span> </div>
Line 324:   <div id="journal-list"> ...existing empty state... </div>
Line 325: </div>  ← closes #s-journal
```

New journal-controls bar inserts **after line 323** and **before line 324**.
The existing `#j-count` span (line 323) is PRESERVED and unchanged —
it continues to show total entry count (e.g. "52 total").
The new `#journal-count` span (inside the new bar) shows filtered count.

### 1.2 New HTML Block (insert between lines 323 and 324)

```html
<div id="journal-controls" class="journal-controls-bar">

  <div class="journal-search-row">
    <input type="search"
           id="journal-search"
           class="journal-search-input"
           aria-label="Search journal entries"
           placeholder="Search tasks and notes..."
           autocomplete="off">
    <span id="journal-count" class="journal-count-label">Showing 0 of 0 entries</span>
  </div>

  <div id="journal-filter-chips"
       class="journal-chip-row"
       role="group"
       aria-label="Filter by category">
    <!-- chips injected by initFilterChips() at DOMContentLoaded -->
  </div>

  <div id="journal-date-filter" class="date-filter-row">
    <label class="date-filter-label" for="journal-date-from">From</label>
    <input type="date"
           id="journal-date-from"
           class="date-filter-input"
           aria-label="Filter from date">
    <label class="date-filter-label" for="journal-date-to">To</label>
    <input type="date"
           id="journal-date-to"
           class="date-filter-input"
           aria-label="Filter to date">
    <button id="journal-date-clear"
            class="btn btn-o btn-sm date-filter-clear"
            onclick="clearDateRangeFilter()">Clear dates</button>
  </div>

</div>
```

Element ID registry for new HTML:

| id | tag | purpose |
|----|-----|---------|
| `journal-controls` | div | outer wrapper for all filter controls |
| `journal-search` | input[type=search] | text search field |
| `journal-count` | span | shows "Showing X of Y entries" |
| `journal-filter-chips` | div[role=group] | chip row container |
| `journal-date-filter` | div | date range row container |
| `journal-date-from` | input[type=date] | from date input |
| `journal-date-to` | input[type=date] | to date input |
| `journal-date-clear` | button | clears both date inputs |
| `journal-clear-all` | button | rendered inside empty state by JS |

### 1.3 New CSS Classes

Add inside the existing `<style>` block, after the last Sprint 6 CSS rule.
All values use only `var(--navy)` and `var(--gold)` tokens.

```css
/* ── JOURNAL CONTROLS BAR (Sprint 7) ─────────────────────── */
.journal-controls-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 8px 0 4px;
  padding: 0 2px;
}
.journal-search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.journal-search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1.5px solid var(--navy);
  border-radius: 8px;
  font-size: 14px;
  color: var(--navy);
  background: #fff;
  outline: none;
}
.journal-search-input:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 2px rgba(201,162,39,.25);
}
.journal-count-label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  white-space: nowrap;
  min-width: 130px;
  text-align: right;
}
.journal-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.filter-chip {
  padding: 4px 12px;
  border-radius: 20px;
  border: 1.5px solid var(--navy);
  background: #fff;
  color: var(--navy);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.filter-chip:focus {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}
.filter-chip--active {
  background: var(--navy);
  color: var(--gold);
  border-color: var(--gold);
}
.chip-count {
  font-weight: 400;
  opacity: .85;
  margin-left: 3px;
}
.date-filter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.date-filter-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--navy);
}
.date-filter-input {
  padding: 6px 8px;
  border: 1.5px solid var(--navy);
  border-radius: 6px;
  font-size: 13px;
  color: var(--navy);
  background: #fff;
  outline: none;
}
.date-filter-input:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 2px rgba(201,162,39,.25);
}
.date-filter-clear { margin-left: auto; }
.journal-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  gap: 12px;
  color: var(--muted);
  text-align: center;
}
.journal-empty-state p { font-size: 14px; margin: 0; }
```

### 1.4 Filter State Variables

Declare as module-level variables at the top of MODULE: JOURNAL FILTERS.
NOT inside any function. NOT const — must be mutable.

```javascript
/** @type {number|null} Timeout ID for debounced journal search input. */
let journalSearchDebounceId = null;

/**
 * Persistent filter state object for the journal screen.
 * Reset to defaults at the start of renderJournal() on every navigation.
 * @type {{query:string, category:string, dateFrom:string, dateTo:string}}
 */
let journalFilterState = {
  query:    '',
  category: 'all',
  dateFrom: '',
  dateTo:   ''
};
```

Field definitions:

| field | type | default | meaning |
|-------|------|---------|----------|
| `query` | string | `''` | raw text from search input; compared case-insensitively |
| `category` | string | `'all'` | active chip value: `'all'` or a category key |
| `dateFrom` | string | `''` | YYYY-MM-DD or empty string (no lower bound) |
| `dateTo` | string | `''` | YYYY-MM-DD or empty string (no upper bound) |


### 1.5 Five New Functions — Feature A

All five functions belong in MODULE: JOURNAL FILTERS (see Section 11).
JSDoc (@param, @returns) required on every function per workflow hard rules.

---

#### Function 1: `applyJournalFilters()`

```
Signature : applyJournalFilters()
Params    : none
Returns   : void
Purpose   : Master filter orchestrator. Reads journalFilterState, applies
            all active predicates to data.journal in sequence, calls
            renderFilteredJournal() with the result.
Calls     : loadData(), renderFilteredJournal(entries)
Called by : renderJournal() [at end, replacing inline list render],
            initJournalSearch() debounce callback,
            selectFilterChip(category),
            clearJournalSearch(),
            clearDateRangeFilter(),
            initDateRangeFilter() change event listeners
```

Exact predicate chain:

```
step 1 : entries = [...data.journal].reverse()   // full set, reverse-chron
step 2 : IF journalFilterState.query non-empty after trim:
           const q = journalFilterState.query.toLowerCase()
           entries = entries.filter(e =>
             e.task.toLowerCase().includes(q) ||
             (e.notes && e.notes.toLowerCase().includes(q))
           )
step 3 : IF journalFilterState.category !== 'all':
           entries = entries.filter(e =>
             e.cat === journalFilterState.category
           )
step 4 : IF journalFilterState.dateFrom non-empty:
           entries = entries.filter(e =>
             e.date >= journalFilterState.dateFrom
           )
step 5 : IF journalFilterState.dateTo non-empty:
           entries = entries.filter(e =>
             e.date <= journalFilterState.dateTo
           )
step 6 : renderFilteredJournal(entries)
```

Date comparison uses lexicographic ISO string ordering (YYYY-MM-DD).
No Date object construction needed. No special handling for From > To —
zero entries will match, Strategy A (PM EC-3 approved).

---

#### Function 2: `renderFilteredJournal(entries)`

```
Signature : renderFilteredJournal(entries)
Params    : entries {Array<Object>} — pre-filtered, pre-reversed journal
                                      entry objects from applyJournalFilters
Returns   : void
Purpose   : Renders entry cards to #journal-list. Updates #journal-count.
            Shows empty state when entries.length === 0 and journal has data.
            Replaces the inline list-render logic currently in renderJournal().
Calls     : loadData() [total count only], updateJournalCount(), escapeHtml()
Called by : applyJournalFilters()
```

Behavior detail:

```
1. const list = document.getElementById('journal-list'); if (!list) return;
2. const data = loadData();
3. const total = data.journal.length;
4. updateJournalCount(entries.length, total);
5. IF entries.length === 0 AND total > 0:
     list.innerHTML = [
       "<div class='journal-empty-state'>",
       "<p>No entries match your search.</p>",
       "<button id='journal-clear-all' class='btn btn-o btn-sm' ",
       "onclick='clearJournalSearch()'>Clear search</button>",
       "</div>"
     ].join('');
   ELSE IF total === 0:
     list.innerHTML = "<div class='empty-state'>" +
       "<div class='es-icon'>&#128221;</div>" +
       "<div class='es-t'>No entries yet</div>" +
       "<div class='es-d'>Tap + Log Entry to record your work</div>" +
       "</div>";
   ELSE:
     list.innerHTML = entries.map(function(e) {
       // [SAME card template as current renderJournal lines 797-804]
       // Dev Agent: copy template verbatim from renderJournal, do NOT redesign
       // All user values MUST use escapeHtml():
       // e.task, e.cat, e.date, e.notes, e.hours
       // NOTE: NO slice(0,30) cap — render ALL entries in filtered set
     }).join('');
```

Entry card template variables (from current renderJournal, lines 791-804):
- `catL` label map: {seniority:'Seniority', performance:'Performance',
  awards:'Awards', tenure:'Tenure', veterans:'Veterans'}
- `cat`   = escapeHtml(catL[e.cat] || e.cat || 'General')
- `task`  = escapeHtml(e.task)
- `notes` = e.notes ? "<div class='je-note'>" + escapeHtml(e.notes) + "</div>" : ''
- `hrs`   = e.hours ? "<span>" + escapeHtml(String(e.hours)) + "h</span>" : ''
- card HTML: "<div class='je'><div class='je-t'>" + task +
  "</div><div class='je-m'><span class='chip chip-b'>" + cat +
  "</span><span>" + escapeHtml(e.date) + "</span>" + hrs +
  "</div>" + notes + "</div>"

---

#### Function 3: `initJournalSearch()`

```
Signature : initJournalSearch()
Params    : none
Returns   : void
Purpose   : Attaches debounced 'input' event listener to #journal-search.
            Debounce delay: JOURNAL_SEARCH_DEBOUNCE_MS (300ms constant).
Calls     : applyJournalFilters()
Called by : DOMContentLoaded block (MODULE: INITIALIZATION, line ~1699)
```

Behavior:

```
1. const el = document.getElementById('journal-search');
2. if (!el) return;
3. el.addEventListener('input', function() {
     clearTimeout(journalSearchDebounceId);
     journalSearchDebounceId = setTimeout(function() {
       journalFilterState.query = el.value;
       applyJournalFilters();
     }, JOURNAL_SEARCH_DEBOUNCE_MS);
   });
```

No per-keystroke DOM modification. All DOM changes happen inside the
setTimeout callback only. This satisfies the constraint from sprint brief.

---

#### Function 4: `clearJournalSearch()`

```
Signature : clearJournalSearch()
Params    : none
Returns   : void
Purpose   : Resets text search state and clears the search input value.
            Called by #journal-clear-all button and openLogModal().
Calls     : applyJournalFilters()
Called by : #journal-clear-all onclick, openLogModal() (see Section 1.6)
```

Behavior:

```
1. journalFilterState.query = '';
2. const el = document.getElementById('journal-search');
3. if (el) el.value = '';
4. applyJournalFilters();
```

Does NOT reset category chip or date range — only clears text search.

---

#### Function 5: `updateJournalCount(shown, total)`

```
Signature : updateJournalCount(shown, total)
Params    : shown {number} — count of entries currently displayed
            total {number} — count of all journal entries (unfiltered)
Returns   : void
Purpose   : Updates #journal-count element text.
Called by : renderFilteredJournal()
```

Behavior:

```
1. const el = document.getElementById('journal-count');
2. if (!el) return;
3. el.textContent = 'Showing ' + shown + ' of ' + total + ' entries';
```

Text format: `"Showing X of Y entries"` — always this exact format.
Examples:
- "Showing 4 of 47 entries"
- "Showing 0 of 52 entries"  (no results)
- "Showing 52 of 52 entries" (no active filter)
- "Showing 0 of 0 entries"   (empty journal)

### 1.6 Modifications to Existing `renderJournal()` (line 787)

Two targeted changes to the existing function body:

**Change A — Add state reset at top of function (after line 788, before list lookup):**

```
BEFORE (line 788, current first line of body):
  const data = loadData();

AFTER (insert BEFORE the const data line):
  // Reset filter state on every journal screen navigation
  journalFilterState = { query: '', category: 'all', dateFrom: '', dateTo: '' };
  const searchEl = document.getElementById('journal-search');
  if (searchEl) searchEl.value = '';
  const fromEl = document.getElementById('journal-date-from');
  if (fromEl) fromEl.value = '';
  const toEl = document.getElementById('journal-date-to');
  if (toEl) toEl.value = '';
  // Reset chip visual state — handled by selectFilterChip('all') call
  selectFilterChip('all');
  const data = loadData();
```

Note: selectFilterChip('all') updates chip aria-pressed and CSS but does NOT
call applyJournalFilters() in this context — the rendering is completed by
Change B below.

**Change B — Replace inline entry render with applyJournalFilters() call:**

Remove the current lines 793–805 (the if/else block that sets list.innerHTML
to either the empty-state or the entries.slice(0,30).map(...) block).

Replace with a single call:

```javascript
applyJournalFilters();
```

The weekly chart section (lines 806–824, from `const today = new Date()` to
the weekChart instantiation) is PRESERVED unchanged.

Result: `renderJournal()` responsibilities after Sprint 7:
1. Reset filter state + UI elements
2. loadData()
3. Update existing #j-count span (keep line: `const jc = document.getElementById('j-count'); if(jc) jc.textContent = entries.length + ' total';`) — this can remain
4. Call applyJournalFilters() (renders list + count)
5. Render weekly chart (unchanged)

### 1.7 Modification to `openLogModal()` (line 910)

Add one line inside `openLogModal()` to satisfy Story A-4 (auto-reset on modal open):

```
BEFORE (current openLogModal body, lines 911-912):
  const m = document.getElementById('log-modal');
  if (m) m.classList.add('open');
  setTimeout(function(){ const t = document.getElementById('log-task'); if(t) t.focus(); }, 200);

AFTER (add clearJournalSearch() call before the modal open):
  clearJournalSearch();
  const m = document.getElementById('log-modal');
  if (m) m.classList.add('open');
  setTimeout(function(){ const t = document.getElementById('log-task'); if(t) t.focus(); }, 200);
```

Note: `clearJournalSearch()` is safe to call from openLogModal() even when
the user is not on the journal screen — it updates DOM elements by ID
(no-op if elements not found) and calls applyJournalFilters() which
also guards against missing #journal-list.


---

## Section 2 — Feature B: Category Filter Chips

### 2.1 HTML Container

Already declared in Section 1.2 as part of `#journal-controls`:

```html
<div id="journal-filter-chips"
     class="journal-chip-row"
     role="group"
     aria-label="Filter by category">
  <!-- chips injected by initFilterChips() at DOMContentLoaded -->
</div>
```

Chips are injected by JavaScript — NOT static HTML.
This allows chip counts to be computed from live data at init time.

### 2.2 Chip HTML Structure

Each chip is a `<button>` element. Template for one chip:

```html
<button class="filter-chip"
        data-category="{categoryValue}"
        aria-pressed="{true|false}">
  {Label} <span class="chip-count">({N})</span>
</button>
```

Six chips in order:

| data-category | Label text | Initial aria-pressed |
|---------------|------------|---------------------|
| `all` | All | `true` |
| `seniority` | Seniority | `false` |
| `performance` | Performance | `false` |
| `awards` | Awards | `false` |
| `tenure` | Tenure | `false` |
| `veterans` | Veterans | `false` |

At init: only the "All" chip has `aria-pressed="true"` and class `filter-chip--active`.
All others have `aria-pressed="false"` and no active class.

### 2.3 Active State Specification

```
Active chip  : class="filter-chip filter-chip--active"  +  aria-pressed="true"
Inactive chip: class="filter-chip"                      +  aria-pressed="false"
```

CSS for `.filter-chip--active` (defined in Section 1.3):
- background: var(--navy)   (dark navy fill)
- color: var(--gold)         (gold text)
- border-color: var(--gold)  (gold border)

Exactly ONE chip has `aria-pressed="true"` at all times.
Re-clicking the already-active chip: no state change, no toggle-off.

### 2.4 Chip Count Badge

```html
<span class="chip-count">(N)</span>
```

- Count is computed from FULL unfiltered `data.journal` at call time
- NEVER from a filtered subset
- Count for "All" chip = `data.journal.length`
- Count for category chip = `data.journal.filter(e => e.cat === cat).length`
- Counts update when a new entry is saved (renderJournal() is called after save,
  which resets state and triggers updateChipCounts())

### 2.5 Three Functions — Feature B

---

#### Function: `initFilterChips()`

```
Signature : initFilterChips()
Params    : none
Returns   : void
Purpose   : Injects chip buttons into #journal-filter-chips, attaches click
            listeners, sets initial aria-pressed state, calls updateChipCounts().
Calls     : updateChipCounts(), selectFilterChip()
Called by : DOMContentLoaded block (MODULE: INITIALIZATION, line ~1699)
```

Behavior:

```
1. const container = document.getElementById('journal-filter-chips');
2. if (!container) return;
3. JOURNAL_FILTER_CATEGORIES.forEach(function(cat) {
     const btn = document.createElement('button');
     btn.className = 'filter-chip';
     btn.dataset.category = cat.value;
     btn.setAttribute('aria-pressed', cat.value === 'all' ? 'true' : 'false');
     btn.innerHTML = cat.label + ' <span class="chip-count">(0)</span>';
     if (cat.value === 'all') btn.classList.add('filter-chip--active');
     btn.addEventListener('click', function() {
       selectFilterChip(cat.value);
     });
     container.appendChild(btn);
   });
4. updateChipCounts();
```

---

#### Function: `updateChipCounts()`

```
Signature : updateChipCounts()
Params    : none
Returns   : void
Purpose   : Recomputes entry counts from FULL unfiltered data.journal and
            updates the chip-count span text inside each chip button.
Calls     : loadData()
Called by : initFilterChips(), renderJournal() [after filter state reset,
            before applyJournalFilters — see Section 1.6]
```

Behavior:

```
1. const data = loadData();
2. const total = data.journal.length;
3. For each chip button in #journal-filter-chips:
     const cat = btn.dataset.category;
     const count = (cat === 'all')
       ? total
       : data.journal.filter(e => e.cat === cat).length;
     const badge = btn.querySelector('.chip-count');
     if (badge) badge.textContent = '(' + count + ')';
```

No DOM rebuild — only updates the text of existing .chip-count spans.

---

#### Function: `selectFilterChip(category)`

```
Signature : selectFilterChip(category)
Params    : category {string} — category value: 'all' or a category key
Returns   : void
Purpose   : Updates journalFilterState.category. Updates aria-pressed on all
            chips. Applies/removes filter-chip--active class. Calls
            applyJournalFilters().
Calls     : applyJournalFilters()
Called by : initFilterChips() click listeners, renderJournal() state reset
```

Behavior:

```
1. journalFilterState.category = category;
2. const buttons = document.querySelectorAll('#journal-filter-chips .filter-chip');
3. buttons.forEach(function(btn) {
     const isActive = (btn.dataset.category === category);
     btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
     btn.classList.toggle('filter-chip--active', isActive);
   });
4. applyJournalFilters();
```

Note: When called from renderJournal() state reset with category='all',
step 4 (applyJournalFilters) is called — this is acceptable because
renderJournal() calls selectFilterChip('all') before calling applyJournalFilters()
directly, so the second call from inside selectFilterChip is redundant but
harmless (renders the same full list). Dev Agent may guard this with a
boolean flag parameter if double-render is a concern, but it is not required.

---

## Section 3 — Feature C: Date Range Filter

### 3.1 HTML Elements

Already declared in Section 1.2 as part of `#journal-controls`.
Date filter container summary:

```
id="journal-date-filter"   class="date-filter-row"   tag=div
id="journal-date-from"     type="date"               input  (from bound)
id="journal-date-to"       type="date"               input  (to bound)
id="journal-date-clear"    class="btn btn-o btn-sm"  button (clears both)
```

### 3.2 Date Comparison Logic

Entry date field format: YYYY-MM-DD string (ISO 8601 date-only).
Input element value format: YYYY-MM-DD string (native date input value).

Comparison method: lexicographic string comparison.
`'2025-03-15' >= '2025-01-01'` evaluates correctly without Date objects.

Predicate (from applyJournalFilters, Section 1.5):
```
IF dateFrom non-empty:  keep e WHERE e.date >= dateFrom
IF dateTo   non-empty:  keep e WHERE e.date <= dateTo
```

Both boundary dates are INCLUSIVE (>= and <=).

Invalid range (From > To): Strategy A — zero results, empty state displayed.
No validation message, no alert(), no console.error(). PM EC-3 approved.

### 3.3 Partial Date Range (One Input Set)

```
Only From set (To is empty):  filter applies lower bound only (no upper limit)
Only To set (From is empty):  filter applies upper bound only (no lower limit)
Neither set:                  no date filter applied (show all dates)
```

This behavior emerges naturally from the conditional checks in applyJournalFilters().

### 3.4 iOS Safari Compatibility Note (Risk — see Section 13)

type="date" inputs are supported on iOS Safari 14.3+. For earlier versions,
the input renders as type="text". The lexicographic comparison still works
correctly if the user types a valid YYYY-MM-DD string. No polyfill required
in Sprint 7. Note in code comment.

### 3.5 Two Functions — Feature C

---

#### Function: `initDateRangeFilter()`

```
Signature : initDateRangeFilter()
Params    : none
Returns   : void
Purpose   : Attaches 'change' event listeners to both date inputs.
            On change, updates journalFilterState and calls applyJournalFilters.
Calls     : applyJournalFilters()
Called by : DOMContentLoaded block (MODULE: INITIALIZATION, line ~1699)
```

Behavior:

```
1. const fromEl = document.getElementById('journal-date-from');
2. const toEl   = document.getElementById('journal-date-to');
3. if (fromEl) {
     fromEl.addEventListener('change', function() {
       journalFilterState.dateFrom = fromEl.value;
       applyJournalFilters();
     });
   }
4. if (toEl) {
     toEl.addEventListener('change', function() {
       journalFilterState.dateTo = toEl.value;
       applyJournalFilters();
     });
   }
```

Note: 'change' event (not 'input') is used for date inputs — 'change' fires
after the user confirms a date selection, which is the correct UX for date pickers.

---

#### Function: `clearDateRangeFilter()`

```
Signature : clearDateRangeFilter()
Params    : none
Returns   : void
Purpose   : Resets both date inputs to empty. Clears dateFrom and dateTo in
            journalFilterState. Calls applyJournalFilters.
Calls     : applyJournalFilters()
Called by : #journal-date-clear onclick="clearDateRangeFilter()"
```

Behavior:

```
1. journalFilterState.dateFrom = '';
2. journalFilterState.dateTo   = '';
3. const fromEl = document.getElementById('journal-date-from');
4. const toEl   = document.getElementById('journal-date-to');
5. if (fromEl) fromEl.value = '';
6. if (toEl)   toEl.value   = '';
7. applyJournalFilters();
```

Safe to call when both inputs are already empty (EC-3 edge case).


---

## Section 4 — Fix 1: SW Cache Version Bump

### File: `sw.js`

```
Line    : 13
BEFORE  : const CACHE_VERSION = 'rif-shield-v2';
AFTER   : const CACHE_VERSION = 'rif-shield-v3';
Change  : String literal only — 'v2' → 'v3'
```

One occurrence. No other changes to sw.js.
No changes to ASSETS array, fetch handler, install handler, or activate handler.

Verification: after deploy, Chrome DevTools > Application > Cache Storage
should show `rif-shield-v3` and `rif-shield-v2` will be deleted on SW activate.

---

## Section 5 — Fix 2: WCAG aria-label on #log-category-grid

### File: `index.html` — Line 379

Current element (line 379):
```html
<div id="log-category-grid" class="cat-grid" role="group" aria-labelledby="category-label">
```

The element already has `role="group"` — no change needed for role.
The existing `aria-labelledby="category-label"` references the `<label>` element
with id="category-label" which contains text "Category".

Required change: replace `aria-labelledby` with `aria-label` to provide
the more descriptive label specified in the sprint brief.

```
BEFORE:
  <div id="log-category-grid" class="cat-grid" role="group" aria-labelledby="category-label">

AFTER:
  <div id="log-category-grid" class="cat-grid" role="group" aria-label="Select activity category">
```

Attribute change: `aria-labelledby="category-label"` → `aria-label="Select activity category"`

Rationale: `aria-label` overrides `aria-labelledby` when both are present, but
using only `aria-label` is cleaner and avoids potential duplicate-label
accessibility checker warnings. The descriptive label "Select activity category"
conveys purpose more explicitly to screen reader users than "Category" alone.

No visual change. No functional change. No JS changes.

---

## Section 6 — Fix 3: Replace Numeric innerHTML with textContent

### Overview

Grep analysis found all innerHTML assignments in index.html.
Four numeric values are currently injected via innerHTML at three code locations.
Fix: wrap numeric values with escapeHtml(String(n)) in their innerHTML context,
or restructure to use textContent where architecturally feasible.

Because all three locations mix numeric values with HTML span elements
(the /max denominator spans), direct textContent replacement is NOT possible
without element restructuring. The correct fix is escapeHtml(String(n))
wrapped around each numeric value — this satisfies the XSS-hardening intent
while preserving the /max span HTML structure.

### Location 1 — Line 719 (vitals forEach loop)

Context: Inside renderDashboard(), a forEach iterates over
[seniority, performance, veterans, awards, tenure] score arrays.

```javascript
// BEFORE (line 719):
if(el)el.innerHTML=v+"<span class='vden'>/"+mx+'</span>';

// AFTER:
if(el)el.innerHTML=escapeHtml(String(v))+"<span class='vden'>/"+escapeHtml(String(mx))+'</span>';
```

Numeric values: `v` (category score integer), `mx` (max points integer).
Both are integers sourced from data fields / constant array — not user input —
but escapeHtml(String()) provides defense-in-depth and satisfies the QA fix.

### Location 2 — Line 724 (total score)

Context: Inside renderDashboard(), sets the total score vitals element.

```javascript
// BEFORE (line 724):
if(vtot)vtot.innerHTML=score+"<span class='vden'>/100</span>";

// AFTER:
if(vtot)vtot.innerHTML=escapeHtml(String(score))+"<span class='vden'>/100</span>";
```

Numeric value: `score` (integer 0–100, result of totalScore(data)).

### Location 3 — Line 809 (weekly summary — thisWeek.length)

Context: Inside renderJournal(), sets the week summary chips element.

```javascript
// BEFORE (line 809):
if(jsumm)jsumm.innerHTML="<span class='chip chip-b'>"+thisWeek.length+" entries this week</span> <span class='chip chip-g'>"+totalHrs.toFixed(1)+'h logged</span>';

// AFTER:
if(jsumm)jsumm.innerHTML="<span class='chip chip-b'>"+escapeHtml(String(thisWeek.length))+" entries this week</span> <span class='chip chip-g'>"+escapeHtml(String(totalHrs.toFixed(1)))+'h logged</span>';
```

Numeric values (counts as TWO fixes, making total = 4 numeric values hardened):
- `thisWeek.length` (integer — entries this week count)
- `totalHrs.toFixed(1)` (string from number — total hours logged)

### Summary Table

| # | Line | Variable | Type | BEFORE | AFTER |
|---|------|----------|------|--------|-------|
| 1 | 719 | `v` | int | `v+"<span...` | `escapeHtml(String(v))+"<span...` |
| 2 | 719 | `mx` | int | `"/"+mx+` | `"/"+escapeHtml(String(mx))+` |
| 3 | 724 | `score` | int | `score+"<span...` | `escapeHtml(String(score))+"<span...` |
| 4a| 809 | `thisWeek.length` | int | direct concat | `escapeHtml(String(...))` |
| 4b| 809 | `totalHrs.toFixed(1)` | str | direct concat | `escapeHtml(String(...))` |

Note: QA Sprint 6 reported "4 numeric innerHTML assignments". This analysis
identifies 4 numeric VALUE insertions via innerHTML at 3 code locations.
Dev Agent should fix all 3 locations (lines 719, 724, 809) in one pass.
No visual or functional change expected.

---

## Section 7 — Fix 4: Remove console.log

### File: `index.html` — Line 1592

Current line 1592:
```javascript
console.log('PWA install choice:', choice.outcome);
```

Context: Inside the PWA `beforeinstallprompt` / install prompt handler.

```
BEFORE (line 1592):
  console.log('PWA install choice:', choice.outcome);

AFTER:
  [line deleted — no replacement]
```

The entire line is removed. No replacement statement.
The surrounding code block continues to function normally.
No functional change to PWA install behavior.

Verification: After fix, `grep -n 'console\.log' index.html` must return zero results.
(`console.warn` and `console.error` are permitted per workflow rules.)

---

## Section 8 — Filter Combination Logic

Complete AND predicate chain in `applyJournalFilters()`. Canonical reference for Dev Agent.

```javascript
function applyJournalFilters() {
  const data = loadData();
  let entries = [...data.journal].reverse();

  // Predicate 1: text search
  const q = journalFilterState.query.trim().toLowerCase();
  if (q) {
    entries = entries.filter(function(e) {
      return e.task.toLowerCase().includes(q) ||
             (e.notes && e.notes.toLowerCase().includes(q));
    });
  }

  // Predicate 2: category chip
  if (journalFilterState.category !== 'all') {
    entries = entries.filter(function(e) {
      return e.cat === journalFilterState.category;
    });
  }

  // Predicate 3: date from (inclusive lower bound)
  if (journalFilterState.dateFrom) {
    entries = entries.filter(function(e) {
      return e.date >= journalFilterState.dateFrom;
    });
  }

  // Predicate 4: date to (inclusive upper bound)
  if (journalFilterState.dateTo) {
    entries = entries.filter(function(e) {
      return e.date <= journalFilterState.dateTo;
    });
  }

  renderFilteredJournal(entries);
}
```

Predicate evaluation order: text search → category → dateFrom → dateTo.
Order does not affect AND result. Text search short-circuits most entries first.
All four predicates are independent. Clearing any one filter does NOT affect others.
---

## Section 9 — New Constants

Add to MODULE: CONSTANTS (after existing constants ~line 507, before next comment block).

```javascript
// ── Sprint 7: Journal filter constants ─────────────────────

/** @constant {number} Debounce delay in ms for journal search input. */
const JOURNAL_SEARCH_DEBOUNCE_MS = 300;

/**
 * Ordered array of category descriptor objects for filter chip rendering.
 * 'all' must be first. Category values match data.journal[].cat field.
 * @constant {Array<{value:string, label:string}>
 */
const JOURNAL_FILTER_CATEGORIES = [
  { value: 'all',         label: 'All'         },
  { value: 'seniority',   label: 'Seniority'   },
  { value: 'performance', label: 'Performance' },
  { value: 'awards',      label: 'Awards'      },
  { value: 'tenure',      label: 'Tenure'      },
  { value: 'veterans',    label: 'Veterans'    }
];
```

Category value order: All, Seniority, Performance, Awards, Tenure, Veterans.
Category values MUST match the `cat` field values in data.journal entries
(verified against migrateDataV2 key map and defaultData() schema in index.html).
---

## Section 10 — Files to Modify

| File | What Changes | Why |
|------|-------------|-----|
| `index.html` | Add CSS classes in `<style>` block | New filter controls styling (Navy/Gold tokens) |
| `index.html` | Add HTML block between lines 323–324 | Journal controls bar: search, chips, date range |
| `index.html` | Add 2 constants in CONSTANTS module (~line 508) | JOURNAL_SEARCH_DEBOUNCE_MS, JOURNAL_FILTER_CATEGORIES |
| `index.html` | Add MODULE: JOURNAL FILTERS header before MODULE: TRAINING (~line 826) | New module scaffold |
| `index.html` | Add 2 state variables in JOURNAL FILTERS module | journalSearchDebounceId, journalFilterState |
| `index.html` | Add 10 new functions in JOURNAL FILTERS module | All filter, chip, search, date, count functions |
| `index.html` | Modify `renderJournal()` lines 787–824 | State reset + replace inline list with applyJournalFilters() |
| `index.html` | Modify `openLogModal()` line 910 | Add clearJournalSearch() call (Story A-4) |
| `index.html` | Modify line 379 — aria attribute on #log-category-grid | Fix 2: WCAG aria-label |
| `index.html` | Modify line 719 — vitals forEach innerHTML | Fix 3: escapeHtml on v, mx |
| `index.html` | Modify line 724 — vtot innerHTML | Fix 3: escapeHtml on score |
| `index.html` | Modify line 809 — jsumm innerHTML | Fix 3: escapeHtml on thisWeek.length, totalHrs |
| `index.html` | Delete line 1592 — console.log | Fix 4: remove debug log |
| `index.html` | Add 3 init calls in DOMContentLoaded (~line 1699) | Bootstrap: initJournalSearch, initFilterChips, initDateRangeFilter |
| `sw.js` | Modify line 13 — CACHE_VERSION value | Fix 1: rif-shield-v2 → rif-shield-v3 |

**Total files modified: 2** (`index.html`, `sw.js`)
No new files created. No files deleted.
---

## Section 11 — New Module Header

Insert immediately BEFORE the current `// MODULE: TRAINING` header (currently line 826).

```javascript
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  MODULE: JOURNAL FILTERS — search, category chips, date range filtering     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
```

Module contents in order (12 items):

1. `let journalSearchDebounceId = null;`
2. `let journalFilterState = { query, category, dateFrom, dateTo };`
3. `function applyJournalFilters()`
4. `function renderFilteredJournal(entries)`
5. `function updateJournalCount(shown, total)`
6. `function initJournalSearch()`
7. `function clearJournalSearch()`
8. `function initFilterChips()`
9. `function updateChipCounts()`
10. `function selectFilterChip(category)`
11. `function initDateRangeFilter()`
12. `function clearDateRangeFilter()`

**Total new functions: 10. Total new state variables: 2.**
---

## Section 12 — Implementation Order

Exact numbered sequence for Dev Agent (A3).
Complete and verify each phase before starting the next.
Read current file state before every edit (workflow hard rule).

### Phase 1 — Zero-Risk Fixes (no JS logic, isolated changes)

- Step 1: `sw.js` line 13 — change CACHE_VERSION from `rif-shield-v2` to `rif-shield-v3`
- Step 2: `index.html` line 1592 — delete the `console.log` line entirely
- Step 3: `index.html` line 379 — replace `aria-labelledby="category-label"` with `aria-label="Select activity category"`
- Step 4: `index.html` line 719 — wrap `v` and `mx` with `escapeHtml(String(n))`
- Step 5: `index.html` line 724 — wrap `score` with `escapeHtml(String(score))`
- Step 6: `index.html` line 809 — wrap `thisWeek.length` and `totalHrs.toFixed(1)` with `escapeHtml(String(n))`

### Phase 2 — Constants (no DOM, no events)

- Step 7: `index.html` CONSTANTS module (~after line 507) — add `JOURNAL_SEARCH_DEBOUNCE_MS = 300`
- Step 8: `index.html` CONSTANTS module — add `JOURNAL_FILTER_CATEGORIES` array

### Phase 3 — New Module Scaffold

- Step 9: `index.html` — insert MODULE: JOURNAL FILTERS header before MODULE: TRAINING (~line 826)
- Step 10: `index.html` — declare `journalSearchDebounceId` and `journalFilterState` module-level variables

### Phase 4 — CSS (visual only, no JS)

- Step 11: `index.html` `<style>` block — add all new CSS classes from Section 1.3
  (.journal-controls-bar, .journal-search-row, .journal-search-input, .journal-count-label,
  .journal-chip-row, .filter-chip, .filter-chip--active, .chip-count,
  .date-filter-row, .date-filter-label, .date-filter-input, .date-filter-clear,
  .journal-empty-state)

### Phase 5 — HTML Structure

- Step 12: `index.html` — insert `#journal-controls` HTML block between lines 323 and 324
  (after the sec-hd "Recent Entries" div, before #journal-list div)

### Phase 6 — Core Filter Functions

- Step 13: implement `applyJournalFilters()` per Section 8 predicate chain
- Step 14: implement `renderFilteredJournal(entries)` per Section 1.5 Function 2
- Step 15: implement `updateJournalCount(shown, total)` per Section 1.5 Function 5
- Step 16: implement `clearJournalSearch()` per Section 1.5 Function 4

### Phase 7 — Feature B: Chip Functions

- Step 17: implement `selectFilterChip(category)` per Section 2.5
- Step 18: implement `updateChipCounts()` per Section 2.5
- Step 19: implement `initFilterChips()` per Section 2.5

### Phase 8 — Feature C: Date Functions

- Step 20: implement `initDateRangeFilter()` per Section 3.5
- Step 21: implement `clearDateRangeFilter()` per Section 3.5

### Phase 9 — Feature A: Search Init

- Step 22: implement `initJournalSearch()` per Section 1.5 Function 3

### Phase 10 — Modify Existing Functions

- Step 23: modify `renderJournal()` — add state reset block at top, replace inline
  list-render block (lines 793–805) with single `applyJournalFilters()` call (Section 1.6)
- Step 24: modify `openLogModal()` — add `clearJournalSearch();` as first line of body (Section 1.7)

### Phase 11 — Wire Initialization

- Step 25: `index.html` DOMContentLoaded block (~line 1699, after `initHoursStepper();`) — add:
  ```
  initJournalSearch();
  initFilterChips();
  initDateRangeFilter();
  ```

### Phase 12 — Verification Grep Checks

- Step 26: verify `grep -n "console.log" index.html` returns zero results
- Step 27: verify `grep -n "CACHE_VERSION" sw.js` shows `rif-shield-v3`
- Step 28: verify `grep -n "log-category-grid" index.html` shows `aria-label`
- Step 29: verify `grep -n "escapeHtml" index.html` includes lines 719, 724, 809
- Step 30: verify `grep -n "journal-search\|journal-count\|journal-controls" index.html` shows new elements
- Step 31: verify `grep -n "initJournalSearch\|initFilterChips\|initDateRangeFilter" index.html` shows init calls
---

## Section 13 — Risks

### Risk 1 — renderJournal() Refactor (HIGH PRIORITY)

**Risk**: Replacing inline list render in renderJournal() with applyJournalFilters() call
may cause a regression if the state reset block runs before chip DOM exists
(e.g., if initFilterChips() has not yet run).

**Mitigation**:
- initFilterChips() runs at DOMContentLoaded — chips exist before any user
  navigates to the journal screen. First renderJournal() via nav() always
  occurs after DOMContentLoaded completes.
- selectFilterChip("all") in the state reset must guard against missing
  #journal-filter-chips (querySelector returns null gracefully).
- Dev Agent MUST test: navigate to journal screen on first app load and verify
  chips render with correct counts and full entry list displays.
- **Behavior change**: The 30-entry slice (entries.slice(0,30)) in current line 796
  is REMOVED in renderFilteredJournal(). All entries now display. This is intentional
  (PM: pagination deferred). Dev Agent must document in sprint-7-dev-output.md.

### Risk 2 — journalFilterState Persistence (SPECIFIED BEHAVIOR)

**Decision**: journalFilterState resets to defaults on EVERY call to renderJournal(),
which is called on EVERY navigation to the journal screen (line 676).

**Behavior**: Filter state does NOT persist across screen navigations.
Returning to journal screen always shows full unfiltered list with "All" chip active.

**Rationale**: Sprint brief explicit requirement: "Filter state resets when journal
screen is navigated away from." PM Out of Scope: "Filter state persistence across
sessions is deferred."

**Future-proofing**: persistence can be added later by extracting the state reset
into a separate resetJournalFilters() function and making it opt-in.

### Risk 3 — Date Input Browser Compatibility (iOS Safari)

**Risk**: `<input type="date">` on iOS Safari older than 14.3 renders as a plain
text input without a native date picker UI. User must type YYYY-MM-DD manually.

**Impact**: Low — RIF Shield targets federal employees on modern devices.

**Mitigation**: Date comparison uses lexicographic string comparison (not Date objects),
so manual YYYY-MM-DD text entry functions correctly if format is valid.
Add a code comment in initDateRangeFilter():
`// type=date falls back to text input on iOS <14.3; YYYY-MM-DD string comparison remains valid`

**Deferred**: Full date picker polyfill is a Sprint 8+ item.

### Risk 4 — Chip Count Performance with Large Journals

**Risk**: updateChipCounts() calls loadData() and iterates data.journal
once per category (6 passes total). At 100 entries: negligible.
At 1,000+ entries: minor latency possible.

**Mitigation**: updateChipCounts() is called only at DOMContentLoaded and during
renderJournal() (screen navigation events). NOT called on every keypress or
filter change. Performance impact is bounded to navigation frequency.
No optimization required in Sprint 7. Single-pass categorization cache
can be added in a later sprint if journal growth warrants it.

### Risk 5 — Double applyJournalFilters() Call on Navigation

**Risk**: renderJournal() state reset calls selectFilterChip("all") which calls
applyJournalFilters(), and then renderJournal() also calls applyJournalFilters()
directly. This causes two consecutive list renders on every journal navigation.

**Mitigation**: The double-render is harmless (identical result both times).
Dev Agent MAY suppress by restructuring renderJournal() to call state reset
helpers that do NOT trigger applyJournalFilters(), then call applyJournalFilters()
once at the end. Both approaches are acceptable for Sprint 7.

### Risk 6 — Existing j-count vs New journal-count (NO CONFLICT)

**Clarification**: These are TWO separate elements with different purposes.

| Element | Location | Content | Updated by |
|---------|----------|---------|------------|
| `#j-count` | line 323, sec-hd | "52 total" (raw total) | renderJournal() — unchanged |
| `#journal-count` | new, inside #journal-controls | "Showing X of Y entries" | updateJournalCount() |

Both elements coexist. j-count continues to work as before. No collision.

---

## Document Summary

| Metric | Count |
|--------|-------|
| New HTML elements | 9 (by id) |
| New CSS classes | 13 |
| New JS constants | 2 |
| New JS state variables | 2 |
| New JS functions | 10 |
| Modified existing functions | 2 (renderJournal, openLogModal) |
| Line-level fixes | 5 lines changed/deleted |
| Files modified | 2 (index.html, sw.js) |
| Implementation steps | 31 |
| New CDN dependencies | 0 |
| Schema version bump | Not required |

---

*Document produced by Agent A2 (Solutions Architect) | AFGE RIF Shield | Sprint 7 | 2026-03-14*
*Next handoff: sprint-7-arch-output.md → Project Coordinator A0 (Gate A review)*