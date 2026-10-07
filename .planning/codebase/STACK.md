# Technology Stack

**Analysis Date:** Wed Oct 07 2026

## Languages

**Primary:**
- TypeScript 5.9.3 (lockfile; manifest `^5`) — active React routes in `app/`, components in `components/`, and HTTP contracts in `lib/`; `package-lock.json`, `tsconfig.json`.
- Python — active API, SQLite access, and PDF generation in `backend/main.py` and `backend/app/`; `README.md` specifies Python 3.11+, and the local `backend/.venv/Scripts/python.exe` reports 3.14.7.

**Secondary:**
- CSS — Tailwind v4 theme tokens and OKLCH colors in `app/globals.css`; separate plain stylesheet in `src/index.css`.
- Rust, edition 2021 — separate native commands and SQLite implementation in `src-tauri/src/main.rs` and `src-tauri/src/db.rs`; edition specified in `src-tauri/Cargo.toml`.
- Windows batch — two-process development launcher in `start_navigator.bat`.
- SQL — inline schema, indexes, migrations, and parameterized queries in `backend/app/database.py`; separate schema in `src-tauri/src/db.rs`.

## Runtime

**Environment:**
- Active application: Node.js serving Next.js plus a separate Python/Uvicorn process; scripts in `package.json` and `start_navigator.bat`.
- Local observed Node.js: 24.20.0; Next.js requires Node `>=20.9.0` according to `package-lock.json`.
- Local observed Python: 3.14.7 from `backend/.venv/Scripts/python.exe`; portable minimum documented as 3.11+ in `README.md`.
- Browser executes client page loaders and mutations in `app/page.tsx`, `app/heute/page.tsx`, and `components/use-api.ts`.
- Native webview/runtime is a separate implementation declared by `src-tauri/Cargo.toml`, not the root npm application.

**Package Manager:**
- npm; locally observed version 11.19.0. No `packageManager` pin in `package.json`.
- Lockfile: `package-lock.json` present, lockfile format 3.
- Python dependencies use pip-compatible ranges in `backend/requirements.txt`; no Python lockfile detected in `backend/`.
- Cargo manifest present at `src-tauri/Cargo.toml`; Cargo lockfile not detected in `src-tauri/`.

## Frameworks

**Core:**
- Next.js 16.3.3 — root App Router application and API proxy; `package.json`, `app/layout.tsx`, `next.config.ts`.
- React/React DOM 19.2.8 — active client-rendered feature pages and reusable components; `package.json`, `app/setup/page.tsx`.
- FastAPI `>=0.115,<1.0`, locally installed 0.141.1 — REST API and lifespan startup; `backend/requirements.txt`, `backend/app/main.py`.
- Pydantic `>=2.9,<3.0`, locally installed 2.13.5 — request and response models; `backend/requirements.txt`, `backend/app/schemas.py`.
- Tailwind CSS 4.3.3 (manifest `^4`) — utility styles and CSS-defined design system; `package-lock.json`, `app/globals.css`.

**Testing:**
- Not detected: no test script or test framework dependency in `package.json`; no tracked test files detected under the application paths.

**Build/Dev:**
- Next.js CLI/Turbopack — `dev`, `build`, `start` scripts in `package.json`; explicit Turbopack root in `next.config.ts`.
- `@tailwindcss/postcss` 4.3.3 — PostCSS plugin in `postcss.config.mjs`, version in `package-lock.json`.
- TypeScript strict, no emit, ES2020 target, bundler resolution — `tsconfig.json`.
- ESLint 9.39.5 and `eslint-config-next` 16.3.3 — declared dependencies in `package.json`, resolved versions in `package-lock.json`; standalone lint configuration not detected. The script is `next lint`; do not assume it is a working ESLint invocation.
- Uvicorn `>=0.30,<1.0`, locally installed 0.52.4 — reload-enabled backend launch in `backend/main.py` and `start_navigator.bat`.
- shadcn 4.19.0 — UI scaffolding/tooling in `package.json`, style `base-nova` in `components.json`.

## Key Dependencies

**Critical:**
- `@base-ui/react` 1.7.0 — headless primitives used by wrappers such as `components/ui/button.tsx`, `components/ui/select.tsx`, and `components/ui/dialog.tsx`.
- Recharts 3.8.0 — employee/project workload charts in `app/kapazitaeten/page.tsx` and chart wrapper in `components/ui/chart.tsx`.
- PyMuPDF `>=1.24,<2.0`, locally installed 1.28.2 — HTML-to-PDF rendering and text extraction; `backend/requirements.txt`, `backend/app/pdf_reports.py`, `backend/app/routers.py`.
- pypdf, locally installed 6.19.0 — PDF metadata/finalization imported by `backend/app/pdf_reports.py`. **Not declared in `backend/requirements.txt`**; clean requirements-only installation does not guarantee this import.
- Python standard-library `sqlite3` — direct database access without ORM; `backend/app/database.py`.

**Infrastructure:**
- Sonner 2.0.8 — success/error toasts in `components/use-api.ts`, `app/heute/page.tsx`, `components/ui/sonner.tsx`.
- next-themes `^0.4.6` — class-based theme provider with light default and system theme disabled; `package.json`, `components/providers.tsx`.
- Lucide React 1.34.0 — navigation and feature icons; `components/app-shell.tsx`, `package-lock.json`.
- `clsx` `^2.1.1`, `tailwind-merge` `^3.6.0`, `class-variance-authority` `^0.7.1` — class composition and variants; `lib/utils.ts`, `components/ui/button.tsx`, `package.json`.
- `tw-animate-css` `^1.4.0` — animations imported in `app/globals.css`; `package.json`.
- python-multipart `>=0.0.20,<1.0`, locally installed 0.0.32 — multipart dependency; `backend/requirements.txt`. The extraction handler in `backend/app/routers.py` does not declare a conventional `File(...)` parameter.

**Separate native implementation:**
- Tauri manifest version `2.8.0` with `api-all`, rusqlite `0.30.1` with bundled SQLite, serde/serde_json `1.0`, UUID `1.4.2`, chrono `0.4` — `src-tauri/Cargo.toml`; native compilation not verified.
- `@tauri-apps/api/core` import exists in `src/lib/tauri-db.ts`, but `@tauri-apps/api` is not a dependency in `package.json`.
- `index.html` mounts `src/main.tsx`; `src/vite-env.d.ts` indicates a Vite-style frontend. No Vite config/dependency/script is detected in the root setup.
- Treat `src/` and `src-tauri/` as separate, not active Next.js code: `tsconfig.json` excludes both; `package.json` runs only Next.js; `start_navigator.bat` runs Next.js and FastAPI.

## Configuration

**Environment:**
- `BACKEND_URL` controls server-side `/api/:path*` proxy destination, defaulting to local port 8000; `next.config.ts`.
- `NEXT_PUBLIC_API_URL` optionally supplies the browser API origin; empty default means same-origin `/api`; `lib/api.ts`.
- No root `.env*` files detected by filename enumeration; `.env` is ignored by `.gitignore`. No secret file contents were inspected.
- SQLite path is resolved from ordered existing-file candidates, not an environment variable; `backend/app/database.py`.
- CORS explicitly allows localhost/127.0.0.1 ports 3000–3002; `backend/app/main.py`.
- Project-local skill directories `.claude/skills/` and `.agents/skills/` are not detected. `AGENTS.md` requires consulting installed Next.js guides before code changes.

**Build:**
- `next.config.ts`: proxy rewrites and Turbopack root; no static export or standalone output configured.
- `tsconfig.json`: root `@/*` alias, Next plugin, strict compilation; excludes the native frontend/backend directories.
- `postcss.config.mjs` and `app/globals.css`: actual active Tailwind v4 integration.
- `components.json`: UI generator aliases; CSS path points to `src/app/globals.css`, while the actual active CSS is `app/globals.css`. Verify this mismatch before generator use.
- `src-tauri/tauri.conf.json`: separate native dev URL port 4173 and `../dist`; empty frontend build hooks do not start the root Next.js/FastAPI processes.

## Platform Requirements

**Development:**
- Node/npm and Python with backend dependencies; `README.md`, `package.json`, `backend/requirements.txt`.
- Windows-specific convenience launcher uses `cmd`, `npm.cmd`, and optional `backend/.venv/Scripts/activate.bat`; `start_navigator.bat`.
- Two processes: `npm run dev` at port 3000 and `uvicorn main:app --reload --port 8000` from `backend/`; `README.md`.
- Geist/Geist Mono are configured through Google font integration in `app/layout.tsx`; account for font fetching when building offline.

**Production:**
- Root scripts support `npm run build` then `npm start`; a reachable FastAPI service and writable persistent SQLite directory remain necessary; `package.json`, `next.config.ts`, `backend/app/database.py`.
- Hosted platform, container definition, CI deployment, and production process manager: not detected in the tracked root configuration.
- Native distribution is separately described by `src-tauri/tauri.conf.json`; do not infer a functioning packaged desktop distribution from its presence.

---

*Stack analysis: Wed Oct 07 2026*
