# Roadmap: Project Navigator Desktop

## Overview

Strukturierte Umsetzung der drei priorisierten Schwerpunkte:
1. Umstellung des Gantt-Diagramms auf den Checkup-Zeitraum (erster bis letzter Checkup) zur Visualisierung der echten Parallelarbeit.
2. Behebung dringender technischer Schulden und Härtung des Backends (Dependency-Vollständigkeit und SQLite WAL-Modus).
3. Start und ganzheitliche End-to-End-Verifikation beider Applikationsdienste.

## Phases

- [x] **Phase 1: Checkup-basierte Gantt-Timeline** – Balken und Auslastungsmetriken vom ersten bis zum letzten Checkup.
- [x] **Phase 2: Backend-Härtung & Technische Schulden** – Absicherung der SQLite-Verbindungen (WAL-Modus) und `requirements.txt`.
- [ ] **Phase 3: Start & Verifikation der Gesamtanwendung** – Start beider Services und End-to-End-Funktionstest.

## Phase Details

### Phase 1: Checkup-basierte Gantt-Timeline
**Goal**: Visualisierung der tatsächlich parallel laufenden Aufgaben anhand der Checkup-Historie im Gantt-Chart.  
**Depends on**: Nothing (Datenbankabfrage in `TASK_DETAILS_SELECT` bereits vorbereitet)  
**Requirements**: GANTT-01, GANTT-02, GANTT-03, GANTT-04  
**Status**: Abgeschlossen  
**Success Criteria**:
1. Jeder Task-Balken beginnt am Datum des ersten Checkups und endet am Datum des letzten Checkups. [Erfüllt]
2. Bei Aufgaben mit nur einem Checkup oder Start == Ende wird ein sichtbarer 1-Tages-Mindestbalken gerendert. [Erfüllt]
3. Aufgaben ohne Checkups fallen sauber auf Erstellungsdatum / Startdatum zurück. [Erfüllt]
4. Der Zähler "parallele Aufgaben heute" identifiziert Tasks, deren Checkup-Intervall heute aktiv ist. [Erfüllt]
5. Tooltips zeigen Checkup-Anzahl und Datumsintervall an. [Erfüllt]

### Phase 2: Backend-Härtung & Technische Schulden
**Goal**: Beseitigung identifizierter Stabilitätsrisiken im Backend.  
**Depends on**: Phase 1  
**Requirements**: DEBT-01, DEBT-02  
**Status**: Abgeschlossen  
**Success Criteria**:
1. `pypdf>=5.0.0` ist in `backend/requirements.txt` enthalten. [Erfüllt]
2. In `backend/app/database.py` wird die SQLite-Verbindung mit `PRAGMA journal_mode = WAL;` und `PRAGMA busy_timeout = 5000;` initialisiert. [Erfüllt]

### Phase 3: Start & Verifikation der Gesamtanwendung
**Goal**: Erfolgreicher Start von Backend und Frontend sowie Verifikation der Daten und UI.  
**Depends on**: Phase 2  
**Requirements**: APP-01, APP-02, APP-03  
**Status**: In Durchführung  
**Success Criteria**:
1. FastAPI Backend läuft auf Port 8000 und liefert `http://localhost:8000/docs` sowie `/api/capacity`.
2. Next.js Frontend läuft auf Port 3000 und rendert das aktualisierte Gantt-Diagramm fehlerfrei.
3. Die parallele Aufgabenlast heute zeigt die aktuellen aktiven Tasks an.
