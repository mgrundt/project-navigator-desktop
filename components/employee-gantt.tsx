"use client";

import { useMemo, useState } from "react";
import type { Employee, Task } from "@/lib/types";
import { EmptyState } from "@/components/states";
import { SelectField } from "@/components/select-field";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PROJECT_COLORS = [
  "oklch(0.48 0.14 255)",
  "oklch(0.55 0.12 230)",
  "oklch(0.42 0.1 270)",
  "oklch(0.5 0.11 210)",
  "oklch(0.38 0.09 255)",
  "oklch(0.58 0.1 195)",
];

type GanttBar = {
  id: string;
  title: string;
  status: string;
  start: Date;
  end: Date;
  lane: number;
  checkupCount: number;
  firstCheckupDate?: string | null;
  lastCheckupDate?: string | null;
};

type GanttRow = {
  projectId: string;
  projectName: string;
  color: string;
  projectStart: Date;
  projectEnd: Date;
  bars: GanttBar[];
  laneCount: number;
};

function parseIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const stamp = value.slice(0, 10);
  const [year, month, day] = stamp.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function taskWindow(task: Task): { start: Date; end: Date } | null {
  const firstCheckup = parseIsoDate(task.first_checkup_date);
  const lastCheckup = parseIsoDate(task.last_checkup_date);

  let start =
    firstCheckup ??
    parseIsoDate(task.start_date) ??
    parseIsoDate(task.created_at) ??
    parseIsoDate(task.project_start_date);
  if (!start) return null;

  let end = lastCheckup ?? parseIsoDate(task.last_check_date) ?? parseIsoDate(task.due_date);
  if (!end) {
    end = addDays(start, 1);
  }
  if (end.getTime() <= start.getTime()) {
    end = addDays(start, 1);
  }
  return { start, end };
}

function assignLanes(items: Omit<GanttBar, "lane">[]): GanttBar[] {
  const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
  const laneEnds: number[] = [];
  return sorted.map((item) => {
    const start = item.start.getTime();
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.end.getTime());
    } else {
      laneEnds[lane] = item.end.getTime();
    }
    return { ...item, lane };
  });
}

function percent(value: number, rangeStart: number, span: number): number {
  return ((value - rangeStart) / span) * 100;
}

function monthTicks(rangeStart: Date, rangeEnd: Date): { date: Date; label: string }[] {
  const ticks: { date: Date; label: string }[] = [];
  let cursor = startOfMonth(rangeStart);
  if (cursor.getTime() < rangeStart.getTime()) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  while (cursor.getTime() <= rangeEnd.getTime()) {
    ticks.push({
      date: new Date(cursor),
      label: cursor.toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return ticks;
}

function statusBarClass(status: string): string {
  if (status === "Abgeschlossen") return "opacity-40";
  if (status === "Wartet") return "opacity-80 [background-image:repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(255,255,255,0.25)_6px,rgba(255,255,255,0.25)_8px)]";
  if (status === "Nicht gestartet") return "opacity-70";
  return "";
}

export function EmployeeGantt({
  employees,
  tasks,
}: {
  employees: Employee[];
  tasks: Task[];
}) {
  const people = useMemo(() => {
    const fromTasks = new Map<string, string>();
    for (const task of tasks) {
      if (task.employee_id) {
        fromTasks.set(task.employee_id, task.employee_name ?? "Unbekannt");
      }
    }
    const merged = employees.length
      ? employees
      : [...fromTasks.entries()].map(([id, name]) => ({
          id,
          name,
          role: "",
          created_at: "",
        }));
    return merged.filter((person) => tasks.some((task) => task.employee_id === person.id));
  }, [employees, tasks]);

  const [employeeId, setEmployeeId] = useState(people[0]?.id ?? "");
  const [includeDone, setIncludeDone] = useState(false);

  const selectedId = people.some((person) => person.id === employeeId)
    ? employeeId
    : (people[0]?.id ?? "");

  const { rows, rangeStart, rangeEnd, span, todayLeft, parallelTasksToday, parallelProjectsToday, ticks } = useMemo(() => {
    const selected = tasks.filter((task) => {
      if (task.employee_id !== selectedId) return false;
      if (!includeDone && task.status === "Abgeschlossen") return false;
      return true;
    });

    const grouped = new Map<string, Task[]>();
    for (const task of selected) {
      grouped.set(task.project_id, [...(grouped.get(task.project_id) ?? []), task]);
    }

    const built: GanttRow[] = [];
    const allDates: Date[] = [];

    [...grouped.entries()].forEach(([projectId, projectTasks], index) => {
      const prepared: Omit<GanttBar, "lane">[] = [];
      for (const task of projectTasks) {
        const window = taskWindow(task);
        if (window) {
          prepared.push({
            id: task.id,
            title: task.title,
            status: task.status,
            start: window.start,
            end: window.end,
            checkupCount: task.checkup_count ?? 0,
            firstCheckupDate: task.first_checkup_date,
            lastCheckupDate: task.last_checkup_date,
          });
        }
      }

      if (prepared.length === 0) return;

      const bars = assignLanes(prepared);
      const projectStart = new Date(Math.min(...bars.map((bar) => bar.start.getTime())));
      const projectEnd = new Date(Math.max(...bars.map((bar) => bar.end.getTime())));
      allDates.push(projectStart, projectEnd);
      built.push({
        projectId,
        projectName: projectTasks[0]?.project_name ?? "Projekt",
        color: PROJECT_COLORS[index % PROJECT_COLORS.length],
        projectStart,
        projectEnd,
        bars,
        laneCount: Math.max(...bars.map((bar) => bar.lane)) + 1,
      });
    });

    built.sort((a, b) => a.projectStart.getTime() - b.projectStart.getTime());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    allDates.push(today);

    const minDate = allDates.length
      ? addDays(new Date(Math.min(...allDates.map((date) => date.getTime()))), -7)
      : addDays(today, -30);
    const maxDate = allDates.length
      ? addDays(new Date(Math.max(...allDates.map((date) => date.getTime()))), 14)
      : addDays(today, 60);
    const rangeMs = Math.max(maxDate.getTime() - minDate.getTime(), 24 * 60 * 60 * 1000);

    const parallelTasksToday = built
      .flatMap((row) => row.bars)
      .filter((bar) => bar.start.getTime() <= today.getTime() && bar.end.getTime() >= today.getTime())
      .length;

    const parallelProjectsToday = built.filter(
      (row) => row.projectStart.getTime() <= today.getTime() && row.projectEnd.getTime() >= today.getTime(),
    ).length;

    return {
      rows: built,
      rangeStart: minDate,
      rangeEnd: maxDate,
      span: rangeMs,
      todayLeft: percent(today.getTime(), minDate.getTime(), rangeMs),
      parallelTasksToday,
      parallelProjectsToday,
      ticks: monthTicks(minDate, maxDate),
    };
  }, [tasks, selectedId, includeDone]);

  if (people.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Parallele Projektauslastung</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title="Keine Aufgaben mit Zeitdaten" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>Parallele Projektauslastung</CardTitle>
          <CardDescription>
            Gantt-Zeitstrahl je Mitarbeiter: Balken vom ersten bis zum letzten Checkup (parallele Aufgabenbearbeitung).
          </CardDescription>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Label className="gap-2 font-normal">
            <Checkbox checked={includeDone} onCheckedChange={(value) => setIncludeDone(Boolean(value))} />
            Abgeschlossene zeigen
          </Label>
          <div className="w-56">
            <SelectField
              value={selectedId}
              onChange={setEmployeeId}
              placeholder="Mitarbeiter wählen"
              options={people.map((person) => ({ value: person.id, label: person.name }))}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
            {parallelTasksToday} {parallelTasksToday === 1 ? "parallele Aufgabe" : "parallele Aufgaben"} heute ({parallelProjectsToday} {parallelProjectsToday === 1 ? "Projekt" : "Projekte"})
          </span>
          <span className="text-muted-foreground">
            {rangeStart.toLocaleDateString("de-DE")} – {rangeEnd.toLocaleDateString("de-DE")}
          </span>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="Keine Zeitspannen für diese Auswahl" />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-background">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[13rem_1fr] border-b bg-muted/50 text-xs font-medium text-muted-foreground">
                <div className="px-3 py-2">Projekt</div>
                <div className="relative h-8">
                  {ticks.map((tick) => (
                    <div
                      key={tick.date.toISOString()}
                      className="absolute top-0 bottom-0 border-l border-border/80"
                      style={{ left: `${percent(tick.date.getTime(), rangeStart.getTime(), span)}%` }}
                    >
                      <span className="absolute top-1.5 left-1.5 whitespace-nowrap">{tick.label}</span>
                    </div>
                  ))}
                  <span
                    className="absolute top-1 z-10 -translate-x-1/2 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ left: `${todayLeft}%` }}
                  >
                    Heute
                  </span>
                </div>
              </div>

              {rows.map((row) => {
                const rowHeight = 28 + row.laneCount * 28;
                return (
                  <div
                    key={row.projectId}
                    className="grid grid-cols-[13rem_1fr] border-b last:border-b-0"
                    style={{ minHeight: rowHeight }}
                  >
                    <div className="flex flex-col justify-center gap-1 border-r px-3 py-2">
                      <p className="truncate text-sm font-medium" title={row.projectName}>
                        {row.projectName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.projectStart.toLocaleDateString("de-DE")} – {row.projectEnd.toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <div className="relative" style={{ minHeight: rowHeight }}>
                      {ticks.map((tick) => (
                        <div
                          key={`grid-${row.projectId}-${tick.date.toISOString()}`}
                          className="absolute inset-y-0 border-l border-border/60"
                          style={{ left: `${percent(tick.date.getTime(), rangeStart.getTime(), span)}%` }}
                        />
                      ))}
                      <div
                        className="absolute top-2 h-3 rounded-full opacity-25"
                        style={{
                          left: `${percent(row.projectStart.getTime(), rangeStart.getTime(), span)}%`,
                          width: `${Math.max(
                            percent(row.projectEnd.getTime(), rangeStart.getTime(), span) -
                              percent(row.projectStart.getTime(), rangeStart.getTime(), span),
                            0.8,
                          )}%`,
                          background: row.color,
                        }}
                      />
                      {row.bars.map((bar) => {
                        const left = percent(bar.start.getTime(), rangeStart.getTime(), span);
                        const right = percent(bar.end.getTime(), rangeStart.getTime(), span);
                        return (
                          <div
                            key={bar.id}
                            className="group absolute"
                            style={{
                              top: 18 + bar.lane * 28,
                              left: `${left}%`,
                              width: `${Math.max(right - left, 1.2)}%`,
                              height: 22,
                            }}
                          >
                            <div
                              className={cn(
                                "flex h-full items-center overflow-hidden rounded-md px-2 text-[11px] font-medium text-white shadow-sm",
                                statusBarClass(bar.status),
                              )}
                              style={{ background: row.color }}
                            >
                              <span className="truncate">{bar.title}</span>
                            </div>
                            <div className="pointer-events-none absolute top-full left-0 z-20 mt-1 hidden w-max max-w-xs rounded-md bg-foreground px-2 py-1.5 text-xs text-background shadow-md group-hover:block">
                              <p className="font-medium">{bar.title}</p>
                              <p>
                                {bar.checkupCount > 0
                                  ? `Checkups: ${bar.start.toLocaleDateString("de-DE")} – ${bar.end.toLocaleDateString("de-DE")}`
                                  : `Zeitraum: ${bar.start.toLocaleDateString("de-DE")} – ${bar.end.toLocaleDateString("de-DE")}`}
                              </p>
                              <p>
                                {bar.status}
                                {bar.checkupCount > 0
                                  ? ` · ${bar.checkupCount} Checkup${bar.checkupCount > 1 ? "s" : ""}`
                                  : " · Kein Checkup erfasst"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div
                        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-amber-500"
                        style={{ left: `${todayLeft}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Balkenfarbe = Projekt · Länge = Erster bis letzter Checkup</span>
          <StatusBadge status="In Bearbeitung" />
          <span>volle Deckkraft</span>
          <StatusBadge status="Wartet" />
          <span>schraffiert</span>
          <StatusBadge status="Abgeschlossen" />
          <span>abgeblendet</span>
        </div>
      </CardContent>
    </Card>
  );
}
