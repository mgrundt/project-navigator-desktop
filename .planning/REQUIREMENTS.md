# Requirements: Project Navigator Desktop

**Defined:** 2026-10-07  
**Core Value:** Transparente, verlässliche Visualisierung und Nachverfolgung aktiver, paralleler Aufgaben im Team – gemessen an realen Checkup-Daten.

## v1 Requirements

### Gantt Timeline & Parallel Workload

- [x] **GANTT-01**: Aufgaben-Balken im Gantt-Chart starten am Datum des ersten Checkups (`first_checkup_date`) und enden am Datum des letzten Checkups (`last_checkup_date`).
- [x] **GANTT-02**: Die Metrik für heute aktive/parallele Aufgaben basiert auf dem Checkup-Zeitraum (Intervall überlappt das heutige Datum).
- [x] **GANTT-03**: Für Aufgaben mit nur einem Checkup oder ohne Checkup existiert eine sichtbare Mindestdauer (1 Tag) bzw. ein definierter Fallback (Erstellungsdatum).
- [x] **GANTT-04**: Tooltip und Legende auf der Kapazitätsseite spiegeln die neue Checkup-Logik wider (Anzahl Checkups, Datumsspanne).

### Technical Debt & Backend Hardening

- [x] **DEBT-01**: `pypdf>=5.0.0` ist in `backend/requirements.txt` deklariert, um saubere Neuinstallationen ohne Laufzeitfehler zu gewährleisten.
- [x] **DEBT-02**: SQLite Verbindungshandling in `backend/app/database.py` ist mit `PRAGMA journal_mode = WAL;` und `PRAGMA busy_timeout = 5000;` gegen Sperrkonflikte gehärtet.

### App Lifecycle & Verification

- [x] **APP-01**: FastAPI Backend startet fehlerfrei auf Port 8000.
- [x] **APP-02**: Next.js Frontend kompiliert fehlerfrei (`npx tsc --noEmit`, `npm run build`) und startet auf Port 3000.
- [x] **APP-03**: Das Gantt-Chart unter `/kapazitaeten` zeigt verifizierte parallele Tasks an.

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| GANTT-01 | Phase 1: Gantt-Timeline | Completed |
| GANTT-02 | Phase 1: Gantt-Timeline | Completed |
| GANTT-03 | Phase 1: Gantt-Timeline | Completed |
| GANTT-04 | Phase 1: Gantt-Timeline | Completed |
| DEBT-01 | Phase 2: Backend-Härtung | Completed |
| DEBT-02 | Phase 2: Backend-Härtung | Completed |
| APP-01 | Phase 3: Start & Verifikation | Completed |
| APP-02 | Phase 3: Start & Verifikation | Completed |
| APP-03 | Phase 3: Start & Verifikation | Completed |
