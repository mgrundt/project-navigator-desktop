# External Integrations

**Analysis Date:** Wed Oct 07 2026

## APIs & External Services

**Local application API:**
- FastAPI — authoritative CRUD, dashboard, capacity, overview, PDF reporting, and document extraction service in `backend/app/routers.py`.
  - SDK/Client: typed browser `fetch` adapter in `lib/api.ts`; not a generated SDK.
  - Auth: no API keys, bearer tokens, authentication dependencies, or authorization checks detected in `backend/app/main.py` or `backend/app/routers.py`.
  - Default transport: browser `/api/...` → Next.js rewrite → local FastAPI port 8000; `lib/api.ts`, `next.config.ts`.
  - Optional direct browser origin: `NEXT_PUBLIC_API_URL` in `lib/api.ts`; server proxy target: `BACKEND_URL` in `next.config.ts`.

**Fonts:**
- Google Fonts — Geist and Geist Mono declared with `next/font/google` in `app/layout.tsx`.
  - SDK/Client: Next.js font integration; `app/layout.tsx`.
  - Auth: none configured; no application user data exchange is implemented here.

**Business SaaS / cloud APIs:**
- Not detected in `lib/api.ts`, active route imports, or `backend/app/routers.py`.
- Planner, M365, KI-Register, and compliance lists in `lib/utils-app.ts` are static dashboard guidance, not connected integrations.

**Native IPC, separate implementation:**
- Tauri command bridge — `src/lib/tauri-db.ts` invokes commands registered in `src-tauri/src/main.rs`; no HTTP/FastAPI client in this bridge.
  - SDK/Client: import from `@tauri-apps/api/core` in `src/lib/tauri-db.ts`; dependency absent from the active root `package.json`.
  - Auth: no identity/provider integration detected in `src-tauri/src/main.rs`.
  - Scope: outside active Next.js compilation because `tsconfig.json` excludes `src/` and `src-tauri/`.

## Data Storage

**Databases:**
- Active backend uses local SQLite through Python's standard-library `sqlite3`; `backend/app/database.py`.
  - Connection: `resolve_db_path()` searches, in order, `backend/project_navigator.db`, `backend/projektverwaltung.db`, root `project_navigator.db`, root `projektverwaltung.db`, and `backend/data/projektverwaltung.db`.
  - If no candidate exists, fallback is `backend/project_navigator.db`; implementation in `backend/app/database.py`.
  - Client: direct SQL with `sqlite3.Row` dictionary conversion and one connection per `get_connection()` context; `backend/app/database.py`.
  - Transaction handling: foreign keys enabled, commit on success, rollback on exception, connection close in `finally`; `backend/app/database.py`.
  - Schema: streams, employees, projects, tasks, updates, task_steps, documents; startup table/index creation and task-start-date backfill in `backend/app/database.py`.
  - `backend/project_navigator.db` and `backend/project_navigator_alt.db` exist by directory enumeration. Contents were not inspected; the alternate filename is not a resolver candidate.
- Separate native SQLite — rusqlite with bundled SQLite; `src-tauri/Cargo.toml`, `src-tauri/src/db.rs`.
  - Connection: resolved native app-data directory plus `project-navigator.db`; `src-tauri/src/db.rs:64`.
  - Client: `rusqlite::Connection` opened per command; `src-tauri/src/db.rs`.
  - Not shared with the Python backend; filename, directory, schema fields, and status vocabulary differ between `src-tauri/src/db.rs` and `backend/app/database.py`.

**File Storage:**
- Local filesystem only for SQLite, including ignored `*.db` files; `.gitignore`, `backend/app/database.py`.
- Reports are generated as in-memory bytes and returned as attachments; no report storage service or report directory in `backend/app/pdf_reports.py` and `backend/app/routers.py`.
- Document extraction intends to persist PDF filename, page count, and extracted text in SQLite `documents`, not the original PDF; `backend/app/routers.py:232`, `backend/app/database.py:160`.
- Public SVG assets served by Next.js from `public/file.svg` and `public/globe.svg`; app favicon at `app/favicon.ico`.

**Caching:**
- No Redis, managed cache, or persistent browser domain-data cache detected in `package.json`, `backend/requirements.txt`, or `components/use-api.ts`.
- API results reside in page-local React state and are explicitly reloaded after mutations; `components/use-api.ts`, `app/setup/page.tsx`, `app/heute/page.tsx`.

## Authentication & Identity

**Auth Provider:**
- None detected for the active application; `backend/app/main.py`, `backend/app/routers.py`, `lib/api.ts`.
  - Implementation: direct local API calls without login, session middleware, access-token headers, or resource authorization.
  - CORS permits credentials and local UI origins but is not authentication; `backend/app/main.py`.
  - Keep the local-service boundary explicit when deploying; `backend/main.py` directly binds localhost when executed as a script.

## Monitoring & Observability

**Error Tracking:**
- External error-tracking service not detected in `package.json` or `backend/requirements.txt`.
- Browser request failures become Sonner error toasts and hook error state; `lib/api.ts`, `components/use-api.ts`.

**Logs:**
- Next.js/Uvicorn process output is shown in separate terminal windows; `start_navigator.bat`.
- No application structured logger, metrics exporter, tracing middleware, or persistent log sink detected in `backend/app/main.py`.
- Health endpoint returns static `{"status":"ok"}` without a database read; `backend/app/main.py:45`.

## CI/CD & Deployment

**Hosting:**
- Local browser-based application documented at UI port 3000 and API port 8000; `README.md`, `start_navigator.bat`.
- Root production scripts are `next build` and `next start`; `package.json`. No hosting provider declared in `next.config.ts`.
- Native window configuration targets a separate frontend at `http://localhost:4173` or `../dist`, with empty before-dev/build hooks; `src-tauri/tauri.conf.json`.

**CI Pipeline:**
- Not detected: no tracked `.github/` workflows, container deployment files, or CI scripts found in the root configuration.
- Dependency lock is present for npm (`package-lock.json`), but Python requirements are ranged and omit the imported pypdf dependency (`backend/requirements.txt`, `backend/app/pdf_reports.py`).

## Environment Configuration

**Required env vars:**
- None mandatory in the inspected active code; local defaults are supplied by `next.config.ts` and `lib/api.ts`.
- Optional `BACKEND_URL`: backend origin used by the Next.js rewrite; `next.config.ts`.
- Optional `NEXT_PUBLIC_API_URL`: browser-visible API origin prefix used for JSON and PDF URLs; `lib/api.ts`. Do not put secrets in this public variable.
- No database URL environment variable: database location is filesystem-resolved in `backend/app/database.py`.

**Secrets location:**
- No root `.env*` file detected by filename listing. `.gitignore` ignores `.env`; secret file contents are outside this audit.
- No application credential store or cloud secret manager integration detected in `lib/api.ts` or `backend/app/main.py`.

## Webhooks & Callbacks

**Incoming:**
- Third-party webhooks: none detected in `backend/app/routers.py`.
- JSON endpoints: `/api/meta`, `/api/dashboard`, `/api/capacity`, `/api/overview`; collection GET/POST and DELETE endpoints for streams, employees, projects, tasks; PATCH task; POST update; GET history; GET/PUT steps; `backend/app/routers.py`.
- Downloads: `/api/reports/upcoming.pdf` and `/api/reports/heute.pdf`, exposed as links in `lib/api.ts`, `app/page.tsx`, `app/heute/page.tsx`.
- Extraction route: POST `/api/documents/extract` exists in `backend/app/routers.py`, but no caller is exposed by `lib/api.ts`. Its `file: Any = None` signature lacks multipart `File(...)` binding; do not treat upload integration as verified.
- Operational endpoints `/`, `/health`, and FastAPI docs `/docs`; `backend/app/main.py`, `README.md`.

**Outgoing:**
- No outgoing business-service webhooks or asynchronous callbacks detected in `backend/app/routers.py` or `backend/app/pdf_reports.py`.
- Browser mutations await the API and reload local view state; `app/heute/page.tsx`, `app/setup/page.tsx`.
- Native command invocations remain within the separate Tauri implementation; `src/lib/tauri-db.ts`, `src-tauri/src/main.rs`.

---

*Integration audit: Wed Oct 07 2026*
