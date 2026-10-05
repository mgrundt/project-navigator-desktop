from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from . import database as db
from . import pdf_reports
from .schemas import (
    CapacityOut,
    DashboardOut,
    DashboardStats,
    EmployeeCreate,
    EmployeeOut,
    MetaOut,
    OverviewStream,
    ProjectCreate,
    ProjectOut,
    StreamCreate,
    StreamOut,
    TaskCreate,
    TaskOut,
    TaskStepIn,
    TaskStepOut,
    TaskUpdate,
    TaskUpdateCreate,
    UpcomingTask,
    UpdateOut,
)

router = APIRouter(prefix="/api")


def _date_str(value: Any) -> str | None:
    if value is None:
        return None
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


@router.get("/meta", response_model=MetaOut)
def meta() -> MetaOut:
    return MetaOut(
        task_statuses=list(db.TASK_STATUSES),
        project_statuses=list(db.PROJECT_STATUSES),
        task_categories=list(db.TASK_CATEGORIES),
    )


@router.get("/dashboard", response_model=DashboardOut)
def dashboard() -> DashboardOut:
    stats = DashboardStats(**db.get_dashboard_stats())
    upcoming = [UpcomingTask(**item) for item in pdf_reports.enrich_upcoming(db.list_tasks())]
    return DashboardOut(stats=stats, upcoming=upcoming)


@router.get("/capacity", response_model=CapacityOut)
def capacity() -> CapacityOut:
    return CapacityOut(**db.get_capacity())


@router.get("/overview", response_model=list[OverviewStream])
def overview() -> list[OverviewStream]:
    return [OverviewStream(**item) for item in db.get_overview()]


@router.get("/streams", response_model=list[StreamOut])
def list_streams() -> list[StreamOut]:
    return [StreamOut(**item) for item in db.list_streams()]


@router.post("/streams", response_model=StreamOut, status_code=201)
def create_stream(payload: StreamCreate) -> StreamOut:
    return StreamOut(**db.add_stream(payload.name, payload.description))


@router.delete("/streams/{stream_id}", status_code=204)
def remove_stream(stream_id: str) -> None:
    if not db.delete_stream(stream_id):
        raise HTTPException(status_code=404, detail="Stream nicht gefunden")


@router.get("/employees", response_model=list[EmployeeOut])
def list_employees() -> list[EmployeeOut]:
    return [EmployeeOut(**item) for item in db.list_employees()]


@router.post("/employees", response_model=EmployeeOut, status_code=201)
def create_employee(payload: EmployeeCreate) -> EmployeeOut:
    return EmployeeOut(**db.add_employee(payload.name, payload.role))


@router.delete("/employees/{employee_id}", status_code=204)
def remove_employee(employee_id: str) -> None:
    if not db.delete_employee(employee_id):
        raise HTTPException(status_code=404, detail="Mitarbeiter nicht gefunden")


@router.get("/projects", response_model=list[ProjectOut])
def list_projects() -> list[ProjectOut]:
    return [ProjectOut(**item) for item in db.list_projects()]


@router.post("/projects", response_model=ProjectOut, status_code=201)
def create_project(payload: ProjectCreate) -> ProjectOut:
    if db.get_stream(payload.stream_id) is None:
        raise HTTPException(status_code=400, detail="Stream nicht gefunden")
    return ProjectOut(
        **db.add_project(
            stream_id=payload.stream_id,
            name=payload.name,
            start_date=_date_str(payload.start_date) or db.today_str(),
            end_date=_date_str(payload.end_date),
            status=payload.status,
        )
    )


@router.delete("/projects/{project_id}", status_code=204)
def remove_project(project_id: str) -> None:
    if not db.delete_project(project_id):
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")


@router.get("/tasks", response_model=list[TaskOut])
def list_tasks() -> list[TaskOut]:
    return [TaskOut(**item) for item in db.list_tasks()]


@router.get("/tasks/today", response_model=list[TaskOut])
def today_tasks() -> list[TaskOut]:
    items = []
    for item in db.list_today_tasks():
        item["steps"] = db.get_steps_for_task(item["id"])
        items.append(TaskOut(**item))
    return items


@router.post("/tasks", response_model=TaskOut, status_code=201)
def create_task(payload: TaskCreate) -> TaskOut:
    if db.get_project(payload.project_id) is None:
        raise HTTPException(status_code=400, detail="Projekt nicht gefunden")
    if db.get_employee(payload.employee_id) is None:
        raise HTTPException(status_code=400, detail="Mitarbeiter nicht gefunden")
    return TaskOut(
        **db.add_task(
            project_id=payload.project_id,
            employee_id=payload.employee_id,
            title=payload.title,
            description=payload.description,
            category=payload.category,
            status=payload.status,
            start_date=_date_str(payload.start_date),
            due_date=_date_str(payload.due_date),
        )
    )


@router.patch("/tasks/{task_id}", response_model=TaskOut)
def patch_task(task_id: str, payload: TaskUpdate) -> TaskOut:
    fields: dict[str, Any] = payload.model_dump(exclude_unset=True)
    for key in ("start_date", "due_date", "next_follow_up_date"):
        if key in fields:
            fields[key] = _date_str(fields[key])
    updated = db.update_task(task_id, fields)
    if updated is None:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    return TaskOut(**updated)


@router.delete("/tasks/{task_id}", status_code=204)
def remove_task(task_id: str) -> None:
    if not db.delete_task(task_id):
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")


@router.post("/tasks/{task_id}/updates", response_model=UpdateOut, status_code=201)
def create_task_update(task_id: str, payload: TaskUpdateCreate) -> UpdateOut:
    try:
        return UpdateOut(
            **db.add_task_update(
                task_id=task_id,
                status_entry=payload.status_entry,
                comment=payload.comment,
                next_follow_up=_date_str(payload.next_follow_up_date),
            )
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden") from None


@router.get("/tasks/{task_id}/history", response_model=list[UpdateOut])
def task_history(task_id: str) -> list[UpdateOut]:
    if db.get_task(task_id) is None:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    return [UpdateOut(**item) for item in db.get_task_history(task_id)]


@router.get("/tasks/{task_id}/steps", response_model=list[TaskStepOut])
def task_steps(task_id: str) -> list[TaskStepOut]:
    if db.get_task(task_id) is None:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    return [TaskStepOut(**item) for item in db.get_steps_for_task(task_id)]


@router.put("/tasks/{task_id}/steps", response_model=list[TaskStepOut])
def replace_task_steps(task_id: str, payload: list[TaskStepIn]) -> list[TaskStepOut]:
    if db.get_task(task_id) is None:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    steps = db.save_task_steps(task_id, [item.model_dump() for item in payload])
    return [TaskStepOut(**item) for item in steps]


@router.get("/reports/upcoming.pdf")
def report_upcoming() -> Response:
    return Response(
        content=pdf_reports.upcoming_pdf(),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="aufgaben-wiedervorlage.pdf"'},
    )


@router.get("/reports/heute.pdf")
def report_today() -> Response:
    return Response(
        content=pdf_reports.today_pdf(),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="team-fokus-heute.pdf"'},
    )


@router.post("/documents/extract")
async def extract_pdf(file: Any = None) -> dict[str, Any]:
    from fastapi import File, HTTPException, UploadFile
    import pymupdf
    import uuid
    if not isinstance(file, UploadFile):
        raise HTTPException(400, "PDF file missing.")
    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(415, "Only PDF files are supported.")
    try:
        pdf = pymupdf.open(stream=await file.read(), filetype="pdf")
        text = "".join(page.get_text() for page in pdf)
    except Exception as exc:
        raise HTTPException(400, "The uploaded file is not a readable PDF.") from exc
    result = {
        "id": str(uuid.uuid4()),
        "filename": file.filename or "document.pdf",
        "page_count": len(pdf),
        "text": text,
    }
    with db.get_connection() as conn:
        conn.execute(
            "INSERT INTO documents VALUES (:id, :filename, :page_count, :text)", result
        )
    return {key: result[key] for key in ("id", "filename", "page_count")} | {
        "characters_extracted": len(text)
    }

