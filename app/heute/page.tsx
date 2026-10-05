"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckSquare, Download, FolderOpen, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { api, pdfUrls } from "@/lib/api";
import { formatDate, plusDays } from "@/lib/utils-app";
import type { Task } from "@/lib/types";
import { useApi } from "@/components/use-api";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress, ProgressLabel } from "@/components/ui/progress";

function TaskCard({ task, onUpdated }: { task: Task; onUpdated: () => void }) {
  const [status, setStatus] = useState(task.status);
  const [comment, setComment] = useState("");
  const [followUp, setFollowUp] = useState(plusDays(3));
  const [saving, setSaving] = useState(false);
  const steps = task.steps ?? [];
  const done = steps.filter((step) => step.is_completed).length;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.addTaskUpdate(task.id, {
        status_entry: status,
        comment,
        next_follow_up_date: status === "Abgeschlossen" ? null : followUp,
      });
      toast.success("Update gespeichert");
      setComment("");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{task.title}</CardTitle>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <FolderOpen className="size-3.5" />
              {task.project_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} />
            <span className="text-xs text-muted-foreground">Deadline: {formatDate(task.due_date)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.length > 0 ? (
          <div className="space-y-2">
            <Progress value={(done / steps.length) * 100}>
              <ProgressLabel>
                Projektplan · {done}/{steps.length} Schritte
              </ProgressLabel>
            </Progress>
            <ul className="space-y-1 text-sm">
              {steps.map((step) => (
                <li key={step.id} className="flex items-start gap-2">
                  <CheckSquare className={step.is_completed ? "size-4 text-emerald-600" : "size-4 text-muted-foreground"} />
                  <span className={step.is_completed ? "text-muted-foreground line-through" : ""}>
                    {step.step_number}. {step.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <MessageSquare className="mt-0.5 size-4 shrink-0" />
          {task.last_comment ? `Letzter Checkup: ${task.last_comment}` : "Noch kein Checkup-Eintrag vorhanden."}
        </p>
        {task.next_follow_up_date ? (
          <p className="text-xs text-muted-foreground">
            Letzte Wiedervorlage geplant für: {formatDate(task.next_follow_up_date)}
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border bg-muted/30 p-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Neuer Status</Label>
            <SelectField
              value={status}
              onChange={setStatus}
              options={["In Bearbeitung", "Wartet", "Abgeschlossen"].map((item) => ({
                value: item,
                label: item,
              }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`comment-${task.id}`}>Kommentar</Label>
            <Input
              id={`comment-${task.id}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Was gibt es Neues?"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`wv-${task.id}`}>Nächste Wiedervorlage</Label>
            <Input
              id={`wv-${task.id}`}
              type="date"
              value={followUp}
              min={plusDays(1)}
              onChange={(event) => setFollowUp(event.target.value)}
              disabled={status === "Abgeschlossen"}
            />
          </div>
          <div className="md:col-span-3">
            <Button type="submit" disabled={saving}>
              Update & Wiedervorlage speichern
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function HeutePage() {
  const loader = useMemo(() => api.todayTasks, []);
  const { data, loading, reload } = useApi(loader);

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of data ?? []) {
      const name = task.employee_name ?? "Unbekannt";
      map.set(name, [...(map.get(name) ?? []), task]);
    }
    return [...map.entries()];
  }, [data]);

  if (loading || !data) {
    return <LoadingState />;
  }

  return (
    <div>
      <PageHeader
        title="Team-Fokus heute"
        description="Nur Aufgaben, die heute Aufmerksamkeit brauchen. Aufgaben mit aktueller Wiedervorlage sind ausgeblendet."
        actions={
          <Button variant="outline" nativeButton={false} render={<a href={pdfUrls.today} />}>
            <Download />
            Heute als PDF
          </Button>
        }
      />
      {data.length === 0 ? (
        <EmptyState
          title="Hervorragend – alles gecheckt"
          text="Alle aktiven Aufgaben sind für heute auf Wiedervorlage gesetzt."
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(([name, tasks]) => (
            <section key={name} className="space-y-3">
              <h2 className="font-heading text-lg font-semibold">{name}</h2>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdated={reload} />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
