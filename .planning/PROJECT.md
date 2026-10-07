# Project Navigator Desktop

## What This Is

Project Navigator Desktop ist ein lokales Führungs- und Steuerungs-Tool für Aufgaben-, Projekt- und Mitarbeiter-Kapazitäten. Es bietet eine Übersicht über Handlungsfelder (Streams), Projekte, Aufgaben mit Schrittlisten sowie Checkup- und Follow-up-Einträge inklusive Kapazitäts-Gantt-Diagramm und PDF-Berichtserstellung.

## Core Value

Transparente, verlässliche Visualisierung und Nachverfolgung aktiver, paralleler Aufgaben im Team – gemessen an realen Checkup-Daten.

## Requirements

### Validated

- [x] Grundlegende Datenstrukturen (Streams, Projekte, Aufgaben, Checkup-Updates, Schritte) in SQLite und FastAPI.
- [x] Next.js App Router Frontend (`/`, `/heute`, `/kapazitaeten`, `/uebersicht`, `/setup`).
- [x] Codebase-Dokumentation in `.planning/codebase/`.

### Active

- [ ] **GANTT-01**: Gantt-Chart auf `/kapazitaeten` stellt als Start den ersten Checkup und als Ende den letzten Checkup dar.
- [ ] **GANTT-02**: Parallele Task-Auslastung heute wird anhand der Checkup-Intervalle korrekt berechnet und angezeigt.
- [ ] **GANTT-03**: Robuster Fallback für Aufgaben ohne Checkups (Startdatum/Erstellung bis Folgetag).
- [ ] **DEBT-01**: Fehlende Dependency `pypdf>=5.0.0` in `backend/requirements.txt` nachtragen.
- [ ] **DEBT-02**: SQLite Concurrency durch WAL-Modus und `busy_timeout` in `backend/app/database.py` absichern.
- [ ] **APP-01**: Erfolgreicher Start und Live-Verifikation der Anwendung (FastAPI Backend + Next.js Frontend).

### Out of Scope

- Vollständiges Refactoring der Legacy-Tauri-Dateien (`src-tauri/`) – bleibt für spätere Phasen unberührt.
- Multi-User Authentifizierung / Login – bleibt vorerst lokales Desktop-/Intranet-Tool.

## Context

- **Frontend:** Next.js 16.3.3, React 19.2.8, Tailwind CSS v4, Lucide Icons, Recharts, Sonner.
- **Backend:** Python FastAPI, SQLite (`backend/project_navigator.db`), PyMuPDF, Pydantic v2.
- **Aktueller Branch:** `feature/gantt-checkup-timeline`.

## Key Decisions

| Datum | Entscheidung | Rationale |
|---|---|---|
| 2026-10-05 | Gantt-Balken basiert auf Checkup-Zeitraum | Vorherige Deadline-Darstellung spiegelte nicht die reale, aktuelle Parallelbearbeitung wider. |
| 2026-10-07 | GSD Planungsstruktur aufgesetzt | Strukturierte Roadmap mit Phasen: Phase 1 (Gantt), Phase 2 (Backend-Härtung), Phase 3 (App-Start). |

