"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Employee, Meta, Project, Task, TaskUpdateEntry } from "@/lib/types";
import { formatDate, formatDateTime, plusDays } from "@/lib/utils-app";
import { SelectField } from "@/components/select-field";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TaskForm = {
  title: string;
  description: string;
  project_id: string;
  employee_id: string;
  category: string;
  status: string;
  start_date: string;
  due_date: string;
  next_follow_up_date: string;
};

const CHECKUP_STATUSES = ["In Bearbeitung", "Wartet", "Abgeschlossen"];

function dateInput(value: string | null | undefined) {
  return (value ?? "").slice(0, 10);
}

function checkupStatusFor(task: Task) {
  return CHECKUP_STATUSES.includes(task.status) ? task.status : "In Bearbeitung";
}

function formFromTask(task: Task): TaskForm {
  return {
    title: task.title,
    description: task.description ?? "",
    project_id: task.project_id,
    employee_id: task.employee_id ?? "",
    category: task.category,
    status: task.status,
    start_date: dateInput(task.start_date),
    due_date: dateInput(task.due_date),
    next_follow_up_date: dateInput(task.next_follow_up_date),
  };
}

export function TaskEditDialog({
  task,
  open,
  onOpenChange,
  projects,
  employees,
  meta,
  onSaved,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  employees: Employee[];
  meta: Meta;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<TaskForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [history, setHistory] = useState<TaskUpdateEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [checkupStatus, setCheckupStatus] = useState(CHECKUP_STATUSES[0]);
  const [comment, setComment] = useState("");
  const [followUp, setFollowUp] = useState(plusDays(3));

  useEffect(() => {
    if (!task) {
      setForm(null);
      setHistory([]);
      return;
    }
    setForm(formFromTask(task));
    setCheckupStatus(checkupStatusFor(task));
    setComment("");
    setFollowUp(dateInput(task.next_follow_up_date) || plusDays(3));

    let cancelled = false;
    setHistoryLoading(true);
    api
      .taskHistory(task.id)
      .then((items) => {
        if (!cancelled) setHistory(items);
      })
      .catch(() => {
        if (!cancelled) toast.error("Historie konnte nicht geladen werden");
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [task]);

  function update<K extends keyof TaskForm>(key: K, value: TaskForm[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function save() {
    if (!task || !form) return;
    const title = form.title.trim();
    if (!title) {
      toast.error("Titel ist erforderlich");
      return;
    }
    if (!form.project_id || !form.employee_id) {
      toast.error("Projekt und Mitarbeiter sind erforderlich");
      return;
    }
    setSaving(true);
    try {
      await api.patchTask(task.id, {
        title,
        description: form.description,
        project_id: form.project_id,
        employee_id: form.employee_id,
        category: form.category,
        status: form.status,
        start_date: form.start_date || null,
        due_date: form.due_date || null,
        next_follow_up_date: form.next_follow_up_date || null,
      });
      toast.success("Aufgabe gespeichert");
      onOpenChange(false);
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  async function saveCheckup() {
    if (!task || !form) return;
    if (checkupStatus !== "Abgeschlossen" && !followUp) {
      toast.error("Wiedervorlage ist erforderlich");
      return;
    }
    setSaving(true);
    try {
      const nextFollowUp = checkupStatus === "Abgeschlossen" ? null : followUp;
      await api.addTaskUpdate(task.id, {
        status_entry: checkupStatus,
        comment,
        next_follow_up_date: nextFollowUp,
      });
      const items = await api.taskHistory(task.id);
      setHistory(items);
      setComment("");
      setForm((current) =>
        current
          ? { ...current, status: checkupStatus, next_follow_up_date: nextFollowUp ?? "" }
          : current,
      );
      toast.success("Checkup gespeichert");
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkup konnte nicht gespeichert werden");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!task) return;
    setSaving(true);
    try {
      await api.deleteTask(task.id);
      toast.success("Aufgabe gelöscht");
      setConfirmDelete(false);
      onOpenChange(false);
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Aufgabe bearbeiten</DialogTitle>
            <DialogDescription>
              Aufgabe ändern, einen Checkup erfassen und die bisherige Historie einsehen.
            </DialogDescription>
          </DialogHeader>
          {form ? (
            <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label htmlFor="task-title">Titel</Label>
                <Input
                  id="task-title"
                  value={form.title}
                  onChange={(event) => update("title", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-description">Beschreibung</Label>
                <Textarea
                  id="task-description"
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Projekt</Label>
                  <SelectField
                    value={form.project_id}
                    onChange={(value) => update("project_id", value)}
                    placeholder="Projekt wählen"
                    options={projects.map((project) => ({ value: project.id, label: project.name }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Mitarbeiter</Label>
                  <SelectField
                    value={form.employee_id}
                    onChange={(value) => update("employee_id", value)}
                    placeholder="Mitarbeiter wählen"
                    options={employees.map((employee) => ({ value: employee.id, label: employee.name }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Kategorie</Label>
                  <SelectField
                    value={form.category}
                    onChange={(value) => update("category", value)}
                    options={meta.task_categories.map((item) => ({ value: item, label: item }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <SelectField
                    value={form.status}
                    onChange={(value) => update("status", value)}
                    options={meta.task_statuses.map((item) => ({ value: item, label: item }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="task-start">Startdatum</Label>
                  <Input
                    id="task-start"
                    type="date"
                    value={form.start_date}
                    onChange={(event) => update("start_date", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="task-due">Deadline</Label>
                  <Input
                    id="task-due"
                    type="date"
                    value={form.due_date}
                    onChange={(event) => update("due_date", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="task-follow-up">Wiedervorlage</Label>
                  <Input
                    id="task-follow-up"
                    type="date"
                    value={form.next_follow_up_date}
                    onChange={(event) => update("next_follow_up_date", event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <p className="text-sm font-medium">Neuer Checkup</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <SelectField
                      value={checkupStatus}
                      onChange={setCheckupStatus}
                      options={CHECKUP_STATUSES.map((item) => ({ value: item, label: item }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="checkup-follow-up">Wiedervorlage</Label>
                    <Input
                      id="checkup-follow-up"
                      type="date"
                      value={followUp}
                      onChange={(event) => setFollowUp(event.target.value)}
                      disabled={checkupStatus === "Abgeschlossen"}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="checkup-comment">Kommentar</Label>
                  <Textarea
                    id="checkup-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Was gibt es Neues?"
                  />
                </div>
                <Button type="button" disabled={saving} onClick={() => void saveCheckup()}>
                  Checkup speichern
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-medium">Checkup-Historie</p>
                  <p className="text-xs text-muted-foreground">
                    {history.length} {history.length === 1 ? "Eintrag" : "Einträge"}
                  </p>
                </div>
                {historyLoading ? (
                  <p className="text-xs text-muted-foreground">Historie wird geladen…</p>
                ) : history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Noch keine Checkup-Einträge.</p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                    {history.map((entry, index) => (
                      <div
                        key={entry.id ?? `${task?.id}-update-${index}`}
                        className="rounded-md border bg-background p-2.5 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-medium">{formatDateTime(entry.date)}</span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={entry.status_entry} />
                            {entry.next_follow_up_date ? (
                              <span className="text-muted-foreground">
                                WV: {formatDate(entry.next_follow_up_date)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap">
                          {entry.comment || <span className="italic text-muted-foreground">Kein Kommentar</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter className="sm:justify-between">
            <Button variant="destructive" disabled={!task || saving} onClick={() => setConfirmDelete(true)}>
              Aufgabe löschen
            </Button>
            <Button disabled={!form || saving} onClick={() => void save()}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle>Aufgabe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {task ? `„${task.title}“ wird unwiderruflich gelöscht.` : "Die Aufgabe wird unwiderruflich gelöscht."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={saving} onClick={() => void remove()}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
