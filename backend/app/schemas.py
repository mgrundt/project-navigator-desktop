from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class StreamCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = ""


class StreamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str = ""
    created_at: str


class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=1)
    role: str = ""


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    role: str = ""
    created_at: str


class ProjectCreate(BaseModel):
    stream_id: str
    name: str = Field(..., min_length=1)
    start_date: date
    end_date: Optional[date] = None
    status: str = "Aktiv"


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    stream_id: str
    name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str
    created_at: str
    stream_name: Optional[str] = None


class TaskCreate(BaseModel):
    project_id: str
    employee_id: str
    title: str = Field(..., min_length=1)
    description: str = ""
    category: str = "Sonstiges"
    status: str = "Nicht gestartet"
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    next_follow_up_date: Optional[date] = None
    project_id: Optional[str] = None
    employee_id: Optional[str] = None


class TaskStepIn(BaseModel):
    description: str
    is_completed: bool = False


class TaskStepOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    step_number: int
    description: str
    is_completed: bool = False


class UpdateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None
    task_id: Optional[str] = None
    date: str
    status_entry: str
    comment: str = ""
    next_follow_up_date: Optional[str] = None
    created_at: Optional[str] = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    employee_id: Optional[str] = None
    title: str
    description: str = ""
    category: str
    status: str
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    next_follow_up_date: Optional[str] = None
    last_check_date: Optional[str] = None
    created_at: str
    project_name: Optional[str] = None
    project_start_date: Optional[str] = None
    project_end_date: Optional[str] = None
    stream_id: Optional[str] = None
    stream_name: Optional[str] = None
    employee_name: Optional[str] = None
    last_comment: Optional[str] = None
    first_checkup_date: Optional[str] = None
    last_checkup_date: Optional[str] = None
    checkup_count: int = 0
    steps: list[TaskStepOut] = Field(default_factory=list)
    history: list[UpdateOut] = Field(default_factory=list)


class TaskUpdateCreate(BaseModel):
    status_entry: str
    comment: str = ""
    next_follow_up_date: Optional[date] = None


class DashboardStats(BaseModel):
    employees: int
    active_projects: int
    open_tasks: int
    done_tasks: int


class UpcomingTask(TaskOut):
    focus_label: str
    days_until: Optional[int] = None


class DashboardOut(BaseModel):
    stats: DashboardStats
    upcoming: list[UpcomingTask]


class CapacityBucket(BaseModel):
    name: str
    open_tasks: int


class CapacityOut(BaseModel):
    by_employee: list[CapacityBucket]
    by_project: list[CapacityBucket]
    tasks: list[TaskOut]
    gantt_tasks: list[TaskOut] = Field(default_factory=list)
    employees: list[EmployeeOut] = Field(default_factory=list)


class OverviewTask(TaskOut):
    history: list[UpdateOut] = Field(default_factory=list)
    steps: list[TaskStepOut] = Field(default_factory=list)


class OverviewProject(ProjectOut):
    tasks: list[OverviewTask] = Field(default_factory=list)


class OverviewStream(StreamOut):
    projects: list[OverviewProject] = Field(default_factory=list)


class MetaOut(BaseModel):
    task_statuses: list[str]
    project_statuses: list[str]
    task_categories: list[str]
