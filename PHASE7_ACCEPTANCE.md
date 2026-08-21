# Corrective frontend completion — resumable checklist

Updated: 2026-08-20 UTC

## Baseline reproduced

- [x] Preserve Phase 1–6 workspace, database, migrations, deployment and security.
- [x] Inspect supplied reference (`design/design.png`; `design/reference.png` is absent).
- [x] Inspect Angular shell, routes, guards, API services and deployed assets.
- [x] Root cause identified: authentication pages/routes do not exist, guard redirects to Home, protected shell links are always rendered, and primary Home/Add controls are incomplete.
- [x] Capture baseline browser screenshots and console/network errors (`artifacts/baseline`; corrective captures in `artifacts/workspace`).

## Repair

- [x] Authentication state, Login, Person/Organization Registration and safe password-recovery state.
- [x] Guest/authenticated desktop header and mobile navigation with active states.
- [x] Functional Add Lost/Found chooser and return URL behavior.
- [x] Complete zero-data Home with live statistics, categories and explicit states.
- [x] Complete Explore filters, URL synchronization and states.
- [x] Complete create/edit/photo workflow and Item Details actions.
- [x] Connect Favorites and My Listings.
- [x] Complete Profile, Settings and safe public profile.
- [x] Verify Messages, Notifications and SignalR navigation.
- [x] Verify Claims, Exchange, Ratings, QR and Matches UI.
- [x] Verify Reports and role-protected moderation UI.
- [x] Add Not Found and explicit unavailable states for credential-dependent features.
- [x] Complete EN/KA/RU strings, dark mode and accessibility review.

## Verification and deployment

- [x] Expand Angular unit/component tests (14 passing tests across 2 files).
- [x] Backend Release build and complete tests (34/34 passing; build has 0 warnings and 0 errors).
- [x] Frontend tests and production build (14/14 passing; build succeeds with budget warnings recorded).
- [x] Browser E2E through isolated loopback Nginx (full two-user workflow 1/1; responsive/auth workflow 3/3).
- [x] Inspect 390/768/1440 screenshots (`artifacts/final`).
- [x] Scan bundle for secrets and development URLs (`artifacts/final/bundle-scan.json`: all findings zero).
- [x] Prepare versioned release artifact `lostfound-20260820T111700Z-phase7` with SHA-256 manifest; do not activate it.
- [x] Create and atomically activate versioned release `lostfound-20260820T111700Z-phase7`.
- [x] Validate systemd, Nginx, health, public workflows and application rollback/forward rehearsal.
- [x] Remove controlled disposable data and verify zero-data Home (Phase 7 users/items/claims/uploads all zero).
- [x] Update corrective completion evidence in this checklist.
