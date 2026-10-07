# Roadmap: Project Navigator Desktop

## Overview

Strukturierte Meilenstein-Planung für Project Navigator Desktop.

---

## Milestone v2.0: Dashboard-Umbau & Checkup-Integration

Zentralisierung der Aufgabenbearbeitung und Checkups im Dashboard; Bereinigung der Navigation.

### Phases v2.0

- [ ] **Phase 4: Navigation & Data Basis** – Menüpunkt „Heute im Team“ entfernen; Dashboard API/Loader um Projekte & Mitarbeiter erweitern.
- [ ] **Phase 5: Task Edit & Delete Modal** – Interaktives Modal in der Dashboard-Tabelle zur vollständigen Bearbeitung und Löschung aller Task-Parameter.
- [ ] **Phase 6: Checkup-Workflow & Historie im Dashboard** – Neuer Checkup-Eintrag & scrollbare Verlaufshistorie direkt im Task-Modal.
- [ ] **Phase 7: Live-Verifikation & Workflow-Test** – End-to-End-Test der Änderungen im laufenden System.

### Phase Details v2.0

#### Phase 4: Navigation & Data Basis
**Goal**: Menüverschlankung und Bereitstellung aller für das Dashboard-Modal nötigen Stamm- und Referenzdaten.  
**Depends on**: Milestone v1.0  
**Requirements**: NAV-01, DASH-01  
**Success Criteria**:
1. Menüpunkt `/heute` ist weder in der Desktop-Sidebar noch im mobilen Menü sichtbar.
2. `GET /api/dashboard` bzw. Dashboard-Loader liefert `projects` und `employees` für Dropdowns.

#### Phase 5: Task Edit & Delete Modal
**Goal**: Vollständige Bearbeitung und Löschung einer Aufgabe direkt aus der Dashboard-Tabelle.  
**Depends on**: Phase 4  
**Requirements**: MODAL-01, MODAL-02, MODAL-03  
**Success Criteria**:
1. Klick auf eine Zeile oder einen Bearbeiten-Button öffnet das Dialog-Modal.
2. Formular erlaubt Änderung aller Felder: Titel, Beschreibung, Projekt, Mitarbeiter, Kategorie, Status, Startdatum, Deadline, Wiedervorlage.
3. Änderungen werden per `PATCH /api/tasks/{id}` gespeichert und die Dashboard-Tabelle aktualisiert sich sofort.
4. Button „Aufgabe löschen“ löscht die Aufgabe nach Bestätigung via `DELETE /api/tasks/{id}`.

#### Phase 6: Checkup-Workflow & Historie im Dashboard
**Goal**: Integration der Checkup-Erfassung und Historie direkt im Dashboard.  
**Depends on**: Phase 5  
**Requirements**: CHECKUP-01, CHECKUP-02  
**Success Criteria**:
1. Im Task-Modal können neuer Status, Kommentar und Wiedervorlage eingetragen und gespeichert werden (`POST /api/tasks/{id}/updates`).
2. Die bisherige Checkup-Historie wird übersichtlich und scrollbar mit Datum, Status-Badge, Wiedervorlage und Kommentar angezeigt.
3. Nach dem Speichern eines Checkups aktualisieren sich Historie und Dashboard-KPIs sofort.

#### Phase 7: Live-Verifikation & Workflow-Test
**Goal**: Sicherstellung der fehlerfreien Gesamtfunktion in Frontend und Backend.  
**Depends on**: Phase 6  
**Success Criteria**:
1. `npx tsc --noEmit` und Next.js Build laufen fehlerfrei durch.
2. Dashboard unter `http://localhost:3000` öffnet das Modal, editiert Aufgaben, erfasst Checkups und löscht Tasks verifiziert.

---

## Completed: Milestone v1.0

- [x] **Phase 1: Checkup-basierte Gantt-Timeline** – Balken und Auslastungsmetrik vom ersten bis zum letzten Checkup.
- [x] **Phase 2: Backend-Härtung & Technische Schulden** – Absicherung der SQLite-Verbindungen (WAL-Modus) und `requirements.txt`.
- [x] **Phase 3: Start & Verifikation der Gesamtanwendung** – Start beider Services und End-to-End-Funktionstest.
