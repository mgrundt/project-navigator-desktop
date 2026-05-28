use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::AppHandle;

#[derive(Serialize, Deserialize)]
pub struct Employee {
  pub id: String,
  pub name: String,
  pub role: String,
  pub created_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct Stream {
  pub id: String,
  pub name: String,
  pub description: String,
  pub color: Option<String>,
  pub sort_order: i64,
  pub created_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct Project {
  pub id: String,
  pub name: String,
  pub start_date: String,
  pub end_date: Option<String>,
  pub status: String,
  pub stream_id: Option<String>,
  pub created_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct Task {
  pub id: String,
  pub project_id: String,
  pub employee_id: String,
  pub title: String,
  pub description: String,
  pub category: String,
  pub status: String,
  pub due_date: Option<String>,
  pub next_follow_up_date: Option<String>,
  pub last_check_date: String,
  pub created_at: String,
  pub outcome: String,
  pub strategic_priority: Option<i64>,
}

#[derive(Serialize, Deserialize)]
pub struct Update {
  pub id: String,
  pub task_id: String,
  pub date: String,
  pub status_entry: String,
  pub comment: String,
  pub next_follow_up_date: Option<String>,
  pub created_at: String,
}

fn db_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
  let data_dir = app_handle
    .path_resolver()
    .app_data_dir()
    .ok_or_else(|| "Failed to resolve app data directory".to_string())?;
  fs::create_dir_all(&data_dir).map_err(|err| err.to_string())?;
  Ok(data_dir.join("project-navigator.db"))
}

fn open_connection(app_handle: &AppHandle) -> Result<Connection, String> {
  let path = db_path(app_handle)?;
  let conn = Connection::open(path).map_err(|err| err.to_string())?;
  conn.execute_batch("PRAGMA foreign_keys = ON;")
    .map_err(|err| err.to_string())?;
  Ok(conn)
}

#[tauri::command]
pub fn init_db(app_handle: AppHandle) -> Result<(), String> {
  let conn = open_connection(&app_handle)?;
  conn.execute_batch(
    r#"
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS streams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      color TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      status TEXT NOT NULL,
      stream_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(stream_id) REFERENCES streams(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      due_date TEXT,
      next_follow_up_date TEXT,
      last_check_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      outcome TEXT NOT NULL DEFAULT '',
      strategic_priority INTEGER,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS updates (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status_entry TEXT NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      next_follow_up_date TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
    "#,
  )
  .map_err(|err| err.to_string())?;
  Ok(())
}

#[tauri::command]
pub fn get_employees(app_handle: AppHandle) -> Result<Vec<Employee>, String> {
  let conn = open_connection(&app_handle)?;
  let mut stmt = conn
    .prepare("SELECT id, name, role, created_at FROM employees ORDER BY created_at ASC")
    .map_err(|err| err.to_string())?;
  let rows = stmt
    .query_map([], |row| {
      Ok(Employee {
        id: row.get(0)?,
        name: row.get(1)?,
        role: row.get(2)?,
        created_at: row.get(3)?,
      })
    })
    .map_err(|err| err.to_string())?;

  let mut employees = Vec::new();
  for employee in rows {
    employees.push(employee.map_err(|err| err.to_string())?);
  }
  Ok(employees)
}

#[tauri::command]
pub fn add_employee(app_handle: AppHandle, name: String, role: String) -> Result<Employee, String> {
  let conn = open_connection(&app_handle)?;
  let employee = Employee {
    id: uuid::Uuid::new_v4().to_string(),
    name,
    role,
    created_at: Utc::now().to_rfc3339(),
  };
  conn.execute(
    "INSERT INTO employees (id, name, role, created_at) VALUES (?1, ?2, ?3, ?4)",
    params![employee.id, employee.name, employee.role, employee.created_at],
  )
  .map_err(|err| err.to_string())?;
  Ok(employee)
}

#[tauri::command]
pub fn delete_employee(app_handle: AppHandle, id: String) -> Result<(), String> {
  let conn = open_connection(&app_handle)?;
  conn.execute("DELETE FROM employees WHERE id = ?1", params![id])
    .map_err(|err| err.to_string())?;
  Ok(())
}

#[tauri::command]
pub fn get_streams(app_handle: AppHandle) -> Result<Vec<Stream>, String> {
  let conn = open_connection(&app_handle)?;
  let mut stmt = conn
    .prepare("SELECT id, name, description, color, sort_order, created_at FROM streams ORDER BY sort_order ASC, created_at ASC")
    .map_err(|err| err.to_string())?;
  let rows = stmt
    .query_map([], |row| {
      Ok(Stream {
        id: row.get(0)?,
        name: row.get(1)?,
        description: row.get(2)?,
        color: row.get(3)?,
        sort_order: row.get(4)?,
        created_at: row.get(5)?,
      })
    })
    .map_err(|err| err.to_string())?;

  let mut streams = Vec::new();
  for stream in rows {
    streams.push(stream.map_err(|err| err.to_string())?);
  }
  Ok(streams)
}

#[tauri::command]
pub fn add_stream(
  app_handle: AppHandle,
  name: String,
  description: String,
  color: Option<String>,
  sort_order: i64,
) -> Result<Stream, String> {
  let conn = open_connection(&app_handle)?;
  let stream = Stream {
    id: uuid::Uuid::new_v4().to_string(),
    name,
    description,
    color,
    sort_order,
    created_at: Utc::now().to_rfc3339(),
  };
  conn.execute(
    "INSERT INTO streams (id, name, description, color, sort_order, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    params![stream.id, stream.name, stream.description, stream.color, stream.sort_order, stream.created_at],
  )
  .map_err(|err| err.to_string())?;
  Ok(stream)
}

#[tauri::command]
pub fn update_stream(app_handle: AppHandle, stream: Stream) -> Result<(), String> {
  let conn = open_connection(&app_handle)?;
  conn.execute(
    "UPDATE streams SET name = ?1, description = ?2, color = ?3, sort_order = ?4 WHERE id = ?5",
    params![stream.name, stream.description, stream.color, stream.sort_order, stream.id],
  )
  .map_err(|err| err.to_string())?;
  Ok(())
}

#[tauri::command]
pub fn delete_stream(app_handle: AppHandle, id: String) -> Result<(), String> {
  let conn = open_connection(&app_handle)?;
  conn.execute("DELETE FROM streams WHERE id = ?1", params![id])
    .map_err(|err| err.to_string())?;
  Ok(())
}

#[tauri::command]
pub fn get_projects(app_handle: AppHandle) -> Result<Vec<Project>, String> {
  let conn = open_connection(&app_handle)?;
  let mut stmt = conn
    .prepare("SELECT id, name, start_date, end_date, status, stream_id, created_at FROM projects ORDER BY created_at ASC")
    .map_err(|err| err.to_string())?;
  let rows = stmt
    .query_map([], |row| {
      Ok(Project {
        id: row.get(0)?,
        name: row.get(1)?,
        start_date: row.get(2)?,
        end_date: row.get(3)?,
        status: row.get(4)?,
        stream_id: row.get(5)?,
        created_at: row.get(6)?,
      })
    })
    .map_err(|err| err.to_string())?;

  let mut projects = Vec::new();
  for project in rows {
    projects.push(project.map_err(|err| err.to_string())?);
  }
  Ok(projects)
}

#[tauri::command]
pub fn add_project(
  app_handle: AppHandle,
  name: String,
  start_date: String,
  end_date: Option<String>,
  status: String,
  stream_id: Option<String>,
) -> Result<Project, String> {
  let conn = open_connection(&app_handle)?;
  let project = Project {
    id: uuid::Uuid::new_v4().to_string(),
    name,
    start_date,
    end_date,
    status,
    stream_id,
    created_at: Utc::now().to_rfc3339(),
  };
  conn.execute(
    "INSERT INTO projects (id, name, start_date, end_date, status, stream_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
    params![project.id, project.name, project.start_date, project.end_date, project.status, project.stream_id, project.created_at],
  )
  .map_err(|err| err.to_string())?;
  Ok(project)
}

#[tauri::command]
pub fn update_project(app_handle: AppHandle, project: Project) -> Result<(), String> {
  let conn = open_connection(&app_handle)?;
  conn.execute(
    "UPDATE projects SET name = ?1, start_date = ?2, end_date = ?3, status = ?4, stream_id = ?5 WHERE id = ?6",
    params![project.name, project.start_date, project.end_date, project.status, project.stream_id, project.id],
  )
  .map_err(|err| err.to_string())?;
  Ok(())
}

#[tauri::command]
pub fn delete_project(app_handle: AppHandle, id: String) -> Result<(), String> {
  let conn = open_connection(&app_handle)?;
  conn.execute("DELETE FROM projects WHERE id = ?1", params![id])
    .map_err(|err| err.to_string())?;
  Ok(())
}

#[tauri::command]
pub fn get_tasks(app_handle: AppHandle) -> Result<Vec<Task>, String> {
  let conn = open_connection(&app_handle)?;
  let mut stmt = conn
    .prepare(
      "SELECT id, project_id, employee_id, title, description, category, status, due_date, next_follow_up_date, last_check_date, created_at, outcome, strategic_priority FROM tasks ORDER BY created_at ASC",
    )
    .map_err(|err| err.to_string())?;
  let rows = stmt
    .query_map([], |row| {
      Ok(Task {
        id: row.get(0)?,
        project_id: row.get(1)?,
        employee_id: row.get(2)?,
        title: row.get(3)?,
        description: row.get(4)?,
        category: row.get(5)?,
        status: row.get(6)?,
        due_date: row.get(7)?,
        next_follow_up_date: row.get(8)?,
        last_check_date: row.get(9)?,
        created_at: row.get(10)?,
        outcome: row.get(11)?,
        strategic_priority: row.get(12)?,
      })
    })
    .map_err(|err| err.to_string())?;

  let mut tasks = Vec::new();
  for task in rows {
    tasks.push(task.map_err(|err| err.to_string())?);
  }
  Ok(tasks)
}

#[tauri::command]
pub fn add_task(
  app_handle: AppHandle,
  project_id: String,
  employee_id: String,
  title: String,
  description: String,
  category: String,
  status: String,
  due_date: Option<String>,
  next_follow_up_date: Option<String>,
  last_check_date: String,
  outcome: String,
  strategic_priority: Option<i64>,
) -> Result<Task, String> {
  let conn = open_connection(&app_handle)?;
  let task = Task {
    id: uuid::Uuid::new_v4().to_string(),
    project_id,
    employee_id,
    title,
    description,
    category,
    status,
    due_date,
    next_follow_up_date,
    last_check_date,
    created_at: Utc::now().to_rfc3339(),
    outcome,
    strategic_priority,
  };
  conn.execute(
    "INSERT INTO tasks (id, project_id, employee_id, title, description, category, status, due_date, next_follow_up_date, last_check_date, created_at, outcome, strategic_priority) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
    params![
      task.id,
      task.project_id,
      task.employee_id,
      task.title,
      task.description,
      task.category,
      task.status,
      task.due_date,
      task.next_follow_up_date,
      task.last_check_date,
      task.created_at,
      task.outcome,
      task.strategic_priority,
    ],
  )
  .map_err(|err| err.to_string())?;
  Ok(task)
}

#[tauri::command]
pub fn update_task(app_handle: AppHandle, task: Task) -> Result<(), String> {
  let conn = open_connection(&app_handle)?;
  conn.execute(
    "UPDATE tasks SET project_id = ?1, employee_id = ?2, title = ?3, description = ?4, category = ?5, status = ?6, due_date = ?7, next_follow_up_date = ?8, last_check_date = ?9, outcome = ?10, strategic_priority = ?11 WHERE id = ?12",
    params![
      task.project_id,
      task.employee_id,
      task.title,
      task.description,
      task.category,
      task.status,
      task.due_date,
      task.next_follow_up_date,
      task.last_check_date,
      task.outcome,
      task.strategic_priority,
      task.id,
    ],
  )
  .map_err(|err| err.to_string())?;
  Ok(())
}

#[tauri::command]
pub fn delete_task(app_handle: AppHandle, id: String) -> Result<(), String> {
  let conn = open_connection(&app_handle)?;
  conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])
    .map_err(|err| err.to_string())?;
  Ok(())
}

#[tauri::command]
pub fn get_updates_for_task(app_handle: AppHandle, task_id: String) -> Result<Vec<Update>, String> {
  let conn = open_connection(&app_handle)?;
  let mut stmt = conn
    .prepare("SELECT id, task_id, date, status_entry, comment, next_follow_up_date, created_at FROM updates WHERE task_id = ?1 ORDER BY date DESC")
    .map_err(|err| err.to_string())?;
  let rows = stmt
    .query_map([task_id], |row| {
      Ok(Update {
        id: row.get(0)?,
        task_id: row.get(1)?,
        date: row.get(2)?,
        status_entry: row.get(3)?,
        comment: row.get(4)?,
        next_follow_up_date: row.get(5)?,
        created_at: row.get(6)?,
      })
    })
    .map_err(|err| err.to_string())?;

  let mut updates = Vec::new();
  for update in rows {
    updates.push(update.map_err(|err| err.to_string())?);
  }
  Ok(updates)
}

#[tauri::command]
pub fn add_update(
  app_handle: AppHandle,
  task_id: String,
  date: String,
  status_entry: String,
  comment: String,
  next_follow_up_date: Option<String>,
) -> Result<Update, String> {
  let conn = open_connection(&app_handle)?;
  let update = Update {
    id: uuid::Uuid::new_v4().to_string(),
    task_id,
    date,
    status_entry,
    comment,
    next_follow_up_date,
    created_at: Utc::now().to_rfc3339(),
  };
  conn.execute(
    "INSERT INTO updates (id, task_id, date, status_entry, comment, next_follow_up_date, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
    params![
      update.id,
      update.task_id,
      update.date,
      update.status_entry,
      update.comment,
      update.next_follow_up_date,
      update.created_at,
    ],
  )
  .map_err(|err| err.to_string())?;
  Ok(update)
}
