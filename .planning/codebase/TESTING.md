# Testing Strategy & Patterns

**Analysis Date:** 2026-10-07

## Test Framework & Tooling

**Current Status:**
- **Automated Tests:** Not implemented. There are currently no unit, integration, or end-to-end test files in the repository.
- **Test Runners:** Neither Vitest/Jest (JavaScript/TypeScript) nor Pytest (Python) are configured in `package.json` or `backend/requirements.txt`.
- **CI/CD:** No automated continuous integration pipeline is configured.

---

## Current Verification Procedures

In lieu of automated testing, changes are verified using static type checking, build validation, and manual runtime smoke testing:

### 1. Static Verification
```bash
# Verify TypeScript types across the entire Next.js application
npx tsc --noEmit

# Test full Next.js production build and static analysis
npm run build
```

### 2. Backend Verification
```bash
# Verify Python syntax and database initialization
cd backend
python -c "from app.database import init_db, list_tasks; init_db(); print('DB OK, task count:', len(list_tasks()))"

# Run FastAPI backend locally
python -m uvicorn app.main:app --reload --port 8000
# Check API OpenAPI docs at: http://localhost:8000/docs
```

### 3. Frontend & End-to-End Smoke Testing
```bash
# Run Next.js development server
npm run dev
# Access: http://localhost:3000
```

**Key manual test scenarios:**
- **Dashboard (`/`):** Verify KPI counts match database records and upcoming tasks list properly.
- **Heute (`/heute`):** Submit a task checkup update (status + comment + next follow-up date); verify update appears in history.
- **Kapazitäten (`/kapazitaeten`):** Verify Gantt chart bars render from the first checkup date to the last checkup date; verify workload bar charts calculate open tasks accurately.
- **Übersicht (`/uebersicht`):** Drill down from Stream -> Project -> Task -> Steps & History.
- **Setup (`/setup`):** Create/edit/delete a Stream, Project, Task, and Employee. Ensure cascade deletion works as expected.
- **Bericht PDF:** Click "PDF-Bericht exportieren" from Dashboard and verify PDF download generates and opens cleanly.

---

## Recommended Testing Architecture (Roadmap)

To establish robust automated quality gates, the following setup is recommended:

### Backend Testing (FastAPI + Pytest)
- **Dependencies:** `pytest`, `pytest-asyncio`, `httpx`
- **Location:** `backend/tests/`
- **Pattern:**
  - Create an in-memory SQLite fixture (`sqlite3.connect(":memory:")`) or temporary file database.
  - Use `TestClient(app)` from `starlette.testclient` or `httpx.AsyncClient` to test API routes:
    - `tests/test_streams.py`
    - `tests/test_projects.py`
    - `tests/test_tasks.py`
    - `tests/test_updates.py`
    - `tests/test_pdf.py`

### Frontend Unit & Component Testing
- **Dependencies:** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- **Location:** Co-located test files (e.g. `components/employee-gantt.test.tsx`, `lib/utils-app.test.ts`)
- **Key Tests Needed:**
  - `lib/utils-app.ts`: Date parsing, formatting, date arithmetic edge cases (leap years, month transitions).
  - `components/employee-gantt.tsx`: Task window calculation from checkup dates, minimum 1-day bar width, parallel workload count.

### End-to-End Testing (Playwright)
- **Framework:** `@playwright/test`
- **Scope:** Automated verification of the dual-process startup and primary user flows (add task -> add checkup update -> view on Gantt chart).

