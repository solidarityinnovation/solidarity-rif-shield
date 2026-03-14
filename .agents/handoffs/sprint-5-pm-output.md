# Sprint 5 PM Output
## Agent: A1 — Product Manager
## Date: 2026-03-14
## Sprint Goal: PDF Export Hardening + Offline Status Indicator
## Phase: Phase 1 — Core Platform | Priority: P1

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

This sprint focuses on making the PDF export feature reliable, professional, and accessible to every user — including those on iPhones and those with unreliable internet connections. Five targeted improvements are being made to the existing single-HTML-file application.

---

### Feature A: Defer-Safe PDF Generation

Currently, if a federal employee taps the "Generate PDF" button too quickly after the page loads, nothing happens — the PDF silently fails with no error message shown. This occurs because the PDF library (jsPDF) loads in the background via CDN and may not be ready when the button is tapped.

This feature fixes the problem by keeping the Generate PDF button visually disabled (grayed out, unclickable) until jsPDF has fully loaded and confirmed readiness. Once ready, the button activates automatically. If jsPDF fails to load entirely — for example because a government firewall blocks external CDN addresses — the user sees a clear, plain-language error message instead of a silent failure.

**Who benefits:** Every user, especially those on slow government networks or anyone who taps quickly after page load.

---

### Feature B: Score Ring in PDF

Today the PDF report shows the user's RIF Protection Score as plain text only (e.g., "Score: 72"). This feature adds the same circular score ring visual from the app dashboard — a colored arc filling proportionally to the score, with the score number centered inside — directly into the exported PDF.

The ring accurately reflects the user's actual score and protection level label (e.g., "Level 3 — Developing") at the exact moment of export, making the PDF look professional and instantly communicating the user's standing to any manager, union representative, or attorney reviewing it.

**Who benefits:** Federal employees sharing their report with supervisors, union reps, or legal counsel needing a visual, at-a-glance summary.

---

### Feature C: Legal Citations Section in PDF

The PDF report currently lacks any reference to the federal laws that make it legally meaningful. This feature adds a formal "Legal Basis" section to every exported PDF, citing the specific federal regulations governing Reduction in Force procedures:

- **5 CFR Part 351** — the comprehensive RIF regulations
- **5 CFR 351.501** — how retention standing is determined
- **5 CFR 351.701** — bump and retreat rights for employees
- **OPM RIF Guidance** — the Office of Personnel Management's official reference document

These citations ground the report in federal law, making it suitable for grievances, MSPB appeals, and conversations with agency HR departments.

**Who benefits:** Federal employees preparing for a RIF action, union representatives building grievance files, and attorneys needing legally-grounded documentation.

---

### Feature D: Named PDF File + iOS Download Fix

Currently the PDF exports with a generic or system-assigned filename that is difficult to organize. After this sprint, every PDF will be automatically named with the generation date — for example: **RIF-Shield-Report-2026-03-14.pdf** — making it easy to find, sort, and share.

Additionally, iPhone and iPad users running iOS Safari currently cannot download the PDF at all — tapping the button produces a blank screen or no response. This is a known Safari-specific limitation requiring a different technical approach to trigger downloads. This feature fixes iOS Safari so those users can successfully save the PDF to their device.

**Who benefits:** All users wanting organized, date-stamped records; critically, iPhone and iPad users who currently cannot download PDFs at all.

---

### Feature E: Offline Status Banner

Many federal employees work in buildings with poor Wi-Fi or use the app during commutes with spotty cellular coverage. Currently the app gives no indication when the device loses internet connection. A user might enter data assuming it synced, or try to generate a PDF without realizing they are offline.

This feature adds a slim, non-intrusive status banner at the top of the screen that appears whenever the device goes offline. It displays a clear message (e.g., "You are offline — app is running in offline mode") so the user always knows their connectivity status. The banner disappears automatically when connectivity is restored — no user action required. It does not block any app content, does not require dismissal, and does not overlap the bottom navigation bar.

**Who benefits:** Any user on a slow, intermittent, or absent internet connection — particularly those in government buildings, on commutes, or in rural areas.

---
## 2. User Stories

---

### Feature A: Defer-Safe PDF Generation

**Story A-1**
> As a **federal employee**, I want the Generate PDF button to be visibly disabled while the app is still loading its PDF library, so that I cannot accidentally tap it before it is ready and receive no report and no explanation.

**Story A-2**
> As a **federal employee on a slow government network**, I want to see a clear, plain-language error message if the PDF system fails to load entirely, so that I understand the problem is a network or technical issue rather than a problem with my own data.

**Story A-3**
> As a **union representative** reviewing the app on behalf of a member, I want the Generate PDF button to become active automatically once the app is ready, so that I do not need to refresh the page or guess when it is safe to proceed.

**Story A-4**
> As a **federal employee using any device**, I want the button state to clearly communicate its readiness at all times, so that I always know whether tapping Generate PDF right now will succeed.

---

### Feature B: Score Ring in PDF

**Story B-1**
> As a **federal employee**, I want my PDF report to include the same circular score ring I see on my app dashboard, so that anyone reading my printed or shared report immediately understands my RIF protection level without having to interpret a raw number alone.

**Story B-2**
> As a **union representative** receiving a member's PDF, I want to see the member's score ring and protection level label (e.g., "Level 3 — Developing") in the document, so that I can quickly assess their standing without needing to log into the app myself.

**Story B-3**
> As a **federal employee**, I want the score ring in my PDF to reflect my score at the exact moment I generated the report, so that the document serves as an accurate, dated snapshot record of my standing.

**Story B-4**
> As a **federal employee with a very low or perfect score**, I want the score ring to render correctly at any score value including 0 and 100, so that the report never appears broken or unprofessional regardless of my score.

---

### Feature C: Legal Citations Section in PDF

**Story C-1**
> As a **federal employee preparing for a potential RIF**, I want my PDF report to cite the specific federal regulations governing RIF procedures, so that I can present a legally-grounded document to my agency HR office or union representative without needing to look up citations separately.

**Story C-2**
> As a **union representative** building a grievance file, I want the PDF to include 5 CFR Part 351 and OPM RIF guidance references, so that I do not need to manually add citations when submitting documentation on a member's behalf.

**Story C-3**
> As a **federal employee**, I want the legal citations section to appear consistently at the bottom of every PDF I generate, so that every copy of my report is equally complete and suitable for official use.

**Story C-4**
> As a **federal employee sharing my report with an attorney**, I want the specific CFR subsections (351.501 for retention standing, 351.701 for bump and retreat) to be individually listed, so that my attorney can immediately locate the relevant legal provisions without additional research.

---

### Feature D: Named PDF File + iOS Download Fix

**Story D-1**
> As a **federal employee**, I want my downloaded PDF to be automatically named with today's date (e.g., RIF-Shield-Report-2026-03-14.pdf), so that I can easily identify, sort, and archive multiple reports generated over time without manually renaming files.

**Story D-2**
> As an **iOS Safari user on an iPhone or iPad**, I want to be able to successfully download my PDF report to my device, so that I am not excluded from this critical feature solely because of the browser I use.

**Story D-3**
> As a **federal employee on any device or browser**, I want the PDF download to work consistently without my needing to know which browser I am using or take any special steps, so that I can focus on my work rather than troubleshooting compatibility issues.

**Story D-4**
> As a **federal employee who generates reports regularly**, I want each file to be distinctly named by date, so that saving multiple reports over time does not overwrite or confuse previous copies in my downloads folder.

---

### Feature E: Offline Status Banner

**Story E-1**
> As a **federal employee with poor connectivity**, I want to see a visible banner when my device goes offline, so that I know my current network status at all times and can make informed decisions about when to generate reports or enter data.

**Story E-2**
> As a **federal employee on a commute**, I want the offline banner to disappear automatically when my connection is restored, so that I do not need to interact with it and my workflow is not interrupted.

**Story E-3**
> As a **federal employee using the app on a mobile device**, I want the offline banner to appear without covering the bottom navigation bar or any interactive controls, so that I can continue using all app features while the banner is displayed.

**Story E-4**
> As a **user with intermittent connectivity**, I want the offline banner to accurately reflect my real-time connection status — appearing when I go offline and disappearing when I reconnect — so that I always have a current, accurate picture of my network state.

---

## 3. Acceptance Criteria

---

### Feature A: Defer-Safe PDF Generation

#### Story A-1 / A-4: Button disabled while loading, state clarity

**Scenario A-1a — Happy Path: jsPDF loads successfully**
- GIVEN the user has opened the app on any device
- WHEN the page is loading jsPDF from the CDN
- THEN the Generate PDF button is visibly disabled (reduced opacity, grayed styling)
- AND the button displays a loading indicator or label such as "Loading PDF library..."
- AND no tap or click on the button triggers any action during this state

- GIVEN jsPDF finishes loading successfully
- WHEN the library confirms it is available
- THEN the Generate PDF button transitions to its fully active state automatically
- AND no user action (refresh, scroll, or tap) is required to trigger the transition
- AND the button returns to its normal label (e.g., "Download PDF Report")
- AND the visual change from disabled to active is immediately noticeable

**Scenario A-1b — Edge Case: User taps button during loading**
- GIVEN the Generate PDF button is in its disabled/loading state
- WHEN the user taps or clicks the button repeatedly
- THEN nothing happens — no PDF generation is attempted
- AND the button remains visually disabled throughout
- AND no silent JavaScript errors are produced in the background

---

#### Story A-2: Error message if jsPDF fails to load

**Scenario A-2a — Happy Path: jsPDF loads successfully**
- GIVEN the user is on a network that can reach the jsPDF CDN
- WHEN jsPDF finishes loading
- THEN no error message is shown
- AND the Generate PDF button becomes active as described in Scenario A-1a

**Scenario A-2b — Failure: CDN blocked or unavailable**
- GIVEN the user is on a network that blocks external CDN addresses
- WHEN the page finishes loading without jsPDF becoming available
- THEN the Generate PDF button remains permanently disabled for this session
- AND a human-readable error message appears near the button reading plainly (e.g., "PDF generation is currently unavailable. Your network may be blocking the required library. Please try on a different network or contact your IT helpdesk.")
- AND the error message is fully visible without scrolling on both mobile and desktop
- AND no raw JavaScript error text, stack traces, or technical jargon is shown to the user

---

#### Story A-3: Auto-activation after slow load

**Scenario A-3a — Happy Path: Slow CDN (5-15 seconds)**
- GIVEN jsPDF takes an extended time to load due to a slow connection
- WHEN the user is waiting on the reports screen
- THEN the button continues to display its loading/disabled state for the full duration
- AND all other parts of the app remain fully interactive during the wait
- AND when jsPDF eventually loads, the button activates automatically without user action

**Scenario A-3b — Navigate away and return**
- GIVEN jsPDF has not yet loaded when the user first visits the reports screen
- WHEN the user navigates to another section and then returns
- THEN the button correctly reflects the current state of jsPDF readiness
- AND the state is never visually stuck, ambiguous, or inconsistent

---

### Feature B: Score Ring in PDF

#### Story B-1 / B-3: Ring renders with correct score and snapshot accuracy

**Scenario B-1a — Happy Path: Ring renders correctly**
- GIVEN the user has a current RIF Protection Score (e.g., 72 out of 100)
- WHEN the user successfully generates a PDF report
- THEN the PDF contains a visible circular score ring graphic
- AND the ring arc fills proportionally to the score (approximately 72% filled for score 72)
- AND the user's numeric score is displayed centered within or adjacent to the ring
- AND the user's protection level label (e.g., "Level 3 — Developing") is legibly displayed near the ring
- AND the ring uses the app's navy/gold color scheme consistent with the dashboard

**Scenario B-1b — Snapshot accuracy**
- GIVEN the user's score is 72 at the moment they tap Generate PDF
- WHEN the PDF is produced
- THEN the ring and score in the PDF reflect exactly 72, not a cached or default value
- AND the generation date printed on the report matches today's actual date

#### Story B-4: Edge score values

**Scenario B-4a — Score of 0**
- GIVEN the user has a RIF Protection Score of 0
- WHEN the user generates a PDF report
- THEN the ring graphic renders without errors
- AND the arc displays as empty (0% filled)
- AND the score "0" and appropriate level label are displayed
- AND no broken graphic, missing element, or visual error appears

**Scenario B-4b — Score of 100**
- GIVEN the user has a RIF Protection Score of 100
- WHEN the user generates a PDF report
- THEN the ring arc displays as fully filled (100%)
- AND the score "100" and highest level label are correctly displayed
- AND the ring does not overflow, clip, or render incorrectly at maximum fill

#### Story B-2: Ring visible and legible to reviewer

**Scenario B-2a — Shared PDF legibility**
- GIVEN a union representative opens a PDF shared by a member
- WHEN the representative views the report
- THEN the score ring is prominently visible in the report
- AND the level label adjacent to the ring is legible at normal reading zoom
- AND the ring visual is not pixelated, blurry, or distorted in the PDF

---

### Feature C: Legal Citations Section in PDF

#### Story C-1 / C-3: Citations present on every report

**Scenario C-1a — Happy Path: Citations appear in generated PDF**
- GIVEN the user generates a PDF report (any score, any date)
- WHEN the PDF is opened on any PDF viewer
- THEN a clearly labeled "Legal Basis" or "Regulatory References" section appears in the document
- AND the section contains all four required citations:
  - 5 CFR Part 351 (labeled as "RIF Regulations")
  - 5 CFR 351.501 (labeled as "Retention Standing")
  - 5 CFR 351.701 (labeled as "Bump and Retreat Rights")
  - OPM RIF Guidance (with descriptive label)
- AND the citations section is present on every generated PDF without exception
- AND the section is legible at standard PDF zoom levels (100%)

**Scenario C-1b — Edge Case: Citations survive user data variations**
- GIVEN a user with special characters in their name or journal entries
- WHEN the user generates a PDF report
- THEN the legal citations section appears correctly regardless of the user's data
- AND special characters in user-entered data do not corrupt or displace the citations section

---

#### Story C-2 / C-4: Individual CFR subsections listed separately

**Scenario C-2a — Union rep reviews citations**
- GIVEN a union representative opens a member's PDF report
- WHEN the representative scrolls to the legal citations section
- THEN 5 CFR 351.501 and 5 CFR 351.701 are listed as separate, individually labeled entries
- AND each citation includes a brief plain-language description of what it covers
- AND the OPM RIF Guidance reference is present as a distinct entry

---

### Feature D: Named PDF File + iOS Download Fix

#### Story D-1 / D-4: Date-stamped filename

**Scenario D-1a — Happy Path: Correct filename on download**
- GIVEN today's date is 2026-03-14
- WHEN the user successfully generates and downloads a PDF report
- THEN the downloaded file is named exactly: RIF-Shield-Report-2026-03-14.pdf
- AND the date in the filename matches the actual date of generation
- AND the filename follows the format RIF-Shield-Report-YYYY-MM-DD.pdf for any generation date

**Scenario D-1b — Edge Case: Multiple reports generated same day**
- GIVEN the user generates two PDF reports on the same day
- WHEN both files are downloaded
- THEN both files have the same date-based name (RIF-Shield-Report-2026-03-14.pdf)
- AND the user's operating system or browser handles any filename collision (e.g., appending " (2)")
- AND neither download silently fails or produces an unnamed file

---

#### Story D-2: iOS Safari download works

**Scenario D-2a — Happy Path: iPhone user downloads PDF**
- GIVEN the user is on an iPhone or iPad using Safari
- WHEN the user taps the Generate PDF button and generation succeeds
- THEN the PDF opens or a download prompt appears in Safari
- AND the user is able to save the PDF to their Files app or share it
- AND the experience does not result in a blank screen, a new tab opening with no content, or a silent failure

**Scenario D-2b — Edge Case: iOS Safari blocks blob download**
- GIVEN the user is on iOS Safari and the standard Blob download method is blocked
- WHEN the PDF generation completes
- THEN the system falls back to an alternative method (e.g., opening the PDF in a new tab for manual save)
- AND the user sees the PDF content and can save it manually
- AND a brief instructional message appears if the automatic download cannot be triggered (e.g., "Tap and hold the PDF to save to your device")

---

#### Story D-3: Cross-browser consistency

**Scenario D-3a — Happy Path: Works on Chrome, Firefox, Edge, Safari desktop**
- GIVEN a user on any modern desktop browser (Chrome, Firefox, Edge, Safari)
- WHEN the user generates and downloads a PDF
- THEN the file downloads automatically with the correct filename
- AND no browser-specific error or workaround is required

**Scenario D-3b — Android Chrome download**
- GIVEN a user on Android using Chrome
- WHEN the user generates a PDF
- THEN the PDF downloads to the device's Downloads folder with the correct filename
- AND a download confirmation appears in the browser's download bar or notification area

---

### Feature E: Offline Status Banner

#### Story E-1 / E-4: Banner appears when offline

**Scenario E-1a — Happy Path: Device goes offline**
- GIVEN the user is actively using the app with a live internet connection
- WHEN the device loses internet connectivity
- THEN a status banner appears within 2 seconds of the connection loss
- AND the banner displays a clear message such as "You are offline — app is running in offline mode"
- AND the banner uses a visually distinct style (e.g., amber/warning color or subtle dark bar)
- AND the banner appears at the top of the screen, below the app header
- AND the banner does NOT cover or obscure the bottom navigation bar
- AND the banner does NOT block access to any interactive elements

**Scenario E-1b — Already offline on app open**
- GIVEN the user opens the app while their device is already offline
- WHEN the app finishes loading
- THEN the offline banner is displayed immediately on load
- AND no online-state flash occurs before the banner appears

---

#### Story E-2: Banner auto-dismisses on reconnect

**Scenario E-2a — Happy Path: Connectivity restored**
- GIVEN the offline banner is currently displayed
- WHEN the device regains internet connectivity
- THEN the offline banner disappears automatically within 2 seconds
- AND no user action (tap, swipe, dismiss button) is required
- AND the app resumes normal operation without requiring a page reload
- AND optionally a brief "Back online" confirmation message appears and then fades

**Scenario E-2b — Edge Case: Rapid connectivity flicker**
- GIVEN the device connectivity toggles rapidly (offline → online → offline within seconds)
- WHEN these state changes occur
- THEN the banner reflects each state change accurately
- AND the banner does not flicker in a disorienting way (debounce of at least 1 second recommended)
- AND the final displayed state accurately reflects the actual current connection state

---

#### Story E-3: Banner does not block UI

**Scenario E-3a — Layout on mobile portrait**
- GIVEN the user is viewing the app on a mobile device in portrait orientation
- WHEN the offline banner is displayed
- THEN all navigation items in the bottom nav bar remain fully visible and tappable
- AND the main content area is not obscured by the banner
- AND the user can scroll content normally while the banner is present

**Scenario E-3b — Layout on mobile landscape**
- GIVEN the user rotates their device to landscape orientation while the banner is showing
- WHEN the layout reflows
- THEN the banner remains visible but does not cause any content overlap or layout breakage
- AND the bottom navigation bar remains accessible

---

## 4. Edge Cases

The following edge cases MUST be considered and handled gracefully. Each scenario describes what the user experiences — not how the code handles it internally.

---

### Edge Case 1: jsPDF Fails to Load Entirely (CDN Blocked by Agency Firewall)

**Scenario:**
A federal employee opens the RIF Shield app on their agency-issued laptop while connected to the agency's internal network. The agency's firewall blocks all requests to external CDN domains as a security policy. The jsPDF library never loads.

**What the user must experience:**
- The Generate PDF button remains visibly disabled throughout the entire session — it never becomes active
- A clear, non-technical error message appears near the button explaining the issue in plain language
- The message does NOT contain JavaScript error text, stack traces, or error codes
- The message suggests a practical next step (e.g., "Try on a personal device or non-agency network")
- All other app functionality (journal, training, dashboard) continues to work normally
- The error state does not cause any other part of the page to break or display incorrectly
- The user is never left wondering whether their data was lost or whether they did something wrong

**What must NOT happen:**
- The button must not appear active and then silently do nothing when tapped
- A blank PDF must not be downloaded
- The app must not crash or display a white/broken screen
- A raw browser console error must not surface in the UI

---

### Edge Case 2: User Taps "Generate PDF" While Already Generating

**Scenario:**
A federal employee taps the Generate PDF button. PDF generation begins (which may take 1–3 seconds while the canvas ring renders and jsPDF builds the document). Before it completes, the user taps the button again — either out of impatience or thinking nothing happened.

**What the user must experience:**
- After the first tap, the Generate PDF button becomes visually disabled or shows a progress state (e.g., "Generating..." label or spinner)
- The second tap does nothing — no second PDF generation is queued or triggered
- The button returns to its normal active state only after the first generation fully completes (success or failure)
- One and only one PDF file is downloaded per button tap sequence
- If generation succeeds, the download triggers once and the button reactivates
- If generation fails, an error message appears and the button reactivates so the user can try again

**What must NOT happen:**
- Two PDFs must not download simultaneously or in rapid succession
- The app must not freeze, become unresponsive, or enter a broken state where the button never reactivates
- The user must not receive a corrupted or partial PDF from a race between two generation attempts

---

### Edge Case 3: Score Ring Canvas Render Fails

**Scenario:**
During PDF generation, the canvas element used to draw the score ring fails to render — for example, due to a browser security policy blocking canvas operations (some hardened government browser configurations restrict canvas use), insufficient device memory, or an unexpected JavaScript error in the ring-drawing code.

**What the user must experience:**
- The PDF generation does NOT halt entirely — the rest of the report (text content, legal citations, user data) is still produced and downloaded
- The score ring section either shows a graceful fallback (e.g., a plain text representation: "RIF Protection Score: 72 — Level 3: Developing") or is omitted cleanly without leaving a blank box or broken graphic
- The user receives their PDF with all meaningful content intact
- Optionally, a brief non-blocking notice may inform the user: "Note: Score ring graphic could not be generated. Your score is shown as text."
- The fallback text version of the score is still accurate and human-readable

**What must NOT happen:**
- The entire PDF generation must not fail and produce no file just because the canvas ring failed
- A broken image placeholder, empty white box, or corrupted graphic must not appear in the PDF
- The user must not see a JavaScript error message or be left with no explanation

---

### Edge Case 4: iOS Safari PDF Blob Download Is Blocked

**Scenario:**
An iPhone user running iOS Safari taps Generate PDF. The app attempts to trigger a file download using a Blob URL and programmatic anchor click — the standard fix for Safari compatibility. However, certain iOS Safari versions or user privacy settings block programmatic Blob downloads in specific contexts.

**What the user must experience:**
- The PDF content does not silently disappear
- Safari opens the PDF in a new browser tab as a fallback, allowing the user to view the document
- A brief on-screen instruction appears (e.g., "Tap the Share icon in Safari, then choose Save to Files to download your PDF")
- The instruction is specific to iOS — it references the iOS Share sheet, not generic desktop terminology
- The user can successfully save the PDF to their device via the Share sheet, even if the automatic download did not trigger
- The instruction message is dismissible and does not permanently block the UI

**What must NOT happen:**
- A blank white tab or error page must not open
- The user must not be left with no PDF and no explanation
- Desktop-oriented instructions (e.g., "right-click to save") must not be shown to iOS users
- The app must not crash or enter an error state

---

### Edge Case 5: Connectivity Flickers (Online → Offline → Online Rapidly)

**Scenario:**
A federal employee is using the app on a commuter train. Their device connectivity toggles rapidly — for example, going offline for 3 seconds, back online for 2 seconds, offline again for 1 second, then back online — as the train passes through areas with poor signal. These changes happen faster than the user can read and react to UI feedback.

**What the user must experience:**
- The offline banner appears and disappears in response to each connectivity change
- The banner does not flicker in a visually distracting or seizure-inducing manner (changes are smoothed with at least a 1-second delay before toggling)
- After rapid flickering, the banner's final displayed state accurately reflects the device's actual current network status
- If the user ends up back online, the banner is not showing
- If the user ends up offline, the banner is showing
- The app itself remains stable and usable throughout — no crashes, frozen screens, or stuck states
- Any actions taken during the connectivity fluctuation (e.g., viewing dashboard, reading journal) continue to work using cached/offline data
- No spurious "You are back online" or "You went offline" toasts appear more than once per distinct connectivity event

**What must NOT happen:**
- The banner must not get stuck in the "offline" state after connectivity is restored
- The banner must not get stuck in the "online" (hidden) state while the device is actually offline
- Rapid connectivity changes must not cause the banner to flash on and off continuously for more than 2 cycles
- The app must not attempt to re-sync data multiple times in rapid succession, causing visible lag or UI freezes

---

## 5. Out of Scope

The following items are explicitly NOT part of Sprint 5. These exclusions are intentional and documented to prevent scope creep and to protect sprint delivery timelines. Items below are candidates for future sprints.

---

### iOS PWA Install Fallback UX
- The Sprint 4 QA Agent identified that iOS Safari does not support the `beforeinstallprompt` event, which means the current PWA install button does not function on iPhone/iPad.
- Designing and implementing an iOS-specific install instructions flow (e.g., "Tap Share, then Add to Home Screen" instruction modal) is **NOT** being built in Sprint 5.
- This feature is deferred to **Sprint 6**.
- Rationale: The PDF download iOS fix (Feature D) and the install UX fix are separate problems requiring separate design and implementation work. Combining them risks delaying both.

---

### QA Regression Suite Test Pattern Fixes
- The Sprint 4 QA report identified specific test pattern issues in the automated regression suite.
- Updating, refactoring, or expanding the QA test suite itself is **NOT** in scope for Sprint 5.
- Deferred to **Sprint 6**.
- Rationale: Sprint 5 development agents should not be blocked on or distracted by test infrastructure work.

---

### Backend / Server-Side PDF Generation
- All PDF generation in Sprint 5 remains client-side only, using jsPDF in the browser.
- Building a server-side PDF generation service (e.g., using Puppeteer, wkhtmltopdf, or a dedicated PDF microservice) is **NOT** in scope.
- Deferred to **Phase 1, Sprint 10+** as defined in the project roadmap.
- Rationale: The single-HTML-file architecture constraint for Phase 1 prohibits server-side dependencies at this stage.

---

### Authentication or Session Changes
- No changes to login, logout, session management, JWT handling, MFA flows, or any authentication-related code are included in Sprint 5.
- Any bug fixes or improvements to auth are handled in dedicated auth sprints.

---

### Design System Changes
- The navy/gold color token set is locked for Phase 1.
- No new colors, typography changes, spacing system updates, or component library modifications are included in Sprint 5.
- The score ring in the PDF must use existing design tokens only — no new visual styles may be introduced.

---

### New CDN Dependencies Without SRI Hashes
- No new third-party libraries may be added via CDN in Sprint 5 unless accompanied by a verified Subresource Integrity (SRI) hash.
- Adding new CDN dependencies without SRI is explicitly out of scope and in violation of the project's security constraints.

---

### PDF Accessibility (WCAG/PDF/UA Compliance)
- Making the generated PDF fully accessible (tagged PDF, reading order, WCAG 2.1 AA compliance for PDF documents) is **NOT** in scope for Sprint 5.
- This is a known future requirement but requires specialized tooling beyond jsPDF's current capabilities.

---

### Bulk or Scheduled PDF Generation
- Generating PDFs on a schedule, in bulk (e.g., for union reps exporting all member reports), or via email delivery is **NOT** in scope.
- These are Phase 2+ features requiring backend infrastructure.

---

### Offline PDF Generation
- Generating PDFs while the device is offline (jsPDF loaded from a local cache rather than CDN) is **NOT** in scope for Sprint 5.
- Feature E (offline banner) makes the offline state visible; it does not add offline PDF capability.
- If jsPDF is not loaded (e.g., because the page was opened offline), the Generate PDF button will display the appropriate disabled/error state as defined in Feature A.

---

## 6. Definition of Done

Sprint 5 is considered complete when ALL of the following conditions are met. Each condition must be verifiable by the QA Agent through direct testing.

---

### Feature A: Defer-Safe PDF Generation
- [ ] The Generate PDF button is visibly disabled on page load before jsPDF is confirmed available
- [ ] The button displays a loading state indicator (label or spinner) while jsPDF is loading
- [ ] The button activates automatically when jsPDF finishes loading, with no user action required
- [ ] Tapping the disabled button produces no action, no error, and no silent background process
- [ ] When jsPDF CDN is unreachable (simulated), a plain-language error message appears near the button
- [ ] The error message contains no raw JavaScript error text, stack traces, or technical codes
- [ ] All other app functionality remains accessible while the PDF button is in a loading or error state

---

### Feature B: Score Ring in PDF
- [ ] Generated PDFs contain a circular score ring graphic
- [ ] The ring arc fill is proportional to the user's current score (verified at scores 0, 50, and 100)
- [ ] The user's numeric score is displayed within or adjacent to the ring in the PDF
- [ ] The user's protection level label is legibly displayed near the ring
- [ ] Ring colors conform to the navy/gold design token set
- [ ] The ring renders without errors at boundary values (score = 0 and score = 100)
- [ ] If the canvas render fails, the PDF still generates with a plain-text score fallback
- [ ] The ring graphic is not pixelated, blurry, or distorted in the PDF output

---

### Feature C: Legal Citations Section in PDF
- [ ] Every generated PDF contains a clearly labeled legal citations section
- [ ] The section includes all four required citations: 5 CFR Part 351, 5 CFR 351.501, 5 CFR 351.701, and OPM RIF Guidance
- [ ] Each citation includes a brief plain-language description of what it covers
- [ ] Citations are individually labeled and listed as separate entries (not merged into a single block)
- [ ] The citations section appears consistently across multiple PDF generations regardless of user data
- [ ] Special characters in user-entered data do not corrupt or displace the citations section
- [ ] All user-supplied data rendered in the PDF passes through escapeHtml() (XSS safety requirement)

---

### Feature D: Named PDF File + iOS Download Fix
- [ ] Downloaded PDFs are named in the format RIF-Shield-Report-YYYY-MM-DD.pdf using the actual generation date
- [ ] The filename is correct across Chrome, Firefox, Edge, and Safari on desktop
- [ ] The filename is correct on Android Chrome
- [ ] iOS Safari users can successfully access the PDF content (download or in-tab view)
- [ ] iOS Safari users receive an actionable instruction if automatic download cannot be triggered
- [ ] The iOS instruction references the iOS Share sheet, not desktop-specific terminology
- [ ] Only one PDF file is produced per user-initiated generation event
- [ ] No blank files, unnamed files, or corrupted PDFs are downloaded on any tested platform

---

### Feature E: Offline Status Banner
- [ ] An offline status banner appears within 2 seconds of the device losing internet connectivity
- [ ] The banner displays a clear, plain-language offline message
- [ ] The banner disappears automatically within 2 seconds of connectivity being restored
- [ ] No user action is required to dismiss the banner
- [ ] The banner does not overlap or obscure the bottom navigation bar on mobile portrait
- [ ] The banner does not overlap or obscure the bottom navigation bar on mobile landscape
- [ ] All navigation items and interactive controls remain accessible while the banner is displayed
- [ ] The banner appears immediately if the app is opened while the device is already offline
- [ ] Rapid connectivity toggling (3+ changes within 5 seconds) does not cause the banner to get stuck
- [ ] The final displayed state of the banner accurately reflects the device's actual network state

---

### Overall Sprint Quality Gates
- [ ] All five features pass QA review with zero critical (P0) defects
- [ ] No regressions introduced to any Sprint 1–4 features (full regression suite passes)
- [ ] Single HTML file architecture is preserved — no new files added to the deliverable
- [ ] No new CDN dependencies added without accompanying SRI hash
- [ ] All new JavaScript functions have JSDoc documentation
- [ ] escapeHtml() is applied to all user-supplied data rendered in the PDF
- [ ] The app passes a manual smoke test on: desktop Chrome, desktop Safari, iOS Safari, Android Chrome
- [ ] The PM, Architecture, Development, and QA handoff documents are all complete and filed
- [ ] PROGRESS.md is updated to reflect Sprint 5 completion
- [ ] Changes are committed to git with a descriptive commit message referencing Sprint 5

---

*End of Sprint 5 PM Output — Agent A1, Product Manager*
*Document prepared: 2026-03-14*
*Next step: Solutions Architect Agent (A2) to produce Sprint 5 Architecture Blueprint*

---

## Appendix: Technical Implementation Notes for Agents

These notes are for the Architecture and Development agents only. They translate user-facing requirements into implementation anchors without prescribing code.

### Feature A
- The race condition to guard against is: `generatePDF()` called before `window.jsPDF` is defined
- Button disabled state must be set at DOM-ready, before jsPDF `defer` load completes
- An `onload` or equivalent callback on the jsPDF script tag is the intended activation trigger

### Feature B
- Score ring must be rendered to an offscreen HTML5 `<canvas>` element and converted to an image for jsPDF embedding
- Ring dimensions, colors, and level labels must exactly match the dashboard ring

### Feature C
- All user-supplied text fields embedded in the PDF must pass through `escapeHtml()` before rendering
- The legal citations section is static content — it does not depend on user data

### Feature D
- Filename format: `RIF-Shield-Report-YYYY-MM-DD.pdf` using the local date at generation time
- iOS Safari compatibility requires the Blob URL + programmatic `<a>` anchor click pattern
- Detect iOS Safari via `navigator.userAgent` to apply the appropriate download method

### Feature E
- Offline detection relies on the browser's `navigator.onLine` property and the `window` events `'online'` and `'offline'`
- Note: `navigator.onLine` can return `true` even on poor connections — the banner reflects the browser's reported state, not measured bandwidth
- Banner must be debounced (minimum 1 second) before toggling to prevent flicker on rapid `navigator.onLine` state changes

---
*End of Appendix*
