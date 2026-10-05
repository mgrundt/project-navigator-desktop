"""SQLite-Zugriff für den bestehenden projektverwaltung.db-Bestand."""

from __future__ import annotations

import sqlite3
import uuid
from contextlib import contextmanager
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterator, Optional

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = Path(__file__).resolve().parents[2]
CANDIDATE_DBS = [
    BACKEND_DIR / "project_navigator.db",
    BACKEND_DIR / "projektverwaltung.db",
    ROOT_DIR / "project_navigator.db",
    ROOT_DIR / "projektverwaltung.db",
    BACKEND_DIR / "data" / "projektverwaltung.db",
]

TASK_STATUSES = ("Nicht gestartet", "In Bearbeitung", "Wartet", "Abgeschlossen")
PROJECT_STATUSES = ("Aktiv", "In Planung", "Abgeschlossen")
TASK_CATEGORIES = (
    "Entwicklung",
    "Konzeption",
    "Meeting",
    "Dokumentation",
    "Sonstiges",
)
TODAY_STATUSES = ("In Bearbeitung", "Wartet")


def resolve_db_path() -> Path:
    """Findet die vorhandene SQLite-Datenbank (project_navigator.db oder projektverwaltung.db)."""
    for candidate in CANDIDATE_DBS:
        if candidate.exists():
            return candidate
    default_db = BACKEND_DIR / "project_navigator.db"
    default_db.parent.mkdir(parents=True, exist_ok=True)
    return default_db


def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def today_str() -> str:
    return date.today().isoformat()


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return dict(row)


def rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(r) for r in rows]


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(resolve_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS streams (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            );
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            );
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                stream_id TEXT NOT NULL,
                name TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT,
                status TEXT NOT NULL DEFAULT 'Aktiv',
                created_at TEXT NOT NULL,
                FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE
            );
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                employee_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                category TEXT NOT NULL DEFAULT 'Sonstiges',
                status TEXT NOT NULL DEFAULT 'Nicht gestartet',
                start_date TEXT,
                due_date TEXT,
                next_follow_up_date TEXT,
                last_check_date TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            );
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS updates (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                date TEXT NOT NULL,
                status_entry TEXT NOT NULL,
                comment TEXT NOT NULL DEFAULT '',
                next_follow_up_date TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS task_steps (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                step_number INTEGER NOT NULL,
                description TEXT NOT NULL,
                is_completed INTEGER DEFAULT 0,
                FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
            );
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                page_count INTEGER NOT NULL,
                text TEXT NOT NULL
            );
            """
        )
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_employee ON tasks(employee_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_updates_task ON updates(task_id);")
        _ensure_task_start_date(cursor)


def _ensure_task_start_date(cursor: sqlite3.Cursor) -> None:
    columns = {row[1] for row in cursor.execute("PRAGMA table_info(tasks)").fetchall()}
    if "start_date" not in columns:
        cursor.execute("ALTER TABLE tasks ADD COLUMN start_date TEXT")
    cursor.execute(
        """
        UPDATE tasks
        SET start_date = DATE(created_at)
        WHERE start_date IS NULL OR TRIM(start_date) = ''
        """
    )


def new_id() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Streams
# ---------------------------------------------------------------------------

def list_streams() -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM streams ORDER BY name").fetchall()
        return rows_to_dicts(rows)


def get_stream(stream_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        return row_to_dict(conn.execute("SELECT * FROM streams WHERE id = ?", (stream_id,)).fetchone())


def add_stream(name: str, description: str = "") -> dict[str, Any]:
    item = {
        "id": new_id(),
        "name": name.strip(),
        "description": description.strip(),
        "created_at": now_str(),
    }
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO streams (id, name, description, created_at) VALUES (?, ?, ?, ?)",
            (item["id"], item["name"], item["description"], item["created_at"]),
        )
    return item


def delete_stream(stream_id: str) -> bool:
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM streams WHERE id = ?", (stream_id,))
        return cur.rowcount > 0


# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------

def list_employees() -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM employees ORDER BY name").fetchall()
        return rows_to_dicts(rows)


def get_employee(employee_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        return row_to_dict(
            conn.execute("SELECT * FROM employees WHERE id = ?", (employee_id,)).fetchone()
        )


def add_employee(name: str, role: str = "") -> dict[str, Any]:
    item = {
        "id": new_id(),
        "name": name.strip(),
        "role": role.strip(),
        "created_at": now_str(),
    }
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO employees (id, name, role, created_at) VALUES (?, ?, ?, ?)",
            (item["id"], item["name"], item["role"], item["created_at"]),
        )
    return item


def delete_employee(employee_id: str) -> bool:
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM employees WHERE id = ?", (employee_id,))
        return cur.rowcount > 0


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

def list_projects() -> list[dict[str, Any]]:
    query = """
        SELECT p.*, s.name AS stream_name
        FROM projects p
        JOIN streams s ON p.stream_id = s.id
        ORDER BY s.name, p.name
    """
    with get_connection() as conn:
        return rows_to_dicts(conn.execute(query).fetchall())


def get_project(project_id: str) -> dict[str, Any] | None:
    query = """
        SELECT p.*, s.name AS stream_name
        FROM projects p
        JOIN streams s ON p.stream_id = s.id
        WHERE p.id = ?
    """
    with get_connection() as conn:
        return row_to_dict(conn.execute(query, (project_id,)).fetchone())


def add_project(
    stream_id: str,
    name: str,
    start_date: str,
    end_date: Optional[str] = None,
    status: str = "Aktiv",
) -> dict[str, Any]:
    item_id = new_id()
    created = now_str()
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO projects (id, stream_id, name, start_date, end_date, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (item_id, stream_id, name.strip(), start_date, end_date, status, created),
        )
    project = get_project(item_id)
    if project is None:
        raise RuntimeError("Projekt konnte nicht gelesen werden.")
    return project


def delete_project(project_id: str) -> bool:
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        return cur.rowcount > 0


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

TASK_DETAILS_SELECT = """
    SELECT
        t.id,
        t.project_id,
        t.employee_id,
        t.title,
        t.description,
        t.category,
        t.status,
        t.start_date,
        t.due_date,
        t.next_follow_up_date,
        t.last_check_date,
        t.created_at,
        p.name AS project_name,
        p.start_date AS project_start_date,
        p.end_date AS project_end_date,
        p.stream_id,
        s.name AS stream_name,
        e.name AS employee_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN streams s ON p.stream_id = s.id
    JOIN employees e ON t.employee_id = e.id
"""


def list_tasks() -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(TASK_DETAILS_SELECT + " ORDER BY t.created_at DESC").fetchall()
        return rows_to_dicts(rows)


def get_task(task_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        return row_to_dict(
            conn.execute(TASK_DETAILS_SELECT + " WHERE t.id = ?", (task_id,)).fetchone()
        )


def add_task(
    project_id: str,
    employee_id: str,
    title: str,
    description: str = "",
    category: str = "Sonstiges",
    status: str = "Nicht gestartet",
    due_date: Optional[str] = None,
    start_date: Optional[str] = None,
) -> dict[str, Any]:
    item_id = new_id()
    created = now_str()
    resolved_start = start_date or created[:10]
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO tasks (
                id, project_id, employee_id, title, description, category, status,
                start_date, due_date, last_check_date, created_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                item_id,
                project_id,
                employee_id,
                title.strip(),
                description.strip(),
                category,
                status,
                resolved_start,
                due_date,
                created,
                created,
            ),
        )
    task = get_task(item_id)
    if task is None:
        raise RuntimeError("Aufgabe konnte nicht gelesen werden.")
    return task


def update_task(task_id: str, fields: dict[str, Any]) -> dict[str, Any] | None:
    allowed = {
        "title",
        "description",
        "category",
        "status",
        "start_date",
        "due_date",
        "next_follow_up_date",
        "project_id",
        "employee_id",
    }
    payload = {k: v for k, v in fields.items() if k in allowed and v is not ...}
    if not payload:
        return get_task(task_id)
    assignments = ", ".join(f"{k} = ?" for k in payload)
    values = list(payload.values()) + [task_id]
    with get_connection() as conn:
        cur = conn.execute(f"UPDATE tasks SET {assignments} WHERE id = ?", values)
        if cur.rowcount == 0:
            return None
    return get_task(task_id)


def delete_task(task_id: str) -> bool:
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        return cur.rowcount > 0


def list_today_tasks() -> list[dict[str, Any]]:
    today = today_str()
    query = """
        SELECT
            t.id,
            t.project_id,
            t.employee_id,
            t.title,
            t.description,
            t.category,
            t.status,
            t.start_date,
            t.due_date,
            t.next_follow_up_date,
            t.last_check_date,
            t.created_at,
            p.name AS project_name,
            p.start_date AS project_start_date,
            p.end_date AS project_end_date,
            p.stream_id,
            s.name AS stream_name,
            e.name AS employee_name,
            (
                SELECT comment
                FROM updates
                WHERE task_id = t.id
                ORDER BY created_at DESC
                LIMIT 1
            ) AS last_comment
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        JOIN streams s ON p.stream_id = s.id
        JOIN employees e ON t.employee_id = e.id
        WHERE t.status IN ('In Bearbeitung', 'Wartet')
          AND (t.next_follow_up_date IS NULL OR DATE(t.next_follow_up_date) <= DATE(?))
        ORDER BY e.name, t.title
    """
    with get_connection() as conn:
        return rows_to_dicts(conn.execute(query, (today,)).fetchall())


def add_task_update(
    task_id: str,
    status_entry: str,
    comment: str = "",
    next_follow_up: Optional[str] = None,
) -> dict[str, Any]:
    generated = new_id()
    created = now_str()
    follow_up = None if status_entry == "Abgeschlossen" else next_follow_up
    with get_connection() as conn:
        exists = conn.execute("SELECT id FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if exists is None:
            raise KeyError(task_id)
        conn.execute(
            """INSERT INTO updates (id, task_id, date, status_entry, comment, next_follow_up_date, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (generated, task_id, created, status_entry, comment.strip(), follow_up, created),
        )
        conn.execute(
            """UPDATE tasks
               SET status = ?, next_follow_up_date = ?, last_check_date = ?
               WHERE id = ?""",
            (status_entry, follow_up, created, task_id),
        )
    return {
        "id": generated,
        "task_id": task_id,
        "date": created,
        "status_entry": status_entry,
        "comment": comment.strip(),
        "next_follow_up_date": follow_up,
        "created_at": created,
    }


def get_task_history(task_id: str) -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            """SELECT id, task_id, date, status_entry, comment, next_follow_up_date, created_at
               FROM updates WHERE task_id = ? ORDER BY created_at DESC""",
            (task_id,),
        ).fetchall()
        return rows_to_dicts(rows)


def get_steps_for_task(task_id: str) -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM task_steps WHERE task_id = ? ORDER BY step_number",
            (task_id,),
        ).fetchall()
        items = rows_to_dicts(rows)
        for item in items:
            item["is_completed"] = bool(item["is_completed"])
        return items


def save_task_steps(task_id: str, steps: list[dict[str, Any]]) -> list[dict[str, Any]]:
    with get_connection() as conn:
        conn.execute("DELETE FROM task_steps WHERE task_id = ?", (task_id,))
        number = 1
        for step in steps:
            description = str(step.get("description") or "").strip()
            if not description:
                continue
            conn.execute(
                """INSERT INTO task_steps (id, task_id, step_number, description, is_completed)
                   VALUES (?, ?, ?, ?, ?)""",
                (
                    new_id(),
                    task_id,
                    number,
                    description,
                    1 if step.get("is_completed") else 0,
                ),
            )
            number += 1
    return get_steps_for_task(task_id)


def get_dashboard_stats() -> dict[str, Any]:
    with get_connection() as conn:
        employees = conn.execute("SELECT COUNT(*) AS n FROM employees").fetchone()["n"]
        active_projects = conn.execute(
            "SELECT COUNT(*) AS n FROM projects WHERE status = 'Aktiv'"
        ).fetchone()["n"]
        open_tasks = conn.execute(
            "SELECT COUNT(*) AS n FROM tasks WHERE status != 'Abgeschlossen'"
        ).fetchone()["n"]
        done_tasks = conn.execute(
            "SELECT COUNT(*) AS n FROM tasks WHERE status = 'Abgeschlossen'"
        ).fetchone()["n"]
    return {
        "employees": employees,
        "active_projects": active_projects,
        "open_tasks": open_tasks,
        "done_tasks": done_tasks,
    }


def get_capacity() -> dict[str, Any]:
    all_tasks = list_tasks()
    tasks = [t for t in all_tasks if t["status"] != "Abgeschlossen"]
    by_employee: dict[str, int] = {}
    by_project: dict[str, int] = {}
    for task in tasks:
        by_employee[task["employee_name"]] = by_employee.get(task["employee_name"], 0) + 1
        by_project[task["project_name"]] = by_project.get(task["project_name"], 0) + 1
    return {
        "by_employee": [
            {"name": name, "open_tasks": count}
            for name, count in sorted(by_employee.items(), key=lambda x: (-x[1], x[0]))
        ],
        "by_project": [
            {"name": name, "open_tasks": count}
            for name, count in sorted(by_project.items(), key=lambda x: (-x[1], x[0]))
        ],
        "tasks": tasks,
        "gantt_tasks": all_tasks,
        "employees": list_employees(),
    }


def get_overview() -> list[dict[str, Any]]:
    streams = list_streams()
    projects = list_projects()
    tasks = list_tasks()
    history_by_task: dict[str, list[dict[str, Any]]] = {}
    steps_by_task: dict[str, list[dict[str, Any]]] = {}
    with get_connection() as conn:
        for row in conn.execute(
            "SELECT * FROM updates ORDER BY created_at DESC"
        ).fetchall():
            item = dict(row)
            history_by_task.setdefault(item["task_id"], []).append(item)
        for row in conn.execute(
            "SELECT * FROM task_steps ORDER BY step_number"
        ).fetchall():
            item = dict(row)
            item["is_completed"] = bool(item["is_completed"])
            steps_by_task.setdefault(item["task_id"], []).append(item)

    projects_by_stream: dict[str, list[dict[str, Any]]] = {}
    for project in projects:
        projects_by_stream.setdefault(project["stream_id"], []).append(project)

    tasks_by_project: dict[str, list[dict[str, Any]]] = {}
    for task in tasks:
        enriched = {
            **task,
            "history": history_by_task.get(task["id"], []),
            "steps": steps_by_task.get(task["id"], []),
        }
        tasks_by_project.setdefault(task["project_id"], []).append(enriched)

    result = []
    for stream in streams:
        stream_projects = []
        for project in projects_by_stream.get(stream["id"], []):
            stream_projects.append(
                {
                    **project,
                    "tasks": tasks_by_project.get(project["id"], []),
                }
            )
        result.append({**stream, "projects": stream_projects})
    return result
