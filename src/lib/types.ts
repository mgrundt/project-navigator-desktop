export type TaskStatus = 'Nicht gestartet' | 'In Arbeit' | 'Blockiert' | 'Review' | 'Done';
export type TaskCategory = 'Tech' | 'PM' | 'Kommunikation' | 'Orga' | 'Sonstiges';
export type StrategicPriority = 1 | 2 | 3 | 4;

export interface Employee {
  id: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: 'Aktiv' | 'Pausiert' | 'Abgeschlossen';
  streamId: string | null;
  createdAt: string;
}

export interface Stream {
  id: string;
  name: string;
  description: string;
  color: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  employeeId: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  dueDate: string | null;
  nextFollowUpDate: string | null;
  lastCheckDate: string;
  createdAt: string;
  outcome: string;
  strategicPriority: StrategicPriority | null;
}

export interface Update {
  id: string;
  taskId: string;
  date: string;
  statusEntry: TaskStatus;
  comment: string;
  nextFollowUpDate: string | null;
  createdAt: string;
}
