"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils-app";
import { useApi } from "@/components/use-api";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { EmployeeGantt } from "@/components/employee-gantt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const employeeConfig = {
  open_tasks: { label: "Offene Aufgaben", color: "var(--chart-1)" },
} satisfies ChartConfig;

const projectConfig = {
  open_tasks: { label: "Offene Aufgaben", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function CapacityPage() {
  const loader = useMemo(() => api.capacity, []);
  const { data, loading } = useApi(loader);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const statuses = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.tasks.map((task) => task.status))].sort();
  }, [data]);

  const activeFilter = statusFilter.length === 0 ? statuses : statusFilter;
  const filtered = (data?.tasks ?? []).filter((task) => activeFilter.includes(task.status));

  if (loading || !data) {
    return <LoadingState />;
  }

  const hasAny = data.tasks.length > 0 || (data.gantt_tasks?.length ?? 0) > 0;

  if (!hasAny) {
    return (
      <div>
        <PageHeader
          title="Kapazitätsplanung & Auslastung"
          description="Visuelle Übersicht der Aufgabenverteilung im Team und über alle Projekte hinweg."
        />
        <EmptyState title="Keine offene Last" text="Alle erfassten Aufgaben sind abgeschlossen." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Kapazitätsplanung & Auslastung"
        description="Visuelle Übersicht der Aufgabenverteilung im Team und über alle Projekte hinweg."
      />

      <div className="mb-6">
        <EmployeeGantt
          employees={data.employees ?? []}
          tasks={data.gantt_tasks?.length ? data.gantt_tasks : data.tasks}
        />
      </div>

      {data.tasks.length > 0 ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workload pro Mitarbeiter</CardTitle>
                <CardDescription>Anzahl der offenen Aufgaben pro Teammitglied</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={employeeConfig} className="h-72 w-full">
                  <BarChart data={data.by_employee} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="open_tasks" fill="var(--color-open_tasks)" radius={6} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Projekt-Dichte</CardTitle>
                <CardDescription>Wo konzentrieren sich aktuell die meisten offenen Aufgaben?</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={projectConfig} className="h-72 w-full">
                  <BarChart data={data.by_project} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-18} height={70} textAnchor="end" />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="open_tasks" fill="var(--color-open_tasks)" radius={6} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Detaillierte Auslastungsmatrix</CardTitle>
              <CardDescription>Filtere nach Status, um Engpässe zu identifizieren.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {statuses.map((status) => {
                  const checked = activeFilter.includes(status);
                  return (
                    <Label key={status} className="gap-2 font-normal">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const selected = new Set(activeFilter);
                          if (value) selected.add(status);
                          else selected.delete(status);
                          setStatusFilter([...selected]);
                        }}
                      />
                      {status}
                    </Label>
                  );
                })}
              </div>
              {filtered.length === 0 ? (
                <EmptyState title="Keine Aufgaben für die Filterkombination" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mitarbeiter</TableHead>
                      <TableHead>Projekt</TableHead>
                      <TableHead>Aufgabe</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fälligkeit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered
                      .slice()
                      .sort((a, b) => (a.employee_name ?? "").localeCompare(b.employee_name ?? "", "de"))
                      .map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>{task.employee_name}</TableCell>
                          <TableCell>{task.project_name}</TableCell>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{task.category}</TableCell>
                          <TableCell>
                            <StatusBadge status={task.status} />
                          </TableCell>
                          <TableCell>{formatDate(task.due_date)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
