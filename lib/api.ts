import type {
  CapacityData,
  DashboardData,
  Employee,
  Meta,
  OverviewStream,
  Project,
  Stream,
  Task,
  TaskStep,
  TaskUpdateEntry,
} from "./types";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

function resolveUrl(path: string): string {
  if (BASE_URL && path.startsWith("/")) {
    return `${BASE_URL}${path}`;
  }
  return path;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(resolveUrl(path), { ...init, headers });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const payload = await response.json();
      detail = payload.detail ?? JSON.stringify(payload);
    } catch {
      detail = await response.text();
    }
    throw new Error(Array.isArray(detail) ? detail.map((d) => d.msg ?? d).join(", ") : String(detail));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  meta: () => request<Meta>("/api/meta"),
  dashboard: () => request<DashboardData>("/api/dashboard"),
  capacity: () => request<CapacityData>("/api/capacity"),
  overview: () => request<OverviewStream[]>("/api/overview"),
  streams: () => request<Stream[]>("/api/streams"),
  createStream: (body: { name: string; description?: string }) =>
    request<Stream>("/api/streams", { method: "POST", body: JSON.stringify(body) }),
  deleteStream: (id: string) => request<void>(`/api/streams/${id}`, { method: "DELETE" }),
  employees: () => request<Employee[]>("/api/employees"),
  createEmployee: (body: { name: string; role?: string }) =>
    request<Employee>("/api/employees", { method: "POST", body: JSON.stringify(body) }),
  deleteEmployee: (id: string) => request<void>(`/api/employees/${id}`, { method: "DELETE" }),
  projects: () => request<Project[]>("/api/projects"),
  createProject: (body: {
    stream_id: string;
    name: string;
    start_date: string;
    status: string;
  }) => request<Project>("/api/projects", { method: "POST", body: JSON.stringify(body) }),
  deleteProject: (id: string) => request<void>(`/api/projects/${id}`, { method: "DELETE" }),
  tasks: () => request<Task[]>("/api/tasks"),
  todayTasks: () => request<Task[]>("/api/tasks/today"),
  createTask: (body: {
    project_id: string;
    employee_id: string;
    title: string;
    description?: string;
    category: string;
    status: string;
    priority?: string;
    start_date?: string | null;
    due_date?: string | null;
  }) => request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(body) }),
  patchTask: (id: string, body: Partial<Task>) => {
    const cleaned = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, value === "" ? null : value]),
    );
    return request<Task>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(cleaned),
    });
  },
  deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
  addTaskUpdate: (
    id: string,
    body: { status_entry: string; comment?: string; next_follow_up_date?: string | null },
  ) => request<TaskUpdateEntry>(`/api/tasks/${id}/updates`, { method: "POST", body: JSON.stringify(body) }),
  taskSteps: (id: string) => request<TaskStep[]>(`/api/tasks/${id}/steps`),
  saveTaskSteps: (id: string, steps: { description: string; is_completed: boolean }[]) =>
    request<TaskStep[]>(`/api/tasks/${id}/steps`, { method: "PUT", body: JSON.stringify(steps) }),
  taskHistory: (id: string) => request<TaskUpdateEntry[]>(`/api/tasks/${id}/history`),
};

export const pdfUrls = {
  upcoming: resolveUrl("/api/reports/upcoming.pdf"),
  today: resolveUrl("/api/reports/heute.pdf"),
};
