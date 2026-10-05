# Projekt-Navigator Desktop

Vollständige Projekt- und Teamverwaltung auf Basis von **Next.js (App Router)**, **Tailwind CSS & shadcn/ui** und einem lokalen **FastAPI**-Backend mit SQLite-Datenbank.

## Architektur

- **Frontend:** Next.js (App Router), Tailwind CSS (OKLCH Themes), Lucide Icons, Recharts, shadcn/ui
- **Backend:** Python 3.11+, FastAPI, Pydantic v2, PyMuPDF, pypdf
- **Datenbank:** Lokale SQLite-Datenbank (`backend/project_navigator.db`) mit automatischer Pfadauflösung
- **PDF-Reporting:** Generierung von Vorlagen und Berichten via PyMuPDF und pypdf

## Seitenstruktur & Funktionalitäten

| Route | Seite | Inhalt & Business-Logik |
|---|---|---|
| `/` | **Dashboard** | Strategische Leitplanken (Sources of Truth, Lernleitplanken, Operativ), 4 Kern-KPIs (Team, aktive Projekte, offene & erledigte Aufgaben), anstehende Aufgaben nach Wiedervorlage/Fälligkeit mit Dringlichkeits-Badges, PDF-Export |
| `/heute` | **Team-Fokus heute** | Aufgaben, die heute Aufmerksamkeit erfordern (Status *In Bearbeitung* oder *Wartet* und Fälligkeit/Wiedervorlage fällig). Meilenstein-Fortschrittsbalken, letzter Checkup-Kommentar, Inline-Status-Update- & Wiedervorlage-Formular, PDF-Export |
| `/kapazitaeten` | **Kapazitäten** | Interaktives Mitarbeiter-Gantt-Diagramm über Monatszeitachsen, Workload pro Mitarbeiter (Bar Chart), Projekt-Dichte (Bar Chart), filterbare Auslastungsmatrix nach Status |
| `/uebersicht` | **Übersicht** | Vollständiger strategischer Portfolio-Drilldown: Stream → Projekt → Aufgabe → Meilensteine / Projektschritte → Chronologische Bearbeitungshistorie |
| `/setup` | **Setup** | Vollständiges CRUD-Management für: 1) Strategische Streams (Themenfelder), 2) Team-Mitarbeiter, 3) Projekte, 4) Aufgaben (inkl. Inline-Bearbeitung), 5) Mini-Projektpläne (Meilensteine/Schritte) |

## Starten

### Einfacher Start (Windows)
Doppelklick auf `start_navigator.bat` im Projektordner.

### Manueller Start in zwei Terminals:

**1. Backend (FastAPI):**
```bash
cd backend
.venv\Scripts\activate
uvicorn main:app --reload --port 8000
```
API-Dokumentation: http://127.0.0.1:8000/docs

**2. Frontend (Next.js):**
```bash
npm run dev
```
Benutzeroberfläche: http://localhost:3000
