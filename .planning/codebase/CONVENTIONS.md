# Coding Conventions

**Analysis Date:** 2026-10-07

## Architecture & Code Organization

The application is structured as a decoupled two-tier architecture:
- **Frontend:** Next.js 16 (App Router) with React 19 in `app/`, reusable UI in `components/`, and shared types/utilities in `lib/`.
- **Backend:** Python FastAPI application in `backend/app/` serving JSON REST endpoints and generating PDFs via SQLite in `backend/project_navigator.db`.
- **Legacy/Native Artifacts:** A separate Tauri/Rust desktop implementation exists in `src/` and `src-tauri/`, but the active web-desktop runtime runs on Next.js + FastAPI.

---

## Naming Patterns

### Files & Directories
- **Next.js Routes:** Lowercase kebab-case directory routing matching German navigation endpoints (`app/heute/page.tsx`, `app/kapazitaeten/page.tsx`, `app/setup/page.tsx`, `app/uebersicht/page.tsx`).
- **React Components:** Kebab-case filenames (`components/employee-gantt.tsx`, `components/page-header.tsx`, `components/status-badge.tsx`, `components/select-field.tsx`).
- **UI Primitives:** Kebab-case under `components/ui/` (`button.tsx`, `dialog.tsx`, `table.tsx`, `card.tsx`).
- **Frontend Utilities:** Kebab-case under `lib/` (`api.ts`, `types.ts`, `utils.ts`, `utils-app.ts`).
- **Backend Modules:** Snake_case Python files (`backend/app/main.py`, `backend/app/database.py`, `backend/app/routers.py`, `backend/app/schemas.py`, `backend/app/pdf_reports.py`).

### Variables & Functions
- **TypeScript:**
  - Variables & functions: `camelCase` (`fetchData`, `handleStatusChange`, `parseIsoDate`, `formatDate`).
  - Constants: `UPPER_SNAKE_CASE` for configuration / static reference (`PROJECT_COLORS`, `LEITPLANKEN`, `BASE_URL`).
  - React Component functions: `PascalCase` (`EmployeeGantt`, `PageHeader`, `StatusBadge`).
  - Custom Hooks: `useCamelCase` (`useApi`).
- **Python:**
  - Functions & variables: `snake_case` (`list_tasks`, `add_task_update`, `resolve_db_path`, `row_to_dict`).
  - Constants: `UPPER_SNAKE_CASE` (`TASK_DETAILS_SELECT`, `STATUS_ORDER`).
  - Pydantic models: `PascalCase` (`TaskOut`, `ProjectCreate`, `CapacityOut`, `DashboardStats`).

### Types & Interfaces
- **TypeScript:** `PascalCase` for type aliases in `lib/types.ts` (`Task`, `Project`, `Stream`, `Employee`, `CapacityData`, `OverviewStream`).
- No `I` prefix for interfaces or types.
- Strict type definitions matching FastAPI Pydantic response models.

---

## Code Style & Formatting

### TypeScript / React
- **Directive:** `"use client"` placed at the very top of interactive pages and components.
- **Strict TypeScript:** Enabled (`strict: true` in `tsconfig.json`).
- **Path Aliases:** Always use `@/` for imports from root (`@/components/...`, `@/lib/...`).
- **Class Merging:** Use `cn(...)` from `@/lib/utils` (combines `clsx` and `tailwind-merge`) for conditional and composite styling.
- **Styling:** Tailwind CSS v4 utility classes with semantic OKLCH CSS variables defined in `app/globals.css`.
- **UI Components:** Built on `@base-ui/react` headless primitives wrapped in standard Tailwind styles (shadcn style system).
- **Icons:** Standardized on `lucide-react`.

### Python
- **Type Hints:** Required on all function signatures (`Optional[str]`, `list[dict[str, Any]]`, `Iterator[sqlite3.Connection]`).
- **SQL Formatting:** Multi-line SQL strings with parameterized queries (`?` placeholders) to prevent SQL injection.
- **Pydantic Validation:** Models derive from `pydantic.BaseModel` with `ConfigDict(from_attributes=True)`.

---

## Import Organization

### TypeScript
1. React core imports (`import { useMemo, useState, useEffect } from "react"`)
2. Third-party packages (`recharts`, `lucide-react`, `sonner`)
3. Internal libraries & types (`import type { Task } from "@/lib/types"`, `import { api } from "@/lib/api"`)
4. Internal UI components (`import { Card, CardHeader } from "@/components/ui/card"`)
5. Utilities & helpers (`import { cn } from "@/lib/utils"`)

### Python
1. Standard library imports (`sqlite3`, `uuid`, `os`, `pathlib`, `contextlib`, `typing`)
2. Third-party libraries (`fastapi`, `pydantic`, `fitz`)
3. Internal application modules (`from app.database import get_connection`, `from app.schemas import TaskOut`)

---

## Domain Concepts & Localization

- **Language:** Domain logic, status values, navigation labels, and user interfaces are in **German**.
- **Task Statuses:** Standardized set:
  - `Nicht gestartet`
  - `In Bearbeitung`
  - `Wartet`
  - `Abgeschlossen`
- **Entity Hierarchy:**
  - `Stream` (Handlungsfeld / Leitplanke)
  - `Project` (Gehört zu einem Stream)
  - `Task` (Gehört zu einem Project und ist einem `Employee` zugewiesen)
  - `Update` (Checkup / Verlaufeintrag für einen Task mit Datum, Status und Kommentar)
  - `TaskStep` (Schritteliste / Checkliste innerhalb einer Aufgabe)

---

## Error Handling & Notifications

### Frontend
- **API Requests:** `lib/api.ts` checks `response.ok`; extracts `detail` from JSON error responses and throws clean `Error(detail)`.
- **State Management:** `useApi` hook exposes `loading`, `error`, `data`, and a `reload` callback.
- **User Feedback:** Use `sonner` toasts (`toast.success("Gespeichert")`, `toast.error(error.message)`).
- **Confirmation:** Destructive actions (delete project, delete stream) use `AlertDialog` or explicit confirmation modals.

### Backend
- **HTTP Exceptions:** Explicit `raise HTTPException(status_code=404, detail="...")` for missing resources.
- **Database Safety:** Transactions managed via `get_connection()` context manager with automatic `conn.rollback()` on exceptions and `conn.commit()` on success.

---

## Date Handling Conventions

- **Database format:** ISO date string (`YYYY-MM-DD`) or timestamp (`YYYY-MM-DD HH:MM:SS`).
- **Display format:** German date format (`DD.MM.YYYY`) using `formatDate()` from `lib/utils-app.ts`.
- **Local Date Parsing:** Use string splitting (`dateStr.slice(0, 10).split("-")`) instead of `new Date(dateStr)` to avoid timezone offsets shifting dates backwards by one day.
