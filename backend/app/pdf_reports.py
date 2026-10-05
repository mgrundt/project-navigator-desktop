from __future__ import annotations

from datetime import date, datetime
from io import BytesIO
from typing import Optional

import pymupdf
from pypdf import PdfReader, PdfWriter

from . import database as db


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def focus_label(due_or_follow_up: Optional[str], today: Optional[date] = None) -> tuple[str, Optional[int]]:
    today = today or date.today()
    target = _parse_date(due_or_follow_up)
    if target is None:
        return "Kein Datum", None
    delta = (target - today).days
    if delta == 0:
        return "Heute fällig", 0
    if delta == 1:
        return "Morgen", 1
    if delta > 1:
        return f"In {delta} Tagen", delta
    if delta == -1:
        return "Gestern (überfällig)", -1
    return f"Vor {abs(delta)} Tagen (überfällig)", delta


def enrich_upcoming(tasks: list[dict]) -> list[dict]:
    today = date.today()
    enriched = []
    for task in tasks:
        if task.get("status") == "Abgeschlossen":
            continue
        target = task.get("next_follow_up_date") or task.get("due_date")
        label, days = focus_label(target, today)
        enriched.append({**task, "focus_label": label, "days_until": days if days is not None else 999})
    enriched.sort(key=lambda t: (t["days_until"] if t["days_until"] is not None else 999, t["title"]))
    for item in enriched:
        if item["days_until"] == 999:
            item["days_until"] = None
    return enriched


def _html_escape(value: Optional[str]) -> str:
    if not value:
        return ""
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _page_html(title: str, subtitle: str, rows_html: str) -> str:
    generated = datetime.now().strftime("%d.%m.%Y %H:%M")
    return f"""
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
      <h1 style="font-size: 22px; margin: 0 0 4px 0;">{_html_escape(title)}</h1>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 12px;">
        { _html_escape(subtitle) } · Stand {generated}
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff;">
            <th style="text-align: left; padding: 8px;">Aufgabe</th>
            <th style="text-align: left; padding: 8px;">Projekt</th>
            <th style="text-align: left; padding: 8px;">Wer</th>
            <th style="text-align: left; padding: 8px;">Fokus</th>
            <th style="text-align: left; padding: 8px;">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows_html}
        </tbody>
      </table>
    </div>
    """


def _task_rows(tasks: list[dict]) -> str:
    if not tasks:
        return """
        <tr>
          <td colspan="5" style="padding: 12px; color: #64748b;">Keine Einträge vorhanden.</td>
        </tr>
        """
    parts = []
    for index, task in enumerate(tasks):
        bg = "#f8fafc" if index % 2 == 0 else "#ffffff"
        target = task.get("next_follow_up_date") or task.get("due_date")
        label, _ = focus_label(target)
        parts.append(
            f"""
            <tr style="background: {bg};">
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{_html_escape(task.get("title"))}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{_html_escape(task.get("project_name"))}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{_html_escape(task.get("employee_name"))}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{_html_escape(label)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{_html_escape(task.get("status"))}</td>
            </tr>
            """
        )
    return "".join(parts)


def _render_pdf(title: str, subtitle: str, tasks: list[dict]) -> bytes:
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    margin = 36
    rect = pymupdf.Rect(margin, margin, page.rect.width - margin, page.rect.height - margin)
    html = _page_html(title, subtitle, _task_rows(tasks))
    page.insert_htmlbox(rect, html)

    raw = doc.tobytes()
    doc.close()

    # pypdf: Metadaten setzen und als gültiges PDF finalisieren
    writer = PdfWriter()
    reader = PdfReader(BytesIO(raw))
    for pdf_page in reader.pages:
        writer.add_page(pdf_page)
    writer.add_metadata(
        {
            "/Title": title,
            "/Author": "Projekt-Navigator",
            "/Creator": "Projekt-Navigator (pymupdf + pypdf)",
        }
    )
    out = BytesIO()
    writer.write(out)
    return out.getvalue()


def upcoming_pdf() -> bytes:
    tasks = enrich_upcoming(db.list_tasks())
    return _render_pdf(
        "Nächste anstehende Aufgaben",
        "Offene Aufgaben nach Wiedervorlage / Fälligkeit",
        tasks,
    )


def today_pdf() -> bytes:
    tasks = db.list_today_tasks()
    return _render_pdf(
        "Team-Fokus heute",
        "Aufgaben, die heute Aufmerksamkeit brauchen",
        tasks,
    )
