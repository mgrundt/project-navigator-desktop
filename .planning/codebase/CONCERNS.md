# Codebase Concerns & Technical Debt

**Analysis Date:** 2026-10-07

## Tech Debt

### 1. Dual/Legacy Architecture Artifacts
- **Issue:** The repository contains a legacy or alternative Tauri/Rust implementation in `src/` and `src-tauri/` alongside the active Next.js + FastAPI architecture.
- **Files:** `src/App.tsx`, `src/main.tsx`, `src/lib/tauri-db.ts`, `src-tauri/src/main.rs`, `src-tauri/src/db.rs`, `index.html`.
- **Impact:** Potential developer confusion regarding which frontend and database logic is active; build clutter.
- **Fix approach:** Archive or isolate `src/` and `src-tauri/` into a separate branch or `legacy/` directory if Tauri is no longer actively targeted.

### 2. Missing Dependency in `backend/requirements.txt`
- **Issue:** `backend/app/pdf_reports.py` imports `pypdf`, but `pypdf` is not declared in `backend/requirements.txt` (only `PyMuPDF` is listed).
- **Files:** `backend/requirements.txt`, `backend/app/pdf_reports.py` (line 15: `from pypdf import PdfReader, PdfWriter`).
- **Impact:** Clean environments running `pip install -r requirements.txt` will fail at runtime when generating PDF reports with `ModuleNotFoundError: No module named 'pypdf'`.
- **Fix approach:** Add `pypdf>=5.0.0` to `backend/requirements.txt`.

### 3. Lack of Database Migration Framework
- **Issue:** SQLite schema evolution is currently handled via manual, imperative checks in `backend/app/database.py` (e.g., `_ensure_task_start_date` checking `PRAGMA table_info(tasks)` and running `ALTER TABLE`).
- **Files:** `backend/app/database.py`.
- **Impact:** Hard to trace database schema history across revisions, risky for complex column renames or table restructuring.
- **Fix approach:** Introduce lightweight migration tracking (or Alembic / Yoyo migrations) for SQLite.

---

## Known Bugs & Edge Cases

### 1. SQLite File Locking Under Concurrent Requests
- **Symptoms:** `sqlite3.OperationalError: database is locked` on rapid concurrent write operations.
- **Root Cause:** Direct `sqlite3.connect()` per request without WAL mode (`PRAGMA journal_mode=WAL`) or a connection pool.
- **Files:** `backend/app/database.py` (`get_connection` function).
- **Fix:** Enable WAL mode and set a busy timeout upon opening connections:
  ```python
  conn.execute("PRAGMA journal_mode = WAL;")
  conn.execute("PRAGMA busy_timeout = 5000;")
  ```

### 2. Database Path Ambiguity
- **Symptoms:** Risk of reading/writing to different database files if started from different working directories.
- **Files:** `backend/app/database.py` (`resolve_db_path()` function).
- **Impact:** If `project_navigator.db` exists in both root and `backend/`, different commands may point to different databases.
- **Fix approach:** Standardize database location via an explicit environment variable (`PROJECT_NAVIGATOR_DB_PATH`) with a deterministic absolute fallback.

---

## Security Considerations

### 1. Unauthenticated API Endpoints
- **Risk:** All endpoints (`/api/tasks`, `/api/projects`, `/api/streams`, `/api/employees`) have no authentication, authorization, or CSRF protection.
- **Current Context:** Intended as a local desktop / intranet single-user utility tool.
- **Mitigation:** If deployed beyond `localhost`, an authentication layer (e.g. session tokens or basic auth) and strict CORS origins must be configured.

### 2. Wildcard CORS Configuration
- **Risk:** `backend/app/main.py` configures `allow_origins=["*"]`, `allow_methods=["*"]`, `allow_headers=["*"]`.
- **Mitigation:** Restrict `allow_origins` to `["http://localhost:3000", "http://127.0.0.1:3000"]`.

---

## Fragile Areas

### 1. Multi-Step PDF Generation Pipeline
- **Files:** `backend/app/pdf_reports.py`
- **Why Fragile:** Merges PyMuPDF HTML-to-PDF rendering with `pypdf` canvas overlays. Layout shifts or formatting errors in dynamic task notes can cause text clipping or unexpected pagination.
- **Safe Modification:** Test PDF generation across varying data volumes (tasks with 0 steps, tasks with 20 steps, long comments).

### 2. Dual-Process Development Setup
- **Files:** `start_navigator.bat`
- **Why Fragile:** Starts two independent command windows (`uvicorn` and `next dev`). If one process crashes (e.g. backend port collision), the frontend may remain open and show generic network errors without clear logging.
- **Safe Modification:** Ensure error output is clearly surfaced to the user.

---

## Test Coverage Gaps

- **What's not tested:**
  - Automated tests for all CRUD API endpoints (`backend/app/routers.py`).
  - Validation of cascade deletions (e.g., deleting a stream cascades to projects and tasks).
  - Gantt chart time calculations and lane allocation algorithms (`components/employee-gantt.tsx`).
- **Priority:** High for API endpoint regression testing; Medium for UI unit testing.

