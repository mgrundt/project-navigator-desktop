# Codebase Structure

**Analysis Date:** Wed Oct 07 2026

## Directory Layout

```text
project-navigator-desktop-1/
├── app/                         # Active Next.js App Router
│   ├── layout.tsx               # Root document/providers/navigation frame
│   ├── page.tsx                 # Dashboard (/)
│   ├── globals.css              # Active Tailwind v4 theme
│   ├── favicon.ico
│   ├── heute/page.tsx            # Today focus
│   ├── kapazitaeten/page.tsx     # Capacity/charts/Gantt
│   ├── uebersicht/page.tsx       # Portfolio hierarchy
│   └── setup/page.tsx            # CRUD and task steps
├── components/                  # Active shared components and API hook
│   ├── ui/                      # Base UI/shadcn primitives
│   ├── app-shell.tsx
│   ├── providers.tsx
│   ├── employee-gantt.tsx
│   └── use-api.ts
├── lib/                         # Active HTTP client/types/helpers
│   ├── api.ts
│   ├── types.ts
│   ├── utils.ts
│   └── utils-app.ts
├── backend/                     # Active FastAPI service
│   ├── main.py                  # Uvicorn import entry
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # App, lifespan, CORS, health
│   │   ├── routers.py           # /api endpoints
│   │   ├── schemas.py           # Pydantic contracts
│   │   ├── database.py          # SQL, schema, domain aggregates
│   │   └── pdf_reports.py       # PDF rendering/focus enrichment
│   ├── .venv/                  # Ignored local Python environment
│   ├── project_navigator.db     # Local DB; existence only inspected
│   └── project_navigator_alt.db # Alternate DB; not resolver candidate
├── public/                      # Static SVG assets
├── src/                         # Separate React/native frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   └── lib/
│       ├── types.ts
│       └── tauri-db.ts
├── src-tauri/                   # Separate native Rust/Tauri implementation
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       └── db.rs
├── index.html                   # Separate src/main.tsx mount
├── next.config.ts               # Active API rewrites/Turbopack root
├── tsconfig.json                # Root aliases; excludes src/src-tauri
├── postcss.config.mjs            # Active Tailwind PostCSS
├── components.json              # UI generator config; CSS path mismatch
├── package.json                 # Next.js npm scripts/dependencies
├── package-lock.json
├── start_navigator.bat           # Windows Next.js + FastAPI dev launcher
├── README.md                    # Active stack/start instructions
├── AGENTS.md                    # Framework-specific agent constraints
├── CLAUDE.md                    # Present; not loaded for this map
├── .planning/codebase/          # Generated codebase reference documents
├── .next/                       # Ignored Next.js output
└── node_modules/                # Ignored npm install; Next.js local guides
```

## Directory Purposes

**`app/`:**
- Purpose: active route tree; use root `app/`, not nonexistent `src/app/`.
- Contains: server root layout, client feature pages, shared CSS/favicon.
- Key files: `app/layout.tsx`, `app/page.tsx`, `app/setup/page.tsx`, `app/kapazitaeten/page.tsx`.
- No active `app/api/` handlers detected; `/api` is forwarded by `next.config.ts`.

**`components/`:**
- Purpose: reusable active presentation and loading infrastructure.
- Contains: shell/providers, Gantt, select wrapper, badges, page headers, empty/loading states, `useApi` hook, `ui/` primitives.
- Key files: `components/app-shell.tsx`, `components/providers.tsx`, `components/employee-gantt.tsx`, `components/use-api.ts`, `components/states.tsx`.

**`components/ui/`:**
- Purpose: styled low-level components over Base UI plus chart/toast wrappers.
- Contains: accordion, dialogs, buttons, cards, charts, inputs, progress, select, table, tabs, tooltip, etc.
- Key files: `components/ui/button.tsx`, `components/ui/select.tsx`, `components/ui/chart.tsx`, `components/ui/sonner.tsx`.
- Follow existing wrapper props/composition; UI generator config is `components.json`.

**`lib/`:**
- Purpose: active frontend shared contracts and pure helpers.
- Contains: fetch adapter/PDF URLs, snake_case domain/read-model types, class-name utility, date helpers, static dashboard guidance.
- Key files: `lib/api.ts`, `lib/types.ts`, `lib/utils.ts`, `lib/utils-app.ts`.

**`backend/app/`:**
- Purpose: authoritative application API and SQLite business operations.
- Contains: application creation, endpoints, Pydantic models, direct SQL, startup schema/backfill, reporting.
- Key files: `backend/app/main.py`, `backend/app/routers.py`, `backend/app/schemas.py`, `backend/app/database.py`, `backend/app/pdf_reports.py`.
- `backend/main.py` imports `app.main`; run Uvicorn from `backend/` as shown in `README.md`.

**`src/` and `src-tauri/`:**
- Purpose: separate native implementation, not the active root web application.
- Contains: one tabbed React UI, native type/IPC adapter, Rust command registrations and SQL.
- Key files: `src/App.tsx`, `src/lib/tauri-db.ts`, `src/lib/types.ts`, `src-tauri/src/main.rs`, `src-tauri/src/db.rs`.
- Evidence: `tsconfig.json` excludes both, `package.json` has Next.js-only scripts and no Tauri API/Vite dependencies, `index.html` mounts `src/main.tsx`, and `src-tauri/tauri.conf.json` expects port 4173/`dist`.
- Native database lives under native app data as `project-navigator.db`; not `backend/project_navigator.db` (`src-tauri/src/db.rs`).

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: web root frame and metadata.
- `app/page.tsx`, `app/heute/page.tsx`, `app/kapazitaeten/page.tsx`, `app/uebersicht/page.tsx`, `app/setup/page.tsx`: active routes.
- `backend/main.py`: `uvicorn main:app` entry; `backend/app/main.py`: real FastAPI application.
- `start_navigator.bat`: Windows development startup for both active services.
- `index.html`, `src/main.tsx`, `src-tauri/src/main.rs`: separate native entry chain.

**Configuration:**
- `package.json`, `package-lock.json`: active npm scripts/dependency ranges/resolutions.
- `next.config.ts`: `/api/:path*` rewrite and Turbopack root.
- `tsconfig.json`: strict TypeScript, `@/*` → root `./*`, source exclusions.
- `postcss.config.mjs`, `app/globals.css`: active Tailwind v4 setup.
- `components.json`: base-nova generator aliases; configured CSS `src/app/globals.css` does not match actual `app/globals.css`.
- `backend/requirements.txt`: ranged backend requirements; imported pypdf is not declared.
- `backend/app/main.py`: CORS/local origins and startup hooks.
- `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`: native dependencies/window/dev URL.
- `AGENTS.md`: installed-version Next.js guide requirement; `node_modules/next/dist/docs/` contains relevant framework guides. No `.claude/skills/` or `.agents/skills/` directory detected.

**Core Logic:**
- `lib/api.ts`, `components/use-api.ts`: frontend request/loading boundary.
- `backend/app/routers.py`, `backend/app/schemas.py`: HTTP contracts/validation.
- `backend/app/database.py`: CRUD, task update transaction, relational reads, capacity/overview aggregates, schema initialization.
- `backend/app/pdf_reports.py`: urgency sorting and PDF output.
- `components/employee-gantt.tsx`: date windows, lane assignment, monthly axis, filtering/rendering.
- `app/setup/page.tsx`: local CRUD panels/inline editing/project plan editor.

**Testing:**
- Not detected in tracked application files; no test script/framework in `package.json`, no test directory under `backend/` or `app/`.
- Do not confuse dependency tests within `node_modules/` with project coverage.

## Naming Conventions

**Files:**
- Route files: Next.js fixed names `page.tsx`, `layout.tsx`; route folders carry URL names (`app/heute/page.tsx`).
- Shared components/helpers: lowercase kebab-case, e.g. `components/employee-gantt.tsx`, `components/status-badge.tsx`, `lib/utils-app.ts`.
- Python modules/functions: snake_case, e.g. `backend/app/pdf_reports.py`, `get_dashboard_stats` in `backend/app/database.py`.
- Separate native UI uses `src/App.tsx`; do not use its casing/location to place active Next.js features.

**Directories:**
- Active route slugs are lowercase German ASCII: `app/heute/`, `app/kapazitaeten/`, `app/uebersicht/`, `app/setup/`.
- Shared code is at root `components/` and `lib/`, not under `src/`; alias is set by `tsconfig.json`.
- Backend package is `backend/app/`; native source is `src-tauri/src/`.

## Where to Add New Code

**New Feature:**
- Primary active page: `app/<route>/page.tsx`; add navigation entry to `components/app-shell.tsx` if user-facing.
- Shared feature rendering: `components/<feature-name>.tsx`; keep page-specific panels local when following `app/setup/page.tsx`.
- HTTP method and frontend response types: `lib/api.ts`, `lib/types.ts`.
- Backend route/models/data operations: `backend/app/routers.py`, `backend/app/schemas.py`, `backend/app/database.py`.
- Tests: no established runner/path. Choose and configure a project test convention explicitly rather than assuming existing infrastructure in `package.json` or `backend/requirements.txt`.

**New Component/Module:**
- Domain component: `components/<name>.tsx`; primitive: `components/ui/<name>.tsx`.
- Shared loader hook: `components/use-api.ts` is the existing analog; `components.json` declares `@/hooks`, but no active `hooks/` directory is detected.
- Backend module: `backend/app/<name>.py`, with relative imports as in `backend/app/routers.py`.
- Native-only feature: explicitly scope to `src/` and `src-tauri/`; it does not add functionality to root Next.js routes (`tsconfig.json`).

**Utilities:**
- Active class merging: `lib/utils.ts`; date/text/dashboard guidance: `lib/utils-app.ts`.
- API types: `lib/types.ts` paired with `backend/app/schemas.py`; do not import native camelCase `src/lib/types.ts` into web code.
- SQL helpers/schema changes: `backend/app/database.py`; preserve transaction/parameter patterns and account for startup mutation of existing databases.
- PDF helpers: `backend/app/pdf_reports.py`; pure urgency logic is shared with dashboard via `backend/app/routers.py`.

## Special Directories

**`.planning/codebase/`:**
- Purpose: orchestrator-facing reference maps, including `.planning/codebase/STACK.md` and `.planning/codebase/ARCHITECTURE.md`.
- Generated: yes, by codebase mapping workflow.
- Committed: not committed by this documentation-only task; `.gitignore` does not exclude this directory.

**`.next/` and `node_modules/`:**
- Purpose: Next.js generated output and installed npm dependencies/framework guides.
- Generated: yes; `package.json`, `package-lock.json` are source inputs.
- Committed: no, ignored by `.gitignore`.
- Read the appropriate installed Next.js guide before code changes as required by `AGENTS.md`; do not hand-edit generated output.

**`backend/.venv/` and Python caches:**
- Purpose: local Python dependencies and bytecode; inputs in `backend/requirements.txt`.
- Generated: yes.
- Committed: no; `backend/.venv/`, `__pycache__/`, and `*.pyc` ignored by `.gitignore`.

**Local SQLite files:**
- Purpose: persisted application data; configured by `backend/app/database.py`.
- Generated: runtime-created if missing; existing files may contain user data.
- Committed: no; `*.db` ignored by `.gitignore`.
- Contents are outside this map. Do not launch/import backend application code merely to inspect structure because lifespan schema initialization writes to the resolved database.

**`src/` and `src-tauri/`:**
- Purpose: separate implementation; source is tracked, as shown by `src-tauri/Cargo.toml` and `src-tauri/src/db.rs`.
- Generated: no for source/config; potential `src-tauri/target/` output is generated and ignored by `.gitignore`.
- Committed: source yes; native build output no.
- Do not remove, migrate, or repair this stack incidentally while implementing active web/API features.

---

*Structure analysis: Wed Oct 07 2026*
