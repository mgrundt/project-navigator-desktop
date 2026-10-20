# Requirements: Project Navigator Desktop

**Defined:** 2026-10-07  
**Core Value:** Transparente, verlässliche Visualisierung und Nachverfolgung aktiver, paralleler Aufgaben im Team – gemessen an realen Checkup-Daten.

## Milestone v2.0 Requirements

### Navigation & Data Basis

- [x] **NAV-01**: Der Menüpunkt „Heute im Team“ (`/heute`) ist aus der Desktop-Sidebar und dem mobilen Header in `components/app-shell.tsx` entfernt.
- [x] **DASH-01**: `GET /api/dashboard` (bzw. Frontend Loader) stellt Projekte und Mitarbeiter bereit, sodass Dropdowns im Dashboard sofort ohne Zusatz-Roundtrips befüllt werden.

### Task Edit & Delete Modal

- [x] **MODAL-01**: Klick auf eine Zeile oder einen Bearbeiten-Button in der Tabelle „Nächste anstehende Aufgaben“ öffnet ein modales Dialogfenster (`Dialog`).
- [x] **MODAL-02**: Alle Parameter der Aufgabe sind im Modal editierbar:
  - Titel & Beschreibung
  - Projekt (Dropdown)
  - Zuständiger Mitarbeiter (Dropdown)
  - Kategorie & Status (Dropdown)
  - Startdatum & Deadline (Datumsauswahl)
  - Nächste Wiedervorlage (Datumsauswahl)
- [x] **MODAL-03**: Aufgabe kann direkt im Modal gelöscht werden mit vorgeschalteter Bestätigungsabfrage (`AlertDialog`). Nach dem Löschen schließt das Modal und das Dashboard aktualisiert sich.

### Checkup-Workflow im Dashboard

- [x] **CHECKUP-01**: Im Task-Modal (oder inline) kann direkt ein neuer Checkup eingetragen werden (Status-Auswahl, Kommentartext, Wiedervorlage-Datum).
- [x] **CHECKUP-02**: Die vollständige Checkup-Historie der ausgewählten Aufgabe (Datum, Uhrzeit, Status, Kommentar, Wiedervorlage) ist im Modal einsehbar.

---

## Validated Requirements (v1.0)

- [x] **GANTT-01**: Aufgaben-Balken im Gantt-Chart starten am ersten Checkup und enden am letzten Checkup.
- [x] **GANTT-02**: Parallele Task-Auslastung heute berechnet sich anhand der Checkup-Intervalle.
- [x] **GANTT-03**: 1-Tages-Mindestbalken für Eintages-Checkups und robuster Fallback für aufgabenlose Checkups.
- [x] **GANTT-04**: Tooltip und Legende spiegeln Checkup-Logik wider.
- [x] **DEBT-01**: `pypdf>=5.0.0` in `requirements.txt` deklariert.
- [x] **DEBT-02**: SQLite Verbindungshandling mit WAL-Modus und `busy_timeout` gehärtet.
- [x] **APP-01**: Backend läuft auf Port 8000.
- [x] **APP-02**: Frontend kompiliert und läuft auf Port 3000.
- [x] **APP-03**: Live-Verifikation erfolgreich abgeschlossen.

---

## Traceability v2.0

| Requirement | Phase | Status |
|---|---|---|
| NAV-01 | Phase 4: Navigation & Data Basis | Done |
| DASH-01 | Phase 4: Navigation & Data Basis | Done |
| MODAL-01 | Phase 5: Task Edit & Delete Modal | Done |
| MODAL-02 | Phase 5: Task Edit & Delete Modal | Done |
| MODAL-03 | Phase 5: Task Edit & Delete Modal | Done |
| CHECKUP-01 | Phase 6: Checkup-Workflow & Historie im Dashboard | Done |
| CHECKUP-02 | Phase 6: Checkup-Workflow & Historie im Dashboard | Done |
