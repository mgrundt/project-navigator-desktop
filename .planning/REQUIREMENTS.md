# Requirements: Project Navigator Desktop

**Defined:** 2026-10-07  
**Core Value:** Transparente, verlässliche Visualisierung und Nachverfolgung aktiver, paralleler Aufgaben im Team – gemessen an realen Checkup-Daten.

## v1 Requirements

### Gantt Timeline & Parallel Workload

- [ ] **GANTT-01**: Aufgaben-Balken im Gantt-Chart starten am Datum des ersten Checkups (`first_checkup_date`) und enden am Datum des letzten Checkups (`last_checkup_date`).
- [ ] **GANTT-02**: Die Metrik für heute aktive/parallele Aufgaben basiert auf dem Checkup-Zeitraum (Intervall überlappt das heutige Datum).
- [ ] **GANTT-03**: Für Aufgaben mit nur einem Checkup oder ohne Checkup existiert eine sichtbare Mindestdauer (1 Tag) bzw. ein definierter Fallback (Erstellungsdatum).
- [ ] **GANTT-04**: Tooltip und Legende auf der Kapazitätsseite spiegeln die neue Checkup-Logik wider (Anzahl Checkups, Datumsspanne).

### Technical Debt & Backend Hardening

- [ ] **DEBT-01**: `pypdf>=5.0.0` ist in `backend/requirements.txt` deklariert, um saubere Neuinstallationen ohne Laufzeitfehler zu gewährleisten.
- [ ] **DEBT-02**: SQLite Verbindungshandling in `backend/app/database.py` ist mit `PRAGMA journal_mode = WAL;` und `PRAGMA busy_timeout = 5000;` gegen Sperrkonflikte gehärtet.

### App Lifecycle & Verification

- [ ] **APP-01**: FastAPI Backend startet fehlerfrei auf Port 8000.
- [ ] **APP-02**: Next.js Frontend kompiliert fehlerfrei (`npx tsc --noEmit`, `npm run build`) und startet auf Port 3000.
- [ ] **APP-03**: Das Gantt-Chart unter `/kapazitaeten` zeigt verifizierte parallele Tasks an.

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| GANTT-01 | Phase 1: Gantt-Timeline | Pending |
| GANTT-02 | Phase 1: Gantt-Timeline | Pending |
| GANTT-03 | Phase 1: Gantt-Timeline | Pending |
| GANTT-04 | Phase 1: Gantt-Timeline | Pending |
| DEBT-01 | Phase 2: Backend-Härtung | Pending |
| DEBT-02 | Phase 2: Backend-Härtung | Pending |
| APP-01 | Phase 3: Start & Verifikation | Pending |
| APP-02 | Phase 3: Start & Verifikation | Pending |
| APP-03 | Phase 3: Start & Verifikation | Pending |
