"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckSquare, ChevronDown, ChevronUp, Download, FolderOpen, History, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { api, pdfUrls } from "@/lib/api";
import { formatDate, formatDateTime, plusDays } from "@/lib/utils-app";
import type { Task, TaskUpdateEntry } from "@/lib/types";
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
  const [showHistory, setShowHistory] = useState(false);
  const [fetchedHistory, setFetchedHistory] = useState<TaskUpdateEntry[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const steps = task.steps ?? [];
  const done = steps.filter((step) => step.is_completed).length;

  const historyList = task.history ?? fetchedHistory ?? [];
  const historyCount = task.checkup_count ?? task.history?.length ?? 0;

  async function toggleHistory() {
    const next = !showHistory;
    setShowHistory(next);
    if (next && !task.history && fetchedHistory === null) {
      setLoadingHistory(true);
      try {
        const items = await api.taskHistory(task.id);
        setFetchedHistory(items);
      } catch {
        toast.error("Historie konnte nicht geladen werden");
      } finally {
        setLoadingHistory(false);
      }
    }
  }

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
      setFetchedHistory(null);
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MessageSquare className="mt-0.5 size-4 shrink-0" />
            {task.last_comment ? `Letzter Checkup: ${task.last_comment}` : "Noch kein Checkup-Eintrag vorhanden."}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleHistory}
            className="h-8 gap-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
          >
            <History className="size-3.5" />
            <span>Checkup-Historie {historyCount > 0 ? `(${historyCount})` : ""}</span>
            {showHistory ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </div>

        {task.next_follow_up_date ? (
          <p className="text-xs text-muted-foreground">
            Letzte Wiedervorlage geplant für: {formatDate(task.next_follow_up_date)}
          </p>
        ) : null}

        {showHistory ? (
          <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Bisherige Checkup-Einträge</span>
              <span>
                {historyList.length} {historyList.length === 1 ? "Eintrag" : "Einträge"}
              </span>
            </div>
            {loadingHistory ? (
              <p className="py-2 text-xs text-muted-foreground">Lade Historie...</p>
            ) : historyList.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">Noch keine Checkup-Einträge hinterlegt.</p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {historyList.map((entry, index) => (
                  <div
                    key={entry.id ?? `${task.id}-update-${index}`}
                    className="rounded-md border bg-background p-2.5 text-xs shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="font-medium text-foreground">
                        {formatDateTime(entry.date)}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={entry.status_entry} />
                        {entry.next_follow_up_date ? (
                          <span className="text-[11px] text-muted-foreground">
                            WV: {formatDate(entry.next_follow_up_date)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-foreground/90">
                      {entry.comment || <span className="italic text-muted-foreground">Kein Kommentar</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
