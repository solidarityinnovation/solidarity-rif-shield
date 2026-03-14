# Sprint 4 PM Output
## Author: Agent A1 — Product Manager
## Date: 2026-03-14
## Sprint Goal: Service Worker & PWA Hardening

---

## 1. Sprint Feature Summary

This sprint focuses on making the AFGE RIF Shield app more reliable, resilient, and easier to install on users' devices. Three improvements are being delivered:

**Feature A — Cache Versioning (Stale Content Fix)**
Right now, when the development team pushes an update to the app, some users continue seeing the old version because their device has cached a previous copy. This feature ensures that every new deployment automatically invalidates the old cache, so users always receive the latest version of the app without needing to manually clear their browser data.

**Feature B — Offline Fallback Experience**
Federal employees often need to access their RIF Shield data in low-connectivity environments — on government campuses, during commutes, or in areas with unreliable networks. Currently, when the network is unavailable, the app shows a generic browser error page. This feature replaces that with a friendly, branded message that reassures users their data is safe and instructs them what to do next.

**Feature C — PWA Install Prompt**
The app can already be installed on a user's home screen, but there is no guidance or invitation to do so. This feature detects when a user's device supports installation and shows a visible, tappable "Install App" button. This makes it easier for members to use RIF Shield like a native app — with one tap from their home screen, offline access, and no browser chrome.

---

## 2. User Stories

### Feature A: Service Worker Cache Versioning

> **A1.** As a **federal employee using RIF Shield**, I want to always see the most up-to-date version of the app after a new release, so that I am never working with outdated information or broken features caused by stale cached files.

> **A2.** As a **union representative recommending RIF Shield to members**, I want to be confident that when a bug is fixed and deployed, my members will automatically receive the fix, so that I do not have to instruct dozens of people to manually clear their browser cache.

> **A3.** As a **developer deploying an update**, I want the Service Worker to recognize the new version on the next page load and activate it cleanly, so that the update process is automatic and does not leave users in a broken mixed-version state.

---

### Feature B: Offline Fallback Experience

> **B1.** As a **federal employee with an unreliable network connection**, I want to see a clear, reassuring message when I open RIF Shield without internet access, so that I know the app is still working and I understand what I can and cannot do offline.

> **B2.** As a **user who has already logged journal entries**, I want to be told that my previously saved data is still accessible even when I am offline, so that I do not panic and think my records have been lost.

> **B3.** As a **user who comes back online**, I want the app to resume normal operation automatically without me having to manually reload the page, so that my workflow is not disrupted.

---

### Feature C: PWA Install Prompt

> **C1.** As a **federal employee who uses RIF Shield daily**, I want to be invited to install the app on my home screen, so that I can open it with a single tap without navigating through a browser.

> **C2.** As a **user who sees the install prompt**, I want to be able to dismiss it without being bothered again during the same session, so that the prompt does not interfere with my use of the app.

> **C3.** As a **user who has already installed the app**, I want the install button to disappear after installation, so that the interface is not cluttered with a prompt that is no longer relevant.

> **C4.** As a **user on a device that does not support PWA installation** (e.g., iOS Safari, desktop Firefox without PWA support), I want the install button to simply not appear, so that I am not shown a broken or non-functional option.

---

## 3. Acceptance Criteria

### Feature A: Service Worker Cache Versioning

#### Story A1 / A2 — User receives latest version after deploy

**Happy Path:**
- GIVEN a new version of the app has been deployed with an updated cache version identifier
- WHEN a returning user loads the app in their browser
- THEN the Service Worker detects the version mismatch, deletes the old cache, fetches fresh assets, and the user sees the updated app within one page load cycle

**Verification — No Stale Content:**
- GIVEN the app has been updated
- WHEN the user opens the app after a prior visit
- THEN there is no visible flash of old content, no broken layout, and no stale JavaScript behavior

**No User Action Required:**
- GIVEN a cache version bump has occurred
- WHEN the user has not manually cleared their browser cache
- THEN the update still applies automatically — the user does NOT need to take any action

#### Story A3 — Clean Service Worker activation

**Happy Path:**
- GIVEN a new Service Worker version is waiting to install
- WHEN the user has no other tabs of the app open
- THEN the new Service Worker activates on the next navigation without throwing a JavaScript console error

**Multi-Tab Safety:**
- GIVEN a new Service Worker is waiting
- WHEN the user has the app open in multiple tabs
- THEN the new Service Worker does NOT activate mid-session in a way that breaks any open tab

**Old Cache Purged:**
- GIVEN the new Service Worker has activated
- WHEN the activation event fires
- THEN all caches associated with the previous cache version name are deleted
- AND only the new cache version name remains

### Feature B: Offline Fallback Experience

#### Story B1 — Offline message displayed

**Happy Path:**
- GIVEN the user has previously loaded the app at least once (Service Worker is registered and assets are cached)
- WHEN the user opens the app with no network connection
- THEN the app displays a branded offline fallback screen — not a raw browser error page — containing:
  - The RIF Shield app name or recognizable branding element
  - A clear message such as: "You are currently offline"
  - A secondary message such as: "Your saved data is on this device. Reconnect to access all features."
  - Styling that uses the app's existing navy (#0f1c3f) and gold (#c9a227) color scheme

**First-Time Visitor (No SW Registered Yet):**
- GIVEN a user has NEVER loaded the app before on this browser
- WHEN they attempt to open it with no network connection
- THEN the browser's native offline error page may appear — this is acceptable, since no Service Worker has been registered yet to intercept the request

**Branded Screen — Not Raw Browser Error:**
- GIVEN any returning user goes offline
- WHEN they open or refresh the app
- THEN they NEVER see the browser's default "No internet" dinosaur page or equivalent
- AND the fallback is always the app's own branded, readable screen

#### Story B2 — Data reassurance messaging

**Happy Path:**
- GIVEN the user is viewing the offline fallback screen
- WHEN they read the message displayed
- THEN the message explicitly states that previously saved data (journal entries, scores) is intact
- AND informs the user that full functionality will resume once connectivity is restored

**No Broken Action Buttons:**
- GIVEN the user is offline
- WHEN the fallback screen is displayed
- THEN the fallback screen does NOT show any interactive buttons or links that would attempt a live network action (e.g., no "Sync Now", "Load Latest Data", or "Submit" buttons)
- AND any such buttons that could cause silent failures are absent from the fallback screen

#### Story B3 — Automatic recovery when connectivity is restored

**Happy Path:**
- GIVEN the user is viewing the offline fallback screen
- WHEN network connectivity is restored and the user navigates or performs a page refresh
- THEN the full app loads normally
- AND no additional steps are required from the user beyond the normal page load

**Clean State on Recovery:**
- GIVEN the user has reconnected and the app has reloaded
- WHEN the full app interface is displayed
- THEN no offline fallback content, error banners, or stale messaging from the offline state remains visible anywhere in the normal app interface

---

### Feature C: PWA Install Prompt

#### Story C1 — Install button appears and triggers the install flow

**Happy Path:**
- GIVEN the user is on a browser that supports the `beforeinstallprompt` event (e.g., Chrome on Android, desktop Chrome, Edge)
- AND the user has not previously installed the app on this device
- WHEN the app loads and the browser fires the `beforeinstallprompt` event
- THEN a visible "Install App" button (or equivalent labeled UI element) appears within the app interface in a non-intrusive but clearly discoverable location

**Install Flow — Successful Completion:**
- GIVEN the install button is visible
- WHEN the user taps or clicks the install button
- THEN the browser's native install dialog appears
- AND if the user confirms installation, the app is added to their home screen or app launcher
- AND the install button immediately disappears from the app interface upon successful installation

**Install Flow — User Cancels Native Dialog:**
- GIVEN the browser's native install dialog is displayed
- WHEN the user cancels or dismisses the native dialog without completing installation
- THEN the user is returned to the app without disruption
- AND no error message is shown to the user
- AND the app continues to function normally

#### Story C2 — Prompt is dismissible and does not harass the user

**Happy Path:**
- GIVEN the install button or prompt is visible in the interface
- WHEN the user dismisses or ignores it (actively closes it if a dismiss action is provided, or proceeds to use the app)
- THEN the prompt does not re-appear automatically during the remainder of the current browser session
- AND the user can use all app features without the install prompt interfering

**No Re-Prompt Spamming:**
- GIVEN the user has dismissed the install prompt during this session
- WHEN they navigate to other sections of the app within the same session
- THEN the install prompt does NOT reappear automatically on any screen

#### Story C3 — Install button is hidden after the app is already installed

**Happy Path:**
- GIVEN the user has successfully completed PWA installation
- WHEN they open the app in any subsequent session (whether launched from browser or from the installed app icon)
- THEN the install button is not present anywhere in the interface
- AND no install-related UI element is visible

**No Phantom Layout Gaps:**
- GIVEN the app is already installed and the install button is suppressed
- WHEN the page renders
- THEN the location where the install button would have appeared does NOT show an empty gap, broken whitespace, or invisible placeholder element that disrupts the layout

#### Story C4 — No install button shown on unsupported browsers

**iOS Safari / Unsupported Browser — No Button Shown:**
- GIVEN the user is on a browser that does NOT fire the `beforeinstallprompt` event (e.g., iOS Safari, Firefox on Android, Samsung Internet without PWA support)
- WHEN the app loads
- THEN NO install button or install UI element is displayed anywhere in the interface
- AND the absence of the button causes no layout shifts, empty spaces, or broken visual elements

**No JavaScript Console Errors:**
- GIVEN the browser does not support `beforeinstallprompt`
- WHEN the page loads and all JavaScript executes
- THEN no uncaught or unhandled JavaScript errors related to the install prompt feature appear in the browser console

---

## 4. Edge Cases

### Edge Case 1: User installs the PWA, then uninstalls it

**Scenario:** A federal employee installs RIF Shield on their Android home screen, uses it for several weeks, then removes it via long-press > Uninstall.

**Expected behavior:**
- After uninstallation, the app's Service Worker and cached assets MAY remain on the device depending on the browser and OS. This is outside the app's control and is acceptable.
- If the user returns to the app URL in a browser after uninstalling:
  - The app must load normally from the network without errors.
  - The install button MUST reappear, because the browser will fire `beforeinstallprompt` again once its eligibility criteria are re-met. The app must not permanently suppress the install UI based on a prior install event.
  - Data stored in localStorage MUST still be present (browsers do not clear localStorage on PWA uninstall). The user's journal entries, scores, and training records should be intact.
- If the browser cleared the Service Worker upon uninstallation (some browsers do this), the SW must re-register automatically on the next page load without user intervention and without throwing errors.
- The user experience on return should feel equivalent to a fresh install: install button is visible, all existing data is there, the app works normally.

**Unacceptable outcomes:**
- App throws a JavaScript error on load because it expected to be installed.
- The install button never reappears after uninstall.
- User data is unexpectedly missing after reinstall.
- A broken Service Worker state causes a blank screen or offline error for an online user.

---

### Edge Case 2: A Service Worker update is available mid-session

**Scenario:** A developer deploys a new version of the app. A user already has the app open in their browser tab and has been actively using it (e.g., typing a journal entry).

**Expected behavior:**
- The updated Service Worker downloads silently in the background. This is standard browser behavior and must not be overridden.
- The new SW enters a "waiting" state. It does NOT activate while the user has any tab of the app open.
- The user continues their session completely undisturbed. No reload, no interruption, no data loss.
- The new SW activates automatically the next time the user opens the app fresh (closes all tabs and reopens, or relaunches the installed PWA). This is the minimum required behavior for Sprint 4.
- Optional (not required for Sprint 4): A non-blocking, dismissible banner may appear reading something like "A new version of RIF Shield is available. Refresh to update." If this is implemented, it must:
  - Be dismissible with a single tap/click.
  - Never auto-reload the page.
  - Never cause data loss if the user dismisses it.
  - Not appear more than once per session.

**Unacceptable outcomes:**
- The page automatically reloads mid-session, discarding the user's unsaved journal entry.
- The user sees the offline fallback page despite having a working internet connection, due to a SW version conflict.
- An uncaught JavaScript error is thrown during SW update processing.
- The user is stuck in a broken mixed-version state where some assets are old and some are new.

---

### Edge Case 3: The device has no storage available for cache

**Scenario:** A user's device or browser storage quota is exhausted (e.g., a low-end Android device with 16GB storage that is nearly full), and the Service Worker cannot write to the Cache API.

**Expected behavior:**
- The Service Worker installation must fail gracefully. It must NOT crash the app, produce a blank screen, or surface an error to the user.
- The app must still load and function normally by falling through to direct network requests for any assets it could not cache.
- No error message is shown to the end user. Silent degradation is the correct behavior here.
- A `console.warn()` message in the browser DevTools console is acceptable and encouraged for developer debugging.
- Cache write operations must be treated as best-effort, not as guaranteed. If a write fails, the failure is caught and discarded — not propagated as an unhandled error.

**Downstream consequences (acceptable):**
- If the offline fallback page could not be cached due to storage failure, the user will see the browser's native offline error when they go offline. This is acceptable because showing a broken app is worse than showing the browser's default error.
- Partial caching (some assets cached, others not) is acceptable — the uncached assets will be fetched from the network on demand.

**Unacceptable outcomes:**
- Uncaught exception from a failed `Cache.put()` call crashes app initialization.
- Blank screen or JavaScript error presented to the user due to storage failure.
- The app refuses to load at all because Service Worker installation failed.

---

### Edge Case 4: User is on iOS Safari (no beforeinstallprompt event)

**Scenario:** An iPhone-carrying federal employee opens RIF Shield in Safari on iOS 16.

**Expected behavior:**
- iOS Safari does not support the `beforeinstallprompt` event. The programmatic PWA installation flow is not available on this platform.
- The install button must NOT appear anywhere in the UI. A non-functional install button is worse than no button — it creates user confusion and support burden.
- The app must detect the absence of `beforeinstallprompt` support and suppress the install UI entirely, with no visual artifacts (no empty space, no broken element, no spinner).
- No JavaScript errors related to the install prompt feature should appear in the console.
- All other Sprint 4 features (cache versioning, offline fallback) must still function on iOS Safari to the extent the browser supports Service Workers (iOS Safari 14.0+ supports SW with some limitations — cache versioning and offline fallback should work).

**Documented gap (not a bug, not in scope for Sprint 4):**
- iOS users who want to install RIF Shield on their home screen must do so manually via the Share button > "Add to Home Screen". The app provides no guidance for this process in Sprint 4. This is a known limitation and a candidate for Sprint 5 or 6 to address with a static instructional banner for iOS users.

**Unacceptable outcomes:**
- Install button appears on iOS Safari but does nothing when tapped.
- JavaScript error: "Cannot read property 'prompt' of undefined" or similar.
- The offline fallback or cache features break specifically on iOS due to install prompt code interference.

---

## 5. Out of Scope

The following items are explicitly NOT part of Sprint 4 and must not be built, partially implemented, stubbed, or designed during this sprint:

1. **Background Sync** — Queuing offline journal entries and syncing them automatically when connectivity is restored. This is the primary feature of Sprint 5. Do not lay groundwork for it in Sprint 4.

2. **Push Notifications** — Server-initiated alerts to the user's device (e.g., "Your RIF score is at risk", "New training content available", "Agency has announced a RIF action"). Planned for Sprint 6.

3. **Backend or server-side changes of any kind** — This sprint makes zero changes to APIs, databases, authentication services, or server infrastructure. All Sprint 4 work is client-side only.

4. **iOS "Add to Home Screen" manual install instructions** — While the gap is acknowledged in Edge Case 4, no UI guidance, instructional banner, or tooltip for iOS-specific installation is being built in this sprint.

5. **In-app update notification banner** — Alerting the user mid-session that a new version of the app is available is explicitly optional and not required. Silent update on next launch is the acceptable minimum for Sprint 4.

6. **Offline journal entry creation** — Users will see the offline fallback screen when offline. They will not be able to create, edit, or submit new journal entries while offline in this sprint. Full offline data entry requires the Background Sync infrastructure from Sprint 5.

7. **Cache size monitoring or management UI** — There is no user-facing storage usage indicator, storage warning, or cache clearing button being built in this sprint.

8. **Service Worker unregistration or manual cache clearing tool** — No developer tools, debug panels, or user-facing "clear app cache" features.

9. **Changes to the app's design system** — The navy (#0f1c3f) and gold (#c9a227) color palette must not change. No new fonts, no icon library additions, no visual redesign.

10. **New CDN dependencies** — No external JavaScript or CSS libraries may be added without a valid SRI (Subresource Integrity) hash. If any dependency is needed, it must go through the Architect agent review first.

---

## 6. Definition of Done

Sprint 4 is considered complete when ALL of the following conditions are true:

### Feature A — Cache Versioning
- [ ] The Service Worker cache name includes a version identifier that is updated with each new deployment
- [ ] When a new cache version is deployed, the old cache is deleted during the Service Worker `activate` event
- [ ] A returning user receives the updated app on their next page load without needing to manually clear their browser cache
- [ ] No JavaScript console errors occur during Service Worker installation or activation
- [ ] The cache version identifier follows a consistent, predictable naming convention (documented in the Architect handoff)

### Feature B — Offline Fallback
- [ ] A branded offline fallback screen is served when the user is offline and the Service Worker is registered
- [ ] The offline fallback screen is visually consistent with the app's navy/gold design system
- [ ] The fallback screen displays a message confirming that the user's locally saved data is safe
- [ ] The fallback screen does NOT display any interactive buttons that would trigger network requests
- [ ] Raw browser offline error pages are never shown to returning users (those with a registered Service Worker)
- [ ] The app returns to full functionality when the user comes back online and refreshes — no error state persists

### Feature C — PWA Install Prompt
- [ ] The install button appears in the app interface on supported browsers (Chrome, Edge, desktop Chrome) when `beforeinstallprompt` fires
- [ ] Clicking the install button triggers the browser's native install dialog
- [ ] The install button disappears after the user successfully installs the app
- [ ] The install button does NOT appear on iOS Safari or any browser that does not support `beforeinstallprompt`
- [ ] The install button does NOT appear if the user has already installed the app
- [ ] No JavaScript console errors are thrown on any browser (supported or unsupported) related to the install prompt feature
- [ ] Dismissing the prompt does not cause it to reappear within the same session

### General Quality Gates
- [ ] All existing app functionality works correctly after Sprint 4 changes (no regressions)
- [ ] The single HTML file architecture is preserved — no new separate HTML files have been created
- [ ] No changes to the navy/gold design system colors
- [ ] No new CDN dependencies added without SRI hash
- [ ] All new or modified JavaScript functions have JSDoc documentation
- [ ] All innerHTML insertions involving any user-supplied data use `escapeHtml()` for XSS protection
- [ ] QA Agent has reviewed all changes and filed a report graded PASS or PASS_WITH_WARNINGS (no FAIL)
- [ ] The Coordinator Agent has reviewed the QA report and approved the sprint for commit

---

*Sprint 4 PM Output complete. Ready for handoff to Agent A2 (Solutions Architect) per GATE 1.*
