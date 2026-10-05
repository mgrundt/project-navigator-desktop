export type Stream = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  created_at: string;
};

export type Project = {
  id: string;
  stream_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  stream_name?: string | null;
};

export type Task = {
  id: string;
  project_id: string;
  employee_id?: string | null;
  title: string;
  description: string;
  category: string;
  status: string;
  start_date?: string | null;
  due_date: string | null;
  next_follow_up_date: string | null;
  last_check_date?: string | null;
  created_at: string;
  project_name?: string | null;
  project_start_date?: string | null;
  project_end_date?: string | null;
  stream_id?: string | null;
  stream_name?: string | null;
  employee_name?: string | null;
  last_comment?: string | null;
  steps?: {
    id: string;
    task_id: string;
    step_number: number;
    description: string;
    is_completed: boolean;
  }[];
};

export type UpcomingTask = Task & {
  focus_label: string;
  days_until: number | null;
};

export type DashboardData = {
  stats: {
    employees: number;
    active_projects: number;
    open_tasks: number;
    done_tasks: number;
  };
  upcoming: UpcomingTask[];
};

export type CapacityData = {
  by_employee: { name: string; open_tasks: number }[];
  by_project: { name: string; open_tasks: number }[];
  tasks: Task[];
  gantt_tasks: Task[];
  employees: Employee[];
};

export type TaskUpdateEntry = {
  id?: string | null;
  task_id?: string | null;
  date: string;
  status_entry: string;
  comment: string;
  next_follow_up_date?: string | null;
  created_at?: string | null;
};

export type TaskStep = {
  id: string;
  task_id: string;
  step_number: number;
  description: string;
  is_completed: boolean;
};

export type OverviewTask = Task & {
  history: TaskUpdateEntry[];
  steps: TaskStep[];
};

export type OverviewProject = Project & {
  tasks: OverviewTask[];
};

export type OverviewStream = Stream & {
  projects: OverviewProject[];
};

export type Meta = {
  task_statuses: string[];
  project_statuses: string[];
  task_categories: string[];
};
