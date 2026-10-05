@echo off
cd /d "%~dp0"

echo ===================================================
echo Starte Projekt-Navigator Desktop (API & Frontend)
echo ===================================================

start "Projekt-Navigator API (FastAPI :8000)" cmd /k "cd /d "%~dp0backend" && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) && uvicorn main:app --reload --port 8000"

start "Projekt-Navigator UI (Next.js :3000)" cmd /k "cd /d "%~dp0" && npm.cmd run dev"

echo Backend und Frontend wurden in separaten Fenstern gestartet.
echo UI: http://localhost:3000
echo API: http://127.0.0.1:8000/docs
