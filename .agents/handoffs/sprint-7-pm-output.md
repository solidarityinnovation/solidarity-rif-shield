# Sprint 7 PM Output
## Agent: A1 — Product Manager
## Date: 2026-03-14
## Sprint Goal: Journal Search, Filters + WCAG/Code Quality Fixes
## Phase: 1 — Core Platform | Sprint 7 of 12

---

## 1. Sprint Feature Summary

### Feature A: Journal Text Search

Federal employees who actively log daily accomplishments will eventually accumulate dozens or hundreds of journal entries. Today the journal section displays every entry in reverse chronological order with no mechanism to locate a specific record. Feature A introduces a real-time text search input positioned above the journal list. As the user types, the list narrows within 300 milliseconds of the last keystroke (debounced) to show only entries where the typed term appears in either the task description or the notes field. Matching is case-insensitive, so "Seniority" and "SENIORITY" both surface the same results.

The interface always shows a running match count — for example "Showing 4 of 47 entries" — so the user knows at a glance how many records match. When no entries match, a clear empty-state message — "No entries match your search" — is displayed alongside a one-click Clear button to restore the full list. The search input resets to blank whenever the log-entry modal is opened, ensuring a clean state each time the user returns to the journal.

### Feature B: Journal Category Filter Chips

Even with text search, a user who wants to review all "Awards" entries before an annual review meeting would need to remember the exact words used in every awards-related entry. Feature B solves this by adding a row of clickable filter chips directly below the search input — one chip per journal category: All | Seniority | Performance | Awards | Tenure | Veterans.

Only one chip can be active at a time. The "All" chip is selected by default and shows the complete unfiltered list. Each category chip displays the number of matching entries in parentheses — for example "Seniority (12)" — so the user can immediately see where their documentation is concentrated. When combined with an active text search, category filtering applies AND logic: an entry must match both the typed term AND belong to the selected category. A union representative can therefore isolate, for example, all "Performance" entries that also mention "telework" with two quick actions.

### Feature C: Journal Date Range Filter

For users preparing documentation ahead of a performance review or a RIF notice deadline, narrowing the journal to a specific time window is critical. Feature C adds two date picker inputs — labeled "From" and "To" — that filter the journal to entries whose date falls within the selected range, inclusive of both boundary dates. A "Clear" button resets both date inputs and immediately restores the full pre-date-filtered list.

The date range filter works in combination with text search and category chips: all three active filters apply simultaneously with AND logic, so the list shows only entries that match the search term, belong to the selected category, AND fall within the date window. The date inputs are styled using the application's Navy/Gold design tokens for visual consistency.

---

### Fix 1: Service Worker Cache Key Bump (rif-shield-v2 to rif-shield-v3)

The service worker caches the application shell (HTML and CSS) so the app works offline. Because HTML and CSS were modified during Sprint 6, the cached version is now stale. Users who installed the app before Sprint 6 may silently be loading outdated assets. Updating the cache key from rif-shield-v2 to rif-shield-v3 forces the browser to treat the new shell as a different resource, discard the outdated cache, and fetch fresh assets on next load. This is a one-constant change in sw.js with no visible UI impact — its effect is silent correctness.

### Fix 2: WCAG aria-label on Category Grid

Screen readers announce interactive elements based on their ARIA role and label. The category selection grid on the log form currently has no semantic grouping, so a screen reader user hears a series of buttons with no context about what the group represents. Adding role="group" and aria-label="Select activity category" to the #log-category-grid container element tells assistive technology that these buttons belong together and describes their collective purpose. There is no visual change — this fix brings the app to WCAG 2.1 AA compliance for form landmark labeling.

### Fix 3: Replace 4 Numeric innerHTML Assignments with textContent

Four locations in the codebase set numeric values (scores or counters) using the innerHTML property. For text-only numeric content, innerHTML is unnecessary and carries a potential XSS risk if a value were ever sourced from user input or an external API in the future. Replacing these four assignments with textContent eliminates the risk and follows established best practice for non-HTML content. There is no visible change to the interface.

### Fix 4: Remove Remaining console.log Call

One console.log call identified during Sprint 6 QA remains in the codebase. Debug log statements in production code expose internal application state to any user who opens browser developer tools — a minor information-disclosure concern and a code quality issue. Removing the call cleans the console output for end users and satisfies the zero-debug-logging standard required before production deployment.


---

## 2. User Stories

### Feature A: Journal Text Search

**Story A-1 — Keyword Lookup (High-Volume User)**
> As a federal employee with over 100 journal entries, I want to type a keyword into a search box and immediately see only entries containing that word in the task or notes field, so that I can locate a specific accomplishment record without scrolling through my entire journal history.

**Story A-2 — Cross-Field Search (Union Rep)**
> As a union representative reviewing a member's journal, I want the search to match text in both the task description and the notes field simultaneously, so that I can surface all entries related to a topic regardless of which field the member used to describe it.

**Story A-3 — Match Count Visibility (Mobile User)**
> As a mobile user with a small screen, I want to see a live count of how many entries match my current search — for example "Showing 3 of 52 entries" — so that I know immediately whether my search is producing useful results without scrolling to the bottom of the list.

**Story A-4 — Auto-Reset on Modal Open (All Users)**
> As a journal user who opens the log-entry modal from the journal screen, I want the search input to reset automatically when the modal opens, so that after saving a new entry and returning to the journal I always see the full unfiltered list rather than a stale search state from a previous session.

---

### Feature B: Journal Category Filter Chips

**Story B-1 — Single-Category Review (Federal Employee)**
> As a federal employee preparing for an annual performance review, I want to click a "Performance" filter chip and see only my performance-related journal entries, so that I can quickly compile evidence for my self-assessment without manually sorting through unrelated entries.

**Story B-2 — Category Entry Counts (All Users)**
> As a federal employee who journals across all five activity categories, I want each filter chip to display the number of entries in that category — for example "Awards (7)" — so that I can see at a glance which categories are well-documented and which need more attention before a review.

**Story B-3 — Screen Reader Chip State (Accessibility)**
> As a screen reader user navigating the journal filters, I want each category chip to announce whether it is currently selected or not, so that I know which filter is active without needing to visually inspect the screen.

**Story B-4 — Combined Category + Text Search (Union Rep)**
> As a union representative performing a targeted lookup, I want to combine a category chip with a text search term — for example filtering to "Veterans" while searching for "disability" — so that I can perform precise cross-dimensional queries on a member's journal in a single interaction.

---

### Feature C: Journal Date Range Filter

**Story C-1 — RIF Notice Time Window (Federal Employee)**
> As a federal employee who received a RIF notice with a specific effective date, I want to filter my journal to entries logged during the 90 days before the notice date, so that I can quickly compile a time-bound evidence package relevant to my retention standing.

**Story C-2 — Quarterly Review Summary (Federal Employee)**
> As a federal employee preparing a quarterly documentation summary, I want to set a From date and a To date and have the journal instantly show only entries within that window, so that I can review my documented accomplishments quarter by quarter without seeing unrelated entries.

**Story C-3 — One-Tap Date Filter Clear (Mobile User)**
> As a mobile user, I want a clearly labeled Clear button next to the date range inputs so that I can reset the date filter and return to the full journal list with a single tap, without needing to manually clear both date fields individually.

**Story C-4 — Triple Filter Combination (Power User / Union Rep)**
> As a union representative performing a detailed journal audit, I want the date range filter to combine with an active text search and a category chip selection simultaneously, so that I can run highly targeted queries — for example all "Seniority" entries mentioning "grade level" logged within a specific six-month window.


---

## 3. Acceptance Criteria

### Story A-1 — Keyword Lookup

**Happy Path**
GIVEN the user is on the Journal screen with 52 entries displayed
WHEN the user types "telework" into the search input
THEN within 300ms after the last keystroke the list updates to show only entries where "telework" appears in the task field or notes field (case-insensitive)
AND the count line reads "Showing X of 52 entries" where X is the correct match count
AND all visible entry cards contain the word "telework" in at least one field

**Failure / No Matches**
GIVEN the user types a term that matches zero entries
WHEN the debounce delay elapses
THEN the journal list area displays the message "No entries match your search"
AND a visible Clear button appears within or adjacent to the empty-state message
AND the count line reads "Showing 0 of 52 entries"
AND no entry cards are rendered in the list

**Edge Case — Search Cleared by Backspace**
GIVEN the user has an active search term producing a filtered list
WHEN the user deletes all characters from the search input
THEN the full unfiltered list restores within 300ms
AND the count line reads "Showing 52 of 52 entries"

---

### Story A-2 — Cross-Field Search

**Happy Path — Match in Task Field**
GIVEN an entry with task "Completed EEO training" and notes "online module"
WHEN the user searches for "EEO"
THEN that entry appears in the filtered results

**Happy Path — Match in Notes Field Only**
GIVEN an entry with task "Quarterly review" and notes "discussed telework arrangement"
WHEN the user searches for "telework"
THEN that entry appears in the filtered results even though the task field does not contain the term

**Edge Case — Case-Insensitive Matching**
GIVEN an entry with task text "Seniority review completed"
WHEN the user searches for "SENIORITY"
THEN that entry appears in the filtered results
AND entries with "seniority", "Seniority", and "SENIORITY" all match equivalently

---

### Story A-3 — Match Count Visibility

**Happy Path**
GIVEN the user has 52 total entries
WHEN the user types a term matching 7 entries
THEN the count line displays "Showing 7 of 52 entries"
AND this count updates correctly each time the debounce fires with a new or changed term

**Edge Case — Single Match**
GIVEN a search term matching exactly 1 entry
WHEN the filter applies
THEN the count line displays "Showing 1 of 52 entries"
AND exactly 1 entry card is visible in the journal list

**Edge Case — All Entries Match**
GIVEN a single-character search term that appears in every entry
WHEN the filter applies
THEN the count line displays "Showing 52 of 52 entries"
AND all 52 entries remain visible

---

### Story A-4 — Auto-Reset on Modal Open

**Happy Path**
GIVEN the user has an active search "overtime" showing 3 results
WHEN the user taps the FAB button to open the log-entry modal
THEN the search input value is cleared to empty string
AND when the user saves the modal and returns to the journal list
THEN the full unfiltered list is displayed
AND the count line reflects the total entry count

**Edge Case — Modal Dismissed Without Saving**
GIVEN the user has an active search "overtime" showing 3 results
WHEN the user opens the modal and then closes it without saving
THEN the search input remains cleared (previous search term is NOT restored)
AND the full unfiltered list is shown upon return

---

### Story B-1 — Single-Category Review

**Happy Path**
GIVEN the user is on the Journal screen with "All" chip selected
WHEN the user clicks the "Performance" chip
THEN the journal list immediately updates to show only entries whose category is "Performance"
AND the "Performance" chip renders in its visually active/selected state
AND the "All" chip renders in its inactive state
AND the count line updates to reflect only the Performance entries visible

**Edge Case — Category with Zero Entries**
GIVEN the user has zero entries in the "Veterans" category
WHEN the journal screen loads
THEN the "Veterans" chip displays "Veterans (0)"
AND clicking that chip shows an empty-state message rather than a blank or broken list

**Edge Case — Clicking the Already-Active Chip**
GIVEN the "Performance" chip is currently active
WHEN the user clicks the "Performance" chip a second time
THEN the chip remains in its active state (single-select; re-clicking does not toggle off)
AND the displayed list content does not change

---

### Story B-2 — Category Entry Counts

**Happy Path**
GIVEN the user has 12 Seniority, 8 Performance, 3 Awards, 0 Tenure, 5 Veterans entries (28 total)
WHEN the journal screen loads
THEN the chips display: "All (28)", "Seniority (12)", "Performance (8)", "Awards (3)", "Tenure (0)", "Veterans (5)"
AND all counts are accurate and match the actual stored entry count per category

**Edge Case — New Entry Added**
GIVEN chip counts are rendered accurately on screen
WHEN the user adds a new "Seniority" entry via the log modal and returns to the journal
THEN the "Seniority" chip count increments by 1
AND the "All" chip count increments by 1
AND no other chip counts change

---

### Story B-3 — Screen Reader Chip State

**Happy Path**
GIVEN a screen reader user navigates to the filter chip row
WHEN focus moves to the "Performance" chip while it is not selected
THEN the screen reader announces the chip label, entry count, and unselected state
(example: "Performance, 8 entries, button, not pressed")
AND when the user activates the chip
THEN the screen reader announces the updated pressed state
(example: "Performance, pressed")

**Accessibility Verification**
GIVEN the filter chip row exists in the DOM
WHEN the page is inspected with an accessibility checker
THEN each chip element has aria-pressed="true" or aria-pressed="false" reflecting its current state
AND exactly one chip has aria-pressed="true" at all times
AND all remaining chips have aria-pressed="false"

---

### Story B-4 — Combined Category + Text Search

**Happy Path — AND Logic**
GIVEN the user has selected the "Veterans" category chip AND typed "disability" in the search input
WHEN both filters are active
THEN the journal list shows only entries that are BOTH categorized as "Veterans" AND contain "disability" in the task or notes field
AND entries matching only the category but not the text are excluded
AND entries matching only the text but not the category are excluded

**Edge Case — Combined Filters Yield Zero Results**
GIVEN category "Awards" is selected and text search "telework" is active
WHEN no Awards entries contain the word "telework"
THEN the empty-state message is displayed
AND the count line reads "Showing 0 of N entries"

---

### Story C-1 — RIF Notice Time Window

**Happy Path**
GIVEN the user sets From date to 2025-10-01 and To date to 2025-12-31
WHEN the date range filter applies
THEN the journal list shows only entries whose date field is on or after 2025-10-01 AND on or before 2025-12-31 (inclusive)
AND entries outside this range are hidden from view
AND the count line updates to reflect the filtered entry count

**Edge Case — Only From Date Set**
GIVEN the user sets a From date but leaves the To date empty
WHEN the filter applies
THEN the list shows all entries on or after the From date with no upper boundary

**Edge Case — Only To Date Set**
GIVEN the user sets a To date but leaves the From date empty
WHEN the filter applies
THEN the list shows all entries on or before the To date with no lower boundary

---

### Story C-2 — Quarterly Review Summary

**Happy Path**
GIVEN the user sets From = 2025-01-01 and To = 2025-03-31
WHEN the filter applies
THEN all entries with dates in Q1 2025 are shown
AND entries dated before 2025-01-01 or after 2025-03-31 are not shown

**Edge Case — Boundary Dates Are Inclusive**
GIVEN an entry dated exactly 2025-01-01 and another dated exactly 2025-03-31
WHEN From = 2025-01-01 and To = 2025-03-31
THEN both boundary-date entries are included in the results

---

### Story C-3 — One-Tap Date Filter Clear

**Happy Path**
GIVEN the user has From = 2025-01-01 and To = 2025-06-30 active
WHEN the user taps the Clear button adjacent to the date inputs
THEN both the From and To date inputs are reset to empty
AND the journal list immediately shows all entries (no date filter active)
AND the count line returns to the total unfiltered entry count

**Edge Case — Clear with No Dates Set**
GIVEN both date inputs are already empty
WHEN the user taps the Clear button
THEN no error occurs
AND the list remains showing all entries

---

### Story C-4 — Triple Filter Combination

**Happy Path — All Three Active**
GIVEN the user has: text search "grade level" active, "Seniority" chip selected, From = 2025-07-01, To = 2025-12-31
WHEN all three filters are applied simultaneously
THEN the list shows only entries that satisfy ALL three conditions:
  (1) contain "grade level" in task or notes
  (2) are categorized as "Seniority"
  (3) have a date between 2025-07-01 and 2025-12-31 inclusive
AND the count line accurately reflects the combined result count

**Edge Case — Clearing One Filter Restores Partial Results**
GIVEN all three filters are active and showing 2 results
WHEN the user clears the text search input
THEN the list expands to show all entries matching the remaining two active filters (category + date range)
AND the count line updates accordingly


---

## 4. Edge Cases

### EC-1: Search Yields No Matching Entries

**Scenario:** The user types a keyword that does not appear in any journal entry's task or notes field.

**Expected Behavior:**
- The journal list area clears all entry cards and displays the message: "No entries match your search."
- A "Clear" button appears inline with or immediately below the empty-state message, allowing the user to reset the search with one click.
- The count line reads "Showing 0 of N entries" where N is the total unfiltered entry count — confirming the search is active and the journal itself is not empty.
- The search input remains populated with the typed term so the user can see what they searched for and edit it without retyping.
- No loading spinner or error state is shown — the empty state renders immediately after the debounce fires.

**Risk if Mishandled:** If the list simply goes blank with no message, the user cannot distinguish between "no results" and a UI failure, leading to confusion and loss of trust in the tool.

---

### EC-2: Category Filter Active While Text Search Is Also Active

**Scenario:** The user has selected the "Performance" category chip AND has typed "telework" in the search input. Both filters are simultaneously active.

**Expected Behavior:**
- AND logic applies: the list shows only entries that are BOTH categorized as "Performance" AND contain "telework" in the task or notes field.
- Neither filter overrides or cancels the other.
- Entries categorized as "Performance" that do NOT contain "telework" are hidden.
- Entries containing "telework" that are NOT in the "Performance" category are hidden.
- The count line reflects the AND-filtered result count.
- If the combined filters return zero results, the empty-state message appears (see EC-1 above).

**Design Decision to Document:** The AND logic behavior must be communicated to the user. The count line format "Showing X of N entries" serves as implicit feedback that multiple filters are narrowing results. No additional "filter badge" or visual indicator is required in Sprint 7, but the behavior must be consistent and predictable.

**Risk if Mishandled:** If OR logic were applied instead, the user would see more results than expected and potentially miss the scoping power of combining filters. AND logic is the only safe default for a documentation tool used in legal/HR proceedings.

---

### EC-3: From Date Is Set to a Date After the To Date

**Scenario:** The user sets From = 2025-12-31 and To = 2025-01-01 — an invalid date range where the start is chronologically after the end.

**Expected Behavior:**
- The application must not crash or produce a JavaScript error.
- Two acceptable resolution strategies (one must be chosen and implemented consistently):
  - **Strategy A — Show Zero Results:** Apply the filter as-is; since no entry can be both on-or-after Dec 31 AND on-or-before Jan 1, the result is zero entries, and the empty-state message appears. The user is responsible for noticing the invalid range.
  - **Strategy B — Inline Validation Warning:** Display a visible inline warning adjacent to the date inputs, such as "From date must be before To date," and do not apply the filter until the range is valid.
- Sprint 7 recommendation: **Strategy A** (zero results + empty state) is simpler to implement and consistent with the debounced, no-alert design philosophy. Strategy B can be added in a later sprint as a UX polish item.
- In either case: no alert() dialogs, no console errors visible to the user, and no application freeze.

**Risk if Mishandled:** An unhandled invalid date comparison could return all entries (if the filter is skipped silently) or crash the filter function, breaking the entire journal list.

---

### EC-4: Journal Is Empty (0 Entries) and User Tries to Search

**Scenario:** A new user who has not yet created any journal entries navigates to the journal screen and types in the search input.

**Expected Behavior:**
- The search input is active and accepts input normally — it is not disabled because the journal is empty.
- The filter function runs on an empty array and returns an empty array.
- The count line reads "Showing 0 of 0 entries."
- The empty-state message displayed should be the zero-entry state appropriate for an empty journal (e.g., "No journal entries yet — tap + to add your first entry") rather than the search-specific "No entries match your search" message, since the absence of results is not caused by the search term.
- Alternatively, if implementation complexity warrants it, showing the search-specific empty state is acceptable in Sprint 7 with a backlog item opened for the nuanced empty-journal vs. no-results distinction.
- The Clear button in the search empty state should still function correctly and clear the search input even when the journal is empty.

**Risk if Mishandled:** Showing "No entries match your search" to a brand-new user who has never logged anything could mislead them into thinking their entries have been lost or filtered away.

---

### EC-5: User Clears Search — Full List Must Restore Instantly

**Scenario:** The user has an active search producing a filtered list and then removes all text from the search input (by selecting all and deleting, or by clicking a clear button).

**Expected Behavior:**
- The full unfiltered list (subject only to any active category chip or date range filter) restores within 300ms — the same debounce window used for narrowing.
- There is no perceptible delay or re-fetch — the restoration is a client-side re-render from the same in-memory data set.
- The count line immediately updates to reflect the unfiltered (or category/date-only-filtered) entry count.
- If a category chip or date range filter is still active, the restored list reflects only those remaining active filters — clearing the text search does not reset the other filters.
- The search input shows no placeholder ghost text from the previous term — the field is visually clean and empty.

**Risk if Mishandled:** Any perceptible lag when clearing the search would feel broken on mobile devices. The instant-restore behavior is a key quality signal for perceived performance.

---

### EC-6: All Three Filters Active Simultaneously

**Scenario:** The user has a text search term typed, a category chip selected, AND a From/To date range set — all three filters are active at once.

**Expected Behavior:**
- All three filters apply with AND logic in a defined evaluation order (recommended: text search first as cheapest, then category, then date range — though the result is identical regardless of order).
- An entry must satisfy ALL three conditions to appear in the list.
- The count line accurately reflects the triple-filtered result count.
- Clearing any single filter (e.g., removing the text from the search input, clicking "All" chip, or clicking the date Clear button) immediately re-evaluates with the two remaining active filters.
- Clearing all three filters (text cleared + All chip selected + date range cleared) restores the complete unfiltered list.
- The UI does not provide an explicit "active filters" summary panel in Sprint 7 — the combination of the count line, visually active chip, and populated date inputs serves as sufficient filter-state feedback.
- No maximum limit is imposed on how many times the user can switch between filter combinations in a single session.

**Risk if Mishandled:** If filter state is not managed as independent composable predicates, certain combinations may produce incorrect results — for example, a category filter change that inadvertently resets the date range. All three filter states must be stored and evaluated independently.


---

## 5. Out of Scope

The following items are explicitly excluded from Sprint 7. Any implementation of these items in this sprint would be considered scope creep and must be rejected during code review and QA.

### Journal Functionality
- **Journal entry editing:** Existing entries cannot be modified after saving. Edit capability is deferred to a future sprint.
- **Journal entry deletion:** No mechanism to delete individual entries is included in Sprint 7.
- **Journal entry export filtered by search/category/date:** Exporting a filtered subset of the journal to PDF is deferred to Sprint 8. The existing full-journal PDF export (if present) is unaffected.
- **Pagination of journal results:** All matching entries are displayed in a single scrollable list. Paginated navigation (page 1 of N, load more, infinite scroll) is deferred until a backend API is available (Sprint 10).
- **Saved or pinned search presets:** Users cannot save a named search configuration (e.g., "My Q1 2025 Performance entries") for later reuse. This feature is deferred.
- **Sort order toggle:** The journal list remains in reverse chronological order only. A toggle to switch to ascending order or sort by category/score is deferred.
- **Bulk selection or bulk actions on filtered entries:** No multi-select, bulk delete, or bulk export of filtered entries.

### Analytics and Scoring
- **Training gap analysis:** Identifying which training areas are under-documented relative to score targets is a Phase 1 feature planned for Sprint 8 and is not part of Sprint 7.
- **Score history chart:** A timeline visualization of how the user's overall retention score has changed over time is planned for Sprint 9 and is not part of Sprint 7.
- **Category-level score breakdown filtered by date:** While the date range filter narrows the journal view, it does not recalculate or display a score breakdown for the filtered period.

### Technical and Infrastructure
- **Backend API integration:** All data operations remain client-side via localStorage. No server-side search, filtering, or persistence is included.
- **New CDN dependencies:** No new third-party libraries or scripts may be added in Sprint 7. All filter and search logic must be implemented using vanilla JavaScript.
- **Full HTML file rewrite:** The single-file architecture is preserved. Sprint 7 involves targeted additions only — no wholesale restructuring of index.html.
- **sw.js feature changes beyond cache key bump:** The service worker update in Fix 1 is strictly limited to incrementing the CACHE_VERSION constant from rif-shield-v2 to rif-shield-v3. No new caching strategies, precache lists, or background sync logic is added.
- **Push notifications for journal reminders:** Scheduled reminders to log daily activities are deferred to Phase 3 (Sprint automation features).
- **Filter state persistence across sessions:** When the user closes and reopens the app, filter state (search text, active chip, date range) resets to defaults. Persisting filter preferences to localStorage is deferred.

### Accessibility Beyond Sprint 7 Scope
- **Full WCAG 2.1 AA audit:** Sprint 7 addresses two specific WCAG items (aria-label on category grid, aria-pressed on filter chips). A comprehensive accessibility audit of the entire application is deferred.
- **High-contrast mode or custom theme support:** Not in scope.
- **Keyboard-only navigation testing beyond filter chips:** General keyboard navigation improvements beyond what is required for the new Sprint 7 controls are deferred.

### User Management
- **Multi-user journal access:** No sharing, delegation, or collaborative journal viewing between federal employees and union representatives within the app.
- **Union representative portal or admin view:** A dedicated interface for union reps to browse member journals is a Phase 2+ feature.

---

## 6. Definition of Done

Sprint 7 is complete when ALL of the following conditions are verified and checked off. No partial completion is acceptable — every unchecked item is a blocking issue.

### Feature A: Journal Text Search
- [ ] A text input with the label "Search entries" (or equivalent accessible label) is visible above the journal list on the Journal screen
- [ ] The search input has a non-empty aria-label attribute readable by screen readers
- [ ] Typing in the search input filters the journal list within 300ms of the last keystroke (debounced — not per-keystroke)
- [ ] Filtering matches against the task field (case-insensitive)
- [ ] Filtering matches against the notes field (case-insensitive)
- [ ] A count line displays "Showing X of Y entries" and updates correctly with each new search result
- [ ] When zero entries match, the message "No entries match your search" (or equivalent) is displayed in the list area
- [ ] A Clear button is visible in the empty-state and clears the search input and restores the full list on click
- [ ] Clearing the search input (all characters deleted) restores the full list immediately
- [ ] The search input value is reset to empty when the log-entry modal is opened
- [ ] No per-keystroke DOM rebuild occurs — debounce is confirmed by code review

### Feature B: Journal Category Filter Chips
- [ ] A row of 6 filter chips is rendered below the search input: All, Seniority, Performance, Awards, Tenure, Veterans
- [ ] The "All" chip is selected by default on journal screen load
- [ ] Each chip displays the entry count for its category in parentheses — e.g., "Seniority (12)"
- [ ] Clicking a chip filters the journal list to show only entries of that category
- [ ] Only one chip can be visually active at a time
- [ ] The active chip has a visually distinct selected state (color, border, or background) consistent with the Navy/Gold design system
- [ ] Each chip has aria-pressed="true" when active and aria-pressed="false" when inactive
- [ ] Category filter and text search combine with AND logic (entry must match both to appear)
- [ ] Clicking "All" clears the category filter and shows entries from all categories (subject to any active text/date filters)
- [ ] A category chip with zero matching entries displays "CategoryName (0)" and shows an appropriate empty state when selected
- [ ] Filter chip state resets to "All" when the user navigates away from the journal screen and returns

### Feature C: Journal Date Range Filter
- [ ] A "From" date input and a "To" date input (type=date) are present below the category chips
- [ ] Both inputs are styled with Navy/Gold design tokens consistent with the existing design system
- [ ] Setting a From date filters the list to entries on or after that date (inclusive)
- [ ] Setting a To date filters the list to entries on or before that date (inclusive)
- [ ] Setting both dates filters the list to entries within the range (both boundaries inclusive)
- [ ] The date range filter combines with text search and category chip using AND logic
- [ ] A "Clear" button resets both date inputs to empty and restores the pre-date-filtered list
- [ ] Setting From after To does not crash the application — either zero results are shown or an inline validation message appears
- [ ] Date filter state resets to empty when the user navigates away from the journal screen and returns
- [ ] All three filters (text, category, date) can be active simultaneously and produce correct AND-logic results

### Fix 1: Service Worker Cache Key Bump
- [ ] The CACHE_VERSION constant in sw.js reads 'rif-shield-v3'
- [ ] No other changes are present in sw.js beyond the CACHE_VERSION value
- [ ] A hard refresh in Chrome DevTools confirms the new cache name 'rif-shield-v3' is registered
- [ ] The previous cache 'rif-shield-v2' is no longer listed in Chrome DevTools > Application > Cache Storage after the SW activates

### Fix 2: WCAG aria-label on Category Grid
- [ ] The #log-category-grid element (or equivalent container for the log form category buttons) has role="group" set
- [ ] The same element has aria-label="Select activity category" set
- [ ] An automated accessibility checker (axe, Lighthouse, or equivalent) reports no missing group label for this element
- [ ] No visual change is introduced by this fix

### Fix 3: Replace Numeric innerHTML with textContent
- [ ] All 4 identified numeric innerHTML assignments have been replaced with textContent in index.html
- [ ] A code search for the 4 specific locations confirms zero remaining numeric innerHTML assignments at those locations
- [ ] No visual or functional change is observed in the dashboard or any numeric display after the fix
- [ ] No new innerHTML assignments for numeric-only values are introduced in Sprint 7 code

### Fix 4: Remove console.log
- [ ] The 1 remaining console.log call identified in Sprint 6 QA has been removed from index.html
- [ ] Opening browser DevTools > Console on a fresh load produces no console.log output from application code
- [ ] A code search confirms zero console.log calls remain in index.html (console.warn and console.error are permitted)

### Code Quality and Constraints
- [ ] All new JavaScript functions introduced in Sprint 7 have JSDoc comments (@param, @returns)
- [ ] No new CDN dependencies or external script tags have been added
- [ ] The single HTML file architecture is preserved — all Sprint 7 changes are contained within index.html and sw.js only
- [ ] All new user-facing strings (empty states, labels, count lines) use only Navy/Gold design tokens for color
- [ ] escapeHtml() is applied to any user-input values rendered into the DOM by the new filter/search code
- [ ] No alert() calls are introduced in Sprint 7 code

### QA Sign-Off
- [ ] QA Agent (A4) has run full regression suite and all previously passing checks still pass
- [ ] QA Agent has verified all Sprint 7 acceptance criteria above
- [ ] QA report is filed in .agents/handoffs/sprint-7-qa-report.md
- [ ] No P1 or P2 defects remain open

### Documentation and Delivery
- [ ] Dev handoff document is filed in .agents/handoffs/sprint-7-dev-output.md
- [ ] PROGRESS.md has been updated by the Coordinator (A0) to reflect Sprint 7 completion
- [ ] Git commit is made by the Coordinator only after QA sign-off, with commit message referencing Sprint 7
- [ ] Sprint 8 brief is drafted or an explicit decision to defer it is documented

---

*Document produced by Agent A1 (Product Manager) | AFGE RIF Shield | Sprint 7 | 2026-03-14*
*Next handoff: sprint-7-architect-output.md (Agent A2 — Solutions Architect)*
