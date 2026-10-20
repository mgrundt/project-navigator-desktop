# Project Navigator Desktop

## What This Is

Project Navigator Desktop ist ein lokales Führungs- und Steuerungs-Tool für Aufgaben-, Projekt- und Mitarbeiter-Kapazitäten. Es bietet eine Übersicht über Handlungsfelder (Streams), Projekte, Aufgaben mit Schrittlisten sowie Checkup- und Follow-up-Einträge inklusive Kapazitäts-Gantt-Diagramm und PDF-Berichtserstellung.

## Core Value

Transparente, verlässliche Visualisierung und Nachverfolgung aktiver, paralleler Aufgaben im Team – gemessen an realen Checkup-Daten.

## Milestone v2.0: Dashboard-Umbau & Checkup-Integration

Zentralisierung der Arbeitsabläufe direkt im Dashboard: Aufgaben aus der Dashboard-Tabelle heraus vollständig editieren und löschen; Checkups (Erfassung & Historie) direkt im Dashboard zusammenführen; Entfernung des separaten Menüpunkts „Heute im Team“.

## Requirements

### Validated (v1.0)

- [x] Grundlegende Datenstrukturen (Streams, Projekte, Aufgaben, Checkup-Updates, Schritte) in SQLite und FastAPI.
- [x] Next.js App Router Frontend (`/`, `/heute`, `/kapazitaeten`, `/uebersicht`, `/setup`).
- [x] Codebase-Dokumentation in `.planning/codebase/`.
- [x] Gantt-Chart auf `/kapazitaeten` stellt als Start den ersten Checkup und als Ende den letzten Checkup dar.
- [x] Parallele Task-Auslastung heute wird anhand der Checkup-Intervalle berechnet.
- [x] Fehlende Dependency `pypdf>=5.0.0` in `backend/requirements.txt` nachgetragen.
- [x] SQLite Concurrency durch WAL-Modus und `busy_timeout` in `backend/app/database.py` abgesichert.
- [x] Checkup-Historie in den Aufgabenkarten ausklappbar.

### Validated (v2.0)

- [x] **NAV-01**: Menüpunkt „Heute im Team“ (`/heute`) aus Desktop- und Mobil-Navigation entfernen.
- [x] **DASH-01**: `GET /api/dashboard` liefert Projekte und Mitarbeiter für Dropdowns im Edit-Modal mit.
- [x] **MODAL-01**: Klick auf eine Zeile/Aktion in der Dashboard-Tabelle öffnet ein modales Task-Dialogfenster.
- [x] **MODAL-02**: Alle Parameter der Aufgabe sind im Modal editierbar (Titel, Beschreibung, Projekt, Mitarbeiter, Kategorie, Status, Startdatum, Deadline, Wiedervorlage).
- [x] **MODAL-03**: Aufgabe kann direkt im Modal gelöscht werden (mit Sicherheitsbestätigung via AlertDialog).
- [x] **CHECKUP-01**: Neues Checkup-Update (Status, Kommentar, Wiedervorlage) direkt im Dashboard-Task-Modal erfassen.
- [x] **CHECKUP-02**: Vollständige Checkup-Historie der Aufgabe im Modal einsehen.

### Out of Scope

- Vollständiges Refactoring der Legacy-Tauri-Dateien (`src-tauri/`) – bleibt für spätere Phasen unberührt.
- Multi-User Authentifizierung / Login – bleibt vorerst lokales Desktop-/Intranet-Tool.

## Key Decisions

| Datum | Entscheidung | Rationale |
|---|---|---|
| 2026-10-05 | Gantt-Balken basiert auf Checkup-Zeitraum | Vorherige Deadline-Darstellung spiegelte nicht die reale, aktuelle Parallelbearbeitung wider. |
| 2026-10-07 | Meilenstein v2.0: Dashboard als Single Source of Action | Bisheriger Wechsel zwischen Dashboard und „Heute im Team“ erzeugte Reibung; Aufgabenbearbeitung und Checkups gehören an einen zentralen Ort. |
