#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

mod db;

use tauri::Manager;

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let window = app.get_window("main").unwrap();
      window.set_title("Project Navigator Desktop").unwrap();
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      db::init_db,
      db::get_employees,
      db::add_employee,
      db::delete_employee,
      db::get_streams,
      db::add_stream,
      db::update_stream,
      db::delete_stream,
      db::get_projects,
      db::add_project,
      db::update_project,
      db::delete_project,
      db::get_tasks,
      db::add_task,
      db::update_task,
      db::delete_task,
      db::get_updates_for_task,
      db::add_update,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
