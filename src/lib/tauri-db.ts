import { invoke } from '@tauri-apps/api/core';
import type { Employee, Stream, Project, Task, Update } from './types';

export async function initDb(): Promise<void> {
  await invoke('init_db');
}

export async function getEmployees(): Promise<Employee[]> {
  return invoke('get_employees');
}

export async function addEmployee(name: string, role: string): Promise<Employee> {
  return invoke('add_employee', { name, role });
}

export async function deleteEmployee(id: string): Promise<void> {
  await invoke('delete_employee', { id });
}

export async function getStreams(): Promise<Stream[]> {
  return invoke('get_streams');
}

export async function addStream(stream: Omit<Stream, 'id' | 'createdAt'>): Promise<Stream> {
  return invoke('add_stream', stream);
}

export async function updateStream(stream: Stream): Promise<void> {
  await invoke('update_stream', stream as unknown as Record<string, unknown>);
}

export async function deleteStream(id: string): Promise<void> {
  await invoke('delete_stream', { id });
}

export async function getProjects(): Promise<Project[]> {
  return invoke('get_projects');
}

export async function addProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
  return invoke('add_project', project);
}

export async function updateProject(project: Project): Promise<void> {
  await invoke('update_project', project as unknown as Record<string, unknown>);
}

export async function deleteProject(id: string): Promise<void> {
  await invoke('delete_project', { id });
}

export async function getTasks(): Promise<Task[]> {
  return invoke('get_tasks');
}

export async function addTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
  return invoke('add_task', task);
}

export async function updateTask(task: Task): Promise<void> {
  await invoke('update_task', task as unknown as Record<string, unknown>);
}

export async function deleteTask(id: string): Promise<void> {
  await invoke('delete_task', { id });
}

export async function getUpdatesForTask(taskId: string): Promise<Update[]> {
  return invoke('get_updates_for_task', { taskId });
}

export async function addUpdate(update: Omit<Update, 'id' | 'createdAt'>): Promise<Update> {
  return invoke('add_update', update);
}
