# Lost & Found production operations

## Architecture and layout

Nginx serves the Angular SPA and proxies `/api`, `/health`, `/uploads`, and the SignalR hub to Kestrel on loopback. PostgreSQL and the durable matching queue share the local PostgreSQL 16 instance. The API runs as the non-login `lostfound` system account.

- Backend releases: `/opt/lostfound/backend/releases/<UTC release>`; active symlink: `/opt/lostfound/backend/current`
- Frontend releases: `/opt/lostfound/frontend/releases/<UTC release>`; active symlink: `/opt/lostfound/frontend/current`
- Uploads: `/var/lib/lostfound/uploads`
- Data Protection keys: `/var/lib/lostfound/keys`
- Backups: `/var/backups/lostfound`
- Environment: `/etc/lostfound/lostfound.env` (`root:root`, mode `600`)

## Environment variable names

Required/production variables include `ASPNETCORE_ENVIRONMENT`, `ASPNETCORE_URLS`, `ConnectionStrings__DefaultConnection`, `Jwt__SigningKey`, `Jwt__Issuer`, `Jwt__Audience`, `Jwt__AccessTokenMinutes`, `Jwt__RefreshTokenDays`, `Storage__RuntimeRoot`, `DataProtection__KeyPath`, `Cors__AllowedOrigins__0`, and `PublicUrl`. Optional external integrations remain disabled; future configuration requires `Google__ClientId`, `Google__ClientSecret`, `AiMatching__Provider`, `AiMatching__ApiKey`, `ImageModeration__Provider`, `ImageModeration__ApiKey`, `Email__Provider`, and `Email__ApiKey`.

## Deployment and migrations

Run `deploy/deploy-release.sh` as root with a UTC release ID. It uses the pinned project-local Node path, lockfile, tests, versioned releases, and atomic symlinks. Before schema changes, create and verify a custom-format `pg_dump`, generate an idempotent EF script, review for destructive statements, and apply pending migrations in a controlled window. Database schema rollback is never automatic; confirm backward compatibility before application rollback.

## Operations

- Validate/reload Nginx: `nginx -t && systemctl reload nginx`
- Service: `systemctl status|restart lostfound-api`
- Safe logs: `journalctl -u lostfound-api --since today` (do not paste tokens or QR URLs)
- Health: `curl -fsS http://127.0.0.1:5080/health/live` and `/health/ready`
- Queue: inspect aggregate status/count/age in `MatchingJobs`; never edit payloads manually. Failed jobs retain safe error codes and can be re-enqueued by an authorized rescan.
- Back up uploads independently with filesystem permissions preserved. Data Protection keys must be included in protected disaster-recovery backups.

## Rollback and recovery

Use `deploy/rollback-release.sh <backend-release> <frontend-release>`. It switches symlinks atomically, validates Nginx, restarts the API, and checks readiness. It does not roll back the database. PostgreSQL dump restoration or a DigitalOcean Snapshot is last-resort recovery and must target a rehearsed environment before production.

## Domain and HTTPS

This deployment is HTTP-by-IP until a real DNS name is provided and verified. Do not enable HSTS or request a certificate yet. After the user supplies the domain and DNS points to this server, validate HTTP, obtain explicit approval, then use Certbot/ACME, verify HTTPS and WebSockets, update `PublicUrl` and CORS, and only then consider HSTS.

Google Login, external AI/image moderation, and email delivery remain deferred until real credentials and provider choices are supplied.
