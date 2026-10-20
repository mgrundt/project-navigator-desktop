"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FolderKanban,
  ListTodo,
  Pencil,
  Target,
  Users,
} from "lucide-react";
import { api, pdfUrls } from "@/lib/api";
import type { DashboardData, Meta, UpcomingTask } from "@/lib/types";
import { LEITPLANKEN, formatDate } from "@/lib/utils-app";
import { useApi } from "@/components/use-api";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/states";
import { FocusBadge, PriorityBadge, StatusBadge } from "@/components/status-badge";
import { TaskEditDialog } from "@/components/task-edit-dialog";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DashboardPageData = {
  dashboard: DashboardData;
  meta: Meta;
};

type SortMode = "priority" | "focus" | "employee";

const PRIORITY_RANK: Record<string, number> = {
  Kritisch: 0,
  Hoch: 1,
  Normal: 2,
  Niedrig: 3,
};

function sortTasks(tasks: UpcomingTask[], mode: SortMode): UpcomingTask[] {
  const copy = [...tasks];
  copy.sort((a, b) => {
    const rankA = PRIORITY_RANK[a.priority || "Normal"] ?? 2;
    const rankB = PRIORITY_RANK[b.priority || "Normal"] ?? 2;
    const daysA = a.days_until ?? 999;
    const daysB = b.days_until ?? 999;
    const nameA = a.employee_name || "";
    const nameB = b.employee_name || "";
    const titleA = a.title || "";
    const titleB = b.title || "";

    if (mode === "priority") {
      return rankA - rankB || daysA - daysB || titleA.localeCompare(titleB, "de");
    }
    if (mode === "employee") {
      return nameA.localeCompare(nameB, "de") || rankA - rankB || daysA - daysB || titleA.localeCompare(titleB, "de");
    }
    return daysA - daysB || rankA - rankB || titleA.localeCompare(titleB, "de");
  });
  return copy;
}

export default function DashboardPage() {
  const loader = useMemo(
    () => async () => {
      const [dashboard, meta] = await Promise.all([api.dashboard(), api.meta()]);
      return { dashboard, meta } satisfies DashboardPageData;
    },
    [],
  );
  const { data, loading, setData } = useApi(loader);
  const [selected, setSelected] = useState<UpcomingTask | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("priority");
  const [employeeFilter, setEmployeeFilter] = useState("all");

  async function refreshDashboard() {
    const dashboard = await api.dashboard();
    setData((current) => (current ? { ...current, dashboard } : current));
  }

  const visibleTasks = useMemo(() => {
    if (!data) return [];
    const filtered =
      employeeFilter === "all"
        ? data.dashboard.upcoming
        : data.dashboard.upcoming.filter((task) => task.employee_id === employeeFilter);
    return sortTasks(filtered, sortMode);
  }, [data, employeeFilter, sortMode]);

  if (loading || !data) {
    return <LoadingState />;
  }

  const dashboard = data.dashboard;
  const kpis = [
    { label: "Mitarbeiter im Team", value: dashboard.stats.employees, icon: Users },
    { label: "Aktive Projekte", value: dashboard.stats.active_projects, icon: FolderKanban },
    { label: "Offene Aufgaben", value: dashboard.stats.open_tasks, icon: ListTodo },
    { label: "Erledigte Aufgaben", value: dashboard.stats.done_tasks, icon: CheckCircle2 },
  ];

  const sortDescription =
    sortMode === "priority"
      ? "Sortiert nach Priorität, dann Fokus/Wiedervorlage"
      : sortMode === "employee"
        ? "Gruppiert nach Mitarbeiter, darin nach Priorität"
        : "Sortiert nach Wiedervorlage bzw. Fälligkeit, dann Priorität";

  return (
    <div>
      <PageHeader
        title="Projekt- & Team-Dashboard"
        description="Willkommen in der lokalen Projektverwaltung. Hier ist die aktuelle Übersicht."
        actions={
          <Button nativeButton={false} render={<a href={pdfUrls.upcoming} />}>
            <Download />
            Aufgaben als PDF
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              Sources of Truth
            </CardTitle>
            <CardDescription>Was muss ich checken und pflegen?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {LEITPLANKEN.sources.map((item) => (
              <div key={item.title}>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              Lernleitplanken
            </CardTitle>
            <CardDescription>Fokus für Qualifikation und Weiterentwicklung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {LEITPLANKEN.learning.map((item) => (
              <div key={item.title}>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Leitplanken (Operativ)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {LEITPLANKEN.operational.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardDescription>{kpi.label}</CardDescription>
                <Icon className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl font-semibold text-primary">{kpi.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Nächste anstehende Aufgaben</CardTitle>
            <CardDescription>{sortDescription}</CardDescription>
          </div>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
            <div className="space-y-1.5 sm:min-w-48">
              <Label>Sortierung</Label>
              <SelectField
                value={sortMode}
                onChange={(value) => setSortMode(value as SortMode)}
                options={[
                  { value: "priority", label: "Priorität" },
                  { value: "employee", label: "Mitarbeiter + Priorität" },
                  { value: "focus", label: "Fokus / Wiedervorlage" },
                ]}
              />
            </div>
            <div className="space-y-1.5 sm:min-w-48">
              <Label>Mitarbeiter</Label>
              <SelectField
                value={employeeFilter}
                onChange={setEmployeeFilter}
                options={[
                  { value: "all", label: "Alle Mitarbeiter" },
                  ...dashboard.employees.map((employee) => ({
                    value: employee.id,
                    label: employee.name,
                  })),
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dashboard.upcoming.length === 0 ? (
            <EmptyState title="Alle Aufgaben erledigt" text="Aktuell keine offenen Wiedervorlagen." />
          ) : visibleTasks.length === 0 ? (
            <EmptyState title="Keine Aufgaben für diese Auswahl" text="Filter oder Sortierung anpassen." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prio</TableHead>
                  <TableHead>Aufgabe</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Wer</TableHead>
                  <TableHead>Fokus / Wiedervorlage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fällig</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Bearbeiten</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(task)}
                  >
                    <TableCell>
                      <PriorityBadge priority={task.priority || "Normal"} />
                    </TableCell>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{task.project_name}</TableCell>
                    <TableCell>{task.employee_name}</TableCell>
                    <TableCell>
                      <FocusBadge label={task.focus_label} days={task.days_until} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>{formatDate(task.due_date)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${task.title} bearbeiten`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelected(task);
                        }}
                      >
                        <Pencil />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TaskEditDialog
        task={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        projects={dashboard.projects}
        employees={dashboard.employees}
        meta={data.meta}
        onSaved={refreshDashboard}
      />
    </div>
  );
}
