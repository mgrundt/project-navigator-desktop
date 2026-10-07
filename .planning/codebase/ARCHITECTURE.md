<!-- refreshed: Wed Oct 07 2026 -->
# Architecture

**Analysis Date:** Wed Oct 07 2026

## System Overview

```text
Browser: active Next.js App Router UI
  app/layout.tsx -> components/providers.tsx + components/app-shell.tsx
  app/page.tsx | app/heute/page.tsx | app/setup/page.tsx
  app/kapazitaeten/page.tsx | app/uebersicht/page.tsx
                        |
  components/use-api.ts -> lib/api.ts (fetch /api/...)
                        |
  next.config.ts (Next.js HTTP rewrite to FastAPI :8000)
                        |
  backend/main.py -> backend/app/main.py -> backend/app/routers.py
                        |                       |
  backend/app/schemas.py (contracts)     backend/app/pdf_reports.py
                        |                       |
                 backend/app/database.py
                        |
          Local SQLite: backend/project_navigator.db

Separate native implementation (not the root runtime):
  index.html -> src/main.tsx -> src/App.tsx -> src/lib/tauri-db.ts
                        | Tauri invoke
  src-tauri/src/main.rs -> src-tauri/src/db.rs
                        |
          Native app-data/project-navigator.db
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | German document, fonts, global CSS, shared providers/shell | `app/layout.tsx` |
| Providers | Theme, tooltips, notifications | `components/providers.tsx` |
| App shell | Responsive sidebar/mobile navigation and content frame | `components/app-shell.tsx` |
| Dashboard | Guidance, KPIs, upcoming tasks, PDF link | `app/page.tsx` |
| Today focus | Employee grouping, task steps/checkups, status/follow-up submission | `app/heute/page.tsx` |
| Capacity | Workload charts, filters, employee Gantt | `app/kapazitaeten/page.tsx`, `components/employee-gantt.tsx` |
| Overview | Stream → project → task → steps/history drilldown | `app/uebersicht/page.tsx` |
| Setup | CRUD panels, deletion confirmation, inline edits, step replacement | `app/setup/page.tsx` |
| API hook | Page-local asynchronous loading/error/data/reload state | `components/use-api.ts` |
| HTTP adapter | Typed requests, JSON errors, 204 handling, PDF URLs | `lib/api.ts` |
| Proxy configuration | Same-origin `/api` forwarding | `next.config.ts` |
| API bootstrap | Lifespan database initialization, CORS, router, health | `backend/app/main.py` |
| API controller | HTTP statuses, relationship existence checks, response model construction | `backend/app/routers.py` |
| Contracts | Input validation and output shaping | `backend/app/schemas.py`, `lib/types.ts` |
| Persistence/domain queries | Schema, transactions, CRUD, task updates, aggregates | `backend/app/database.py` |
| Reporting | Focus-date enrichment, HTML rendering, PDF finalization | `backend/app/pdf_reports.py` |
| Native frontend/commands | Separate tabbed CRUD UI and SQLite command handlers | `src/App.tsx`, `src/lib/tauri-db.ts`, `src-tauri/src/db.rs` |

## Pattern Overview

**Overall:** Client-driven Next.js frontend over a synchronous FastAPI/SQLite backend; a separate native implementation coexists in `src/` and `src-tauri/`.

**Key Characteristics:**
- Feature pages use `"use client"`, typed API functions, and page-local hooks instead of server-side domain loaders; `app/page.tsx`, `app/setup/page.tsx`, `components/use-api.ts`.
- Next.js is the UI host and HTTP proxy, not the business API; `next.config.ts`, `backend/app/routers.py`.
- Backend uses module functions and dictionaries rather than repository classes or an ORM; `backend/app/database.py`.
- Domain aggregation and business rules are concentrated in persistence/report modules; `backend/app/database.py`, `backend/app/pdf_reports.py`.
- Root build boundary is explicit: `tsconfig.json` excludes `src/` and `src-tauri/`; `package.json` contains only Next.js scripts.

## Layers

**Presentation:**
- Purpose: render German-language portfolio/task management and collect user input.
- Location: `app/`, `components/`, `components/ui/`.
- Contains: route components, local panel components, reusable primitives, chart/Gantt rendering.
- Depends on: `lib/api.ts`, `lib/types.ts`, `lib/utils-app.ts`, React, Base UI, Recharts.
- Used by: browser routes declared by `app/**/page.tsx` and framed by `app/layout.tsx`.

**Client transport/state:**
- Purpose: centralize request construction and reusable loading behavior.
- Location: `lib/api.ts`, `components/use-api.ts`.
- Contains: `request<T>`, `api` functions, `pdfUrls`, `useApi<T>`.
- Depends on: browser fetch, React hooks, Sonner, `lib/types.ts`.
- Used by: every active feature page under `app/`.

**HTTP controllers/contracts:**
- Purpose: expose REST endpoints and validate/serialize API inputs/outputs.
- Location: `backend/app/routers.py`, `backend/app/schemas.py`.
- Contains: `/api` router, model classes, date conversion, relationship checks, response headers.
- Depends on: FastAPI, Pydantic, `backend/app/database.py`, `backend/app/pdf_reports.py`.
- Used by: `backend/app/main.py` and frontend transport through `next.config.ts`.

**Persistence and domain computation:**
- Purpose: maintain authoritative records and produce composed read models.
- Location: `backend/app/database.py`.
- Contains: schema/bootstrap migration, connection context manager, direct SQL CRUD, dashboard/capacity/overview functions.
- Depends on: Python `sqlite3`, UUID, local filesystem, local date/time.
- Used by: controllers and PDF reports in `backend/app/routers.py`, `backend/app/pdf_reports.py`.

**Reporting:**
- Purpose: enrich urgency labels and generate downloadable PDFs.
- Location: `backend/app/pdf_reports.py`.
- Contains: focus-date parsing, sorting, HTML escaping, HTML-to-PDF rendering, metadata finalization.
- Depends on: database module, PyMuPDF, pypdf.
- Used by: dashboard read model and PDF response endpoints in `backend/app/routers.py`.

**Separate native stack:**
- Purpose: tabbed desktop CRUD through IPC, independent of FastAPI.
- Location: `src/`, `src-tauri/`, `index.html`.
- Depends on: Tauri APIs/commands, rusqlite, native application-data filesystem.
- Used by: native entry in `src-tauri/src/main.rs`; no active root Next.js route imports this stack.

## Data Flow

### Primary Request Path

1. Dashboard mounts and supplies `api.dashboard` to `useApi` (`app/page.tsx:29`).
2. The hook loads on mount, tracks loading/data/error, and notifies failures (`components/use-api.ts:13`).
3. Typed fetch requests `/api/dashboard` using optional browser base URL (`lib/api.ts:23`, `lib/api.ts:48`).
4. Default same-origin request is rewritten to the configured FastAPI origin (`next.config.ts:9`).
5. Controller combines database KPI counts and report urgency enrichment (`backend/app/routers.py:50`).
6. Database functions open/close SQLite connections and return dictionaries (`backend/app/database.py:62`, `backend/app/database.py:557`).
7. Pydantic produces the JSON response; React stores it and renders KPIs/tasks (`backend/app/schemas.py:151`, `app/page.tsx:37`).

### Task Checkup and Follow-Up

1. Task card submits status/comment/follow-up and disables itself while saving (`app/heute/page.tsx:28`).
2. `api.addTaskUpdate` POSTs to `/api/tasks/{id}/updates` (`lib/api.ts:89`).
3. Router validates through `TaskUpdateCreate` and serializes the date (`backend/app/routers.py:177`, `backend/app/schemas.py:121`).
4. One transaction inserts an update and changes task status/follow-up/last-check timestamp; completed status clears follow-up (`backend/app/database.py:477`).
5. Success toast and parent reload refresh authoritative state (`app/heute/page.tsx:37`, `components/use-api.ts:13`).

### PDF Download

1. Dashboard/today buttons render anchor links using `pdfUrls` (`app/page.tsx:50`, `lib/api.ts:98`).
2. FastAPI reads tasks and renders HTML through PyMuPDF, then sets PDF metadata using pypdf (`backend/app/pdf_reports.py:119`).
3. Router returns in-memory bytes with attachment filename and `application/pdf` (`backend/app/routers.py:214`).

### Startup and Native Flow

- Active startup: `start_navigator.bat:8` launches Uvicorn → `backend/main.py:3` → lifespan `init_db()` in `backend/app/main.py:10`; frontend runs via `package.json`.
- Native startup: `src/main.tsx:6` mounts `src/App.tsx`; its effect invokes `initDb` and collection refresh (`src/App.tsx:84`). Commands are dispatched by `src-tauri/src/main.rs:14` to a distinct native app-data database (`src-tauri/src/db.rs:64`).

**State Management:**
- Keep feature state in React `useState`/`useMemo`; loader data is per hook instance, not globally cached (`components/use-api.ts`, `app/setup/page.tsx`).
- Setup initial data loads independent collections with `Promise.all`; mutations reload the view (`app/setup/page.tsx:83`).
- Domain state persists in SQLite; database connections are not shared global singletons (`backend/app/database.py:62`).
- UI theme is a cross-cutting provider; system theme selection is disabled (`components/providers.tsx:9`).

## Key Abstractions

**API contracts:**
- Purpose: snake_case domain entities plus aggregate read models for dashboard, capacity, overview.
- Examples: `lib/types.ts`, `backend/app/schemas.py`.
- Pattern: manually mirrored TypeScript types/Pydantic models; update both when changing a response. Do not substitute camelCase native types from `src/lib/types.ts`.

**Connection context:**
- Purpose: guarantee transaction completion and resource release.
- Examples: `backend/app/database.py:62`, `backend/app/database.py:534`.
- Pattern: `with get_connection() as conn`, parameterized SQL, dictionary conversion. Combine related writes in one context as `add_task_update` does.

**Aggregate read models:**
- Purpose: supply UI-ready relational views without frontend join requests.
- Examples: `backend/app/database.py:324`, `backend/app/database.py:577`, `backend/app/database.py:600`.
- Pattern: joined task select; bucket dictionaries for overview; Python grouping for capacity.

**UI primitives and API hook:**
- Purpose: shared interaction/styling and loading conventions.
- Examples: `components/ui/button.tsx`, `components/select-field.tsx`, `components/use-api.ts`.
- Pattern: named reusable exports composed by routes; use Base UI wrapper APIs, not assumed Radix APIs.

## Entry Points

**Web application:**
- Location: `app/layout.tsx`, route `app/**/page.tsx`, scripts in `package.json`.
- Triggers: Next.js dev/start server and browser navigation.
- Responsibilities: shared frame/providers plus client feature rendering.

**API application:**
- Location: `backend/main.py`, `backend/app/main.py`.
- Triggers: Uvicorn `main:app` from `backend/`, or direct execution of `backend/main.py`.
- Responsibilities: schema initialization, middleware, router and operational endpoints.

**Convenience launcher:**
- Location: `start_navigator.bat`.
- Triggers: Windows double-click.
- Responsibilities: start two terminal processes; not a packaged desktop launcher.

**Native application:**
- Location: `index.html`, `src/main.tsx`, `src-tauri/src/main.rs`.
- Triggers: separate native/frontend build tooling, not root npm scripts.
- Responsibilities: mount tabbed UI, register IPC handlers, manage native window; build operability is not verified.

## Architectural Constraints

- **Threading:** synchronous FastAPI `def` routes use blocking SQLite/PDF operations; the extraction `async def` also performs synchronous PDF parsing/SQL after reading the upload (`backend/app/routers.py`). No custom worker queue/thread manager detected.
- **Global state:** FastAPI app/router are module objects (`backend/app/main.py`, `backend/app/routers.py`); API origin constants and `api` object are module-level (`lib/api.ts`); DB path/status/query constants are module-level (`backend/app/database.py`). No global connection pool detected.
- **Circular imports:** no cycle detected among inspected active modules; main imports routers, routers imports database/reporting/schemas, reporting imports database (`backend/app/main.py`, `backend/app/routers.py`, `backend/app/pdf_reports.py`).
- **Persistence:** local SQLite, cascade deletion, filesystem-selected database, no versioned migration framework (`backend/app/database.py`). Startup backfills task dates, so running the backend can modify existing data.
- **Runtime separation:** root alias `@/*` resolves to `./*`; native source expects a different source-root alias and is excluded (`tsconfig.json`, `src/App.tsx`). No shared schema/database adapter connects the stacks.
- **Local trust boundary:** no authentication/authorization; local CORS allowlist is not access control (`backend/app/main.py`, `backend/app/routers.py`).
- **Framework guidance:** `AGENTS.md` requires reading installed Next.js guides; relevant proxy guide is `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/rewrites.md`. No project-local skill directory detected.

## Anti-Patterns

### Treating Both Implementations as One Feature Stack

**What happens:** similar entities exist in active `lib/types.ts`/`backend/app/database.py` and separate `src/lib/types.ts`/`src-tauri/src/db.rs`.
**Why it's wrong:** native camelCase types, statuses, cascade behavior, and app-data DB are not the active HTTP contracts or database; native code is excluded by `tsconfig.json`.
**Do this instead:** implement active features in `app/`, `components/`, `lib/`, and `backend/app/`; scope native work explicitly and validate its independent build configuration (`package.json`, `src-tauri/tauri.conf.json`).

### Hiding Initial Load Failures Behind Loading UI

**What happens:** routes check `loading || !data` but do not render the hook's `error` (`app/page.tsx:31`, `app/uebersicht/page.tsx:20`).
**Why it's wrong:** an initial failed request leaves null data and a persistent loading screen after the transient toast (`components/use-api.ts`).
**Do this instead:** consume the existing error/reload fields from `components/use-api.ts` and make loading, failure, and empty states distinct using `components/states.tsx`.

### Mixing Urgency Rules into PDF Infrastructure

**What happens:** dashboard controller imports urgency enrichment from the PDF module (`backend/app/routers.py:53`).
**Why it's wrong:** dashboard/API startup is coupled to PDF dependencies, including pypdf which is undeclared in `backend/requirements.txt` (`backend/app/pdf_reports.py:8`).
**Do this instead:** preserve one shared urgency rule for dashboard/reports; isolate pure focus computation from PDF imports when changing this boundary, and synchronize declared dependencies.

## Error Handling

**Strategy:** explicit HTTP errors at controllers, Pydantic validation at the boundary, SQLite context rollback, frontend Error/toast handling.

**Patterns:**
- Relationship existence checks return 400; missing delete/update/history/steps targets return 404 (`backend/app/routers.py`).
- `model_dump(exclude_unset=True)` preserves patch omission; date fields convert to strings before SQL (`backend/app/routers.py:159`).
- SQLite exceptions rollback and re-raise; no global exception-to-HTTP translation detected (`backend/app/database.py:62`, `backend/app/main.py`).
- Fetch adapter extracts `detail`, maps validation error messages, handles 204, and throws `Error` (`lib/api.ts:23`).
- Mutation handlers use `try/catch/finally` and saving state (`app/heute/page.tsx:28`); hook handles loader error state and toasts (`components/use-api.ts`).

## Cross-Cutting Concerns

**Logging:** process console output in `start_navigator.bat`; no custom structured logging in `backend/app/main.py`.
**Validation:** Pydantic dates/required fields/minimum string lengths (`backend/app/schemas.py`); SQL allowlist/parameters (`backend/app/database.py`); local form validation in `app/setup/page.tsx`. Status fields are strings rather than enforced enums.
**Authentication:** none detected in `backend/app/main.py`, `backend/app/routers.py`, or `lib/api.ts`.

---

*Architecture analysis: Wed Oct 07 2026*
