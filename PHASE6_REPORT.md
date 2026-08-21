# Phase 6 — Production Deployment

## Resume and release audit

- Preserved all Phase 1–5 source, migrations, database data, uploads, and reports. No prior Lost & Found Nginx site, systemd unit, or release tree existed.
- Git still has no commits and no configured author identity, so no checkpoint commit was created. No remote, staging, push, reset, DNS, SSH, UFW, or DigitalOcean firewall change was made.
- Production runtime: Ubuntu 24.04, .NET SDK 10.0.111/runtime 10.0.11, PostgreSQL 16.14, Nginx 1.24.0, Node 24.15.0, npm 11.12.1, Angular CLI 22.1.4, Angular 22.1.2, TypeScript 6.0.3.

## Database safety

- Protected backup: `/var/backups/lostfound/20260820T071731Z_phase5_pre_phase6.dump`, 81,282 bytes, custom format, `root:root`, mode `600`.
- Restore rehearsal passed in a uniquely named temporary database: seven Phase 5 migrations, eight taxonomy categories, and all six representative tables verified. The rehearsal database was dropped; remaining count was zero. `myapi_db` was not used as the restore target.
- Applied additive migration `20260820071700_Phase6DurableMatchingJobs`. The reviewed Up migration creates only `MatchingJobs`, its restrictive Item foreign key, and two indexes. An idempotent script was generated and scanned for destructive Up operations.
- Migration history contains all eight migrations through `Phase6DurableMatchingJobs`; EF reports no pending model changes. Unique ItemMatch/job indexes and `RESTRICT` job deletion are present.

## Application completion and verification

- Replaced request-time matching with a PostgreSQL durable queue, `FOR UPDATE SKIP LOCKED` claiming, one active row per Item, hosted scoped worker, abandoned-job recovery, bounded batching, retry count, exponential backoff, terminal failure state, graceful cancellation, engine version, safe error codes, and idempotent matching/notification behavior.
- Restart survival passed: a pending job was seeded while the API was stopped, completed after service restart, and its exact Item/user/job records were removed (zero remaining).
- Added rotating, SHA-256-hashed database refresh tokens with configurable access/refresh lifetimes and restriction-time revocation.
- Fixed the exact Claim multi-collection warning with a targeted `AsSplitQuery`; the full production workflow emitted neither that warning nor the prior query-filter warning.
- Upload storage is outside releases and now validates declared MIME plus PNG/JPEG/WebP magic bytes, generated filenames, size controls, and safe path handling.
- Backend Release build passed with zero warnings/errors; backend tests: 34 passed, 0 failed.
- Frontend security tests: 3 passed (guard redirect, bearer interceptor, private match-explanation filtering). Production dependency audit: zero vulnerabilities. Angular production build passed with no localhost URL or secret found in the deployed bundle.

## Deployment

- Active backend: `/opt/lostfound/backend/releases/20260820T075236Z` via `/opt/lostfound/backend/current`.
- Active frontend: `/opt/lostfound/frontend/releases/20260820T075236Z` via `/opt/lostfound/frontend/current`.
- Multiple previous backend/frontend releases remain under their versioned `releases` directories.
- Runtime uploads: `/var/lib/lostfound/uploads` (`lostfound:lostfound`, mode `755`). Data Protection keys: `/var/lib/lostfound/keys` (`lostfound:lostfound`, mode `750`). The key set remained byte-identical across restart.
- API service account: system user/group `lostfound`, UID 999, non-login shell `/usr/sbin/nologin`. `lostfound-api.service` is enabled, active, hardened, and runs as that account.
- Kestrel listens only on `127.0.0.1:5080`; PostgreSQL only on `127.0.0.1/[::1]:5432`; Nginx is the only application listener on public port 80.
- Nginx validation and systemd unit validation passed. Nginx provides SPA fallback, API/health/upload proxying, real SignalR WebSocket upgrade, caching, QR access-log suppression, hidden/sensitive-file denial, CSP and security headers. Swagger is explicitly unavailable in Production.

## Smoke, rollback, and security

- Local and public-IP home, API search, readiness, and SPA fallback returned 200. `/health/live` and `/health/ready` are healthy through Kestrel and Nginx.
- Full disposable five-role workflow passed through production Nginx, including registration/login, refresh rotation, matching queue and notifications, Match privacy/authorization, reports/moderation, suspension/token revocation, Admin-only blocking, conversations, active-Claim safety, audit privacy, and cleanup.
- SignalR negotiate and an actual WebSocket handshake passed through Nginx.
- Auth rate limiting returned 429 after ten requests. Hidden files return 403, invalid API routes 404, and QR plaintext-token paths are absent from Nginx access logs.
- Application rollback rehearsal switched from the new release to the preserved prior release, verified readiness, and switched forward again. The database was not rolled back.
- Final disposable users, roles, Items, Claims, Exchanges, jobs, matches, notifications, reports, blocks, messages, moderation records, audit records, and refresh tokens: zero.
- Environment, systemd, Nginx, frontend bundle, Git-ignore, DTO/privacy, listener, permission, and secret-pattern checks passed. No secret value is stored in source, release bundles, Nginx, or systemd units.

## HTTPS, external credentials, and manual actions

HTTPS is **not active**. No real domain was provided or verified, no DNS was changed, no certificate was requested, and HSTS is intentionally absent. The application is temporarily available at `http://46.101.134.170`.

Deferred credential names only: `Google__ClientId`, `Google__ClientSecret`, `AiMatching__ApiKey`, `ImageModeration__ApiKey`, `Email__Provider`, and `Email__ApiKey`. AI/image providers remain disabled; Google Login and email delivery remain deferred.

Next manual actions:

1. Provide the intended production domain and point its A/AAAA records to this server outside this deployment session.
2. After DNS propagation, provide explicit approval for certificate issuance.
3. Update `PublicUrl`, `PublicWebBaseUrl`, and `Cors__AllowedOrigins__0` to the verified HTTPS origin, validate HTTP/SignalR, then issue the certificate and consider HSTS only after HTTPS verification.
4. Add protected off-server backup/retention for PostgreSQL dumps, uploads, and Data Protection keys, plus a DigitalOcean Snapshot schedule.

Known operational note: initial PostgreSQL readiness immediately after API restart can take several seconds on this small server; deployment/rollback scripts use bounded connection-refused retries and do not switch database schemas backward.
