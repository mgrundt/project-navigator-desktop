"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { todayIso } from "@/lib/utils-app";
import type { Employee, Meta, Project, Stream, Task, TaskStep } from "@/lib/types";
import { useApi } from "@/components/use-api";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/states";
import { SelectField } from "@/components/select-field";
import { StatusBadge } from "@/components/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SetupData = {
  meta: Meta;
  streams: Stream[];
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
};

function DeleteButton({
  label,
  description,
  onConfirm,
}: {
  label: string;
  description: string;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>{label}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unwiderruflich löschen?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={async () => {
              await onConfirm();
              setOpen(false);
            }}
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function SetupPage() {
  const loader = useMemo(
    () => async () => {
      const [meta, streams, employees, projects, tasks] = await Promise.all([
        api.meta(),
        api.streams(),
        api.employees(),
        api.projects(),
        api.tasks(),
      ]);
      return { meta, streams, employees, projects, tasks } satisfies SetupData;
    },
    [],
  );
  const { data, loading, reload } = useApi(loader);

  if (loading || !data) {
    return <LoadingState />;
  }

  return (
    <div>
      <PageHeader
        title="Systemeinstellungen & Verwaltung"
        description="Verwalte strategische Streams, Team, Projekte, Aufgaben und Mini-Projektpläne."
      />
      <Tabs defaultValue="streams">
        <TabsList>
          <TabsTrigger value="streams">Streams</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="projects">Projekte</TabsTrigger>
          <TabsTrigger value="tasks">Aufgaben</TabsTrigger>
          <TabsTrigger value="steps">Projektpläne</TabsTrigger>
        </TabsList>
        <TabsContent value="streams" className="pt-4">
          <StreamsPanel streams={data.streams} onChanged={reload} />
        </TabsContent>
        <TabsContent value="team" className="pt-4">
          <EmployeesPanel employees={data.employees} onChanged={reload} />
        </TabsContent>
        <TabsContent value="projects" className="pt-4">
          <ProjectsPanel
            streams={data.streams}
            projects={data.projects}
            statuses={data.meta.project_statuses}
            onChanged={reload}
          />
        </TabsContent>
        <TabsContent value="tasks" className="pt-4">
          <TasksPanel
            employees={data.employees}
            projects={data.projects}
            tasks={data.tasks}
            meta={data.meta}
            onChanged={reload}
          />
        </TabsContent>
        <TabsContent value="steps" className="pt-4">
          <StepsPanel tasks={data.tasks} onChanged={reload} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StreamsPanel({ streams, onChanged }: { streams: Stream[]; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await api.createStream({ name, description });
    toast.success(`Stream „${name}“ angelegt`);
    setName("");
    setDescription("");
    onChanged();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Stream anlegen</CardTitle>
          <CardDescription>Strategische Themenfelder, z. B. KI oder M365</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="stream-name">Name</Label>
              <Input id="stream-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stream-desc">Kurzbeschreibung</Label>
              <Input id="stream-desc" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            <Button type="submit">Stream speichern</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bestehende Streams</CardTitle>
        </CardHeader>
        <CardContent>
          {streams.length === 0 ? (
            <EmptyState title="Noch keine Streams definiert" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Fokus</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {streams.map((stream) => (
                  <TableRow key={stream.id}>
                    <TableCell className="font-medium">{stream.name}</TableCell>
                    <TableCell className="whitespace-normal">{stream.description}</TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        label="Löschen"
                        description={`Stream „${stream.name}“ und alle verknüpften Projekte/Aufgaben werden gelöscht.`}
                        onConfirm={async () => {
                          await api.deleteStream(stream.id);
                          toast.success("Stream gelöscht");
                          onChanged();
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeesPanel({ employees, onChanged }: { employees: Employee[]; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await api.createEmployee({ name, role });
    toast.success(`Mitarbeiter „${name}“ angelegt`);
    setName("");
    setRole("");
    onChanged();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Mitarbeiter hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="emp-name">Name</Label>
              <Input id="emp-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-role">Rolle / Position</Label>
              <Input id="emp-role" value={role} onChange={(event) => setRole(event.target.value)} />
            </div>
            <Button type="submit">Mitarbeiter speichern</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <EmptyState title="Noch keine Mitarbeiter" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        label="Löschen"
                        description={`Mitarbeiter „${employee.name}“ und zugeordnete Aufgaben werden entfernt.`}
                        onConfirm={async () => {
                          await api.deleteEmployee(employee.id);
                          toast.success("Mitarbeiter entfernt");
                          onChanged();
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectsPanel({
  streams,
  projects,
  statuses,
  onChanged,
}: {
  streams: Stream[];
  projects: Project[];
  statuses: string[];
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [streamId, setStreamId] = useState(streams[0]?.id ?? "");
  const [startDate, setStartDate] = useState(todayIso());
  const [status, setStatus] = useState(statuses[0] ?? "Aktiv");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !streamId) return;
    await api.createProject({ stream_id: streamId, name, start_date: startDate, status });
    toast.success(`Projekt „${name}“ angelegt`);
    setName("");
    onChanged();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Projekt hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          {streams.length === 0 ? (
            <EmptyState title="Zuerst einen Stream anlegen" />
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="proj-name">Projektname</Label>
                <Input id="proj-name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Stream</Label>
                <SelectField
                  value={streamId}
                  onChange={setStreamId}
                  options={streams.map((stream) => ({ value: stream.id, label: stream.name }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-start">Startdatum</Label>
                <Input id="proj-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <SelectField
                  value={status}
                  onChange={setStatus}
                  options={statuses.map((item) => ({ value: item, label: item }))}
                />
              </div>
              <Button type="submit">Projekt speichern</Button>
            </form>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Projekte</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <EmptyState title="Noch keine Projekte" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.stream_name}</TableCell>
                    <TableCell>
                      <StatusBadge status={project.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        label="Löschen"
                        description={`Projekt „${project.name}“ und alle Aufgaben werden gelöscht.`}
                        onConfirm={async () => {
                          await api.deleteProject(project.id);
                          toast.success("Projekt gelöscht");
                          onChanged();
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TasksPanel({
  employees,
  projects,
  tasks,
  meta,
  onChanged,
}: {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  meta: Meta;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [category, setCategory] = useState(meta.task_categories[0] ?? "Sonstiges");
  const [status, setStatus] = useState(meta.task_statuses[0] ?? "Nicht gestartet");
  const [priority, setPriority] = useState("Normal");
  const [dueDate, setDueDate] = useState(todayIso());
  const [startDate, setStartDate] = useState(todayIso());
  const [drafts, setDrafts] = useState<Record<string, Partial<Task>>>({});
  const priorityOptions = meta.task_priorities?.length
    ? meta.task_priorities
    : ["Kritisch", "Hoch", "Normal", "Niedrig"];

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !projectId || !employeeId) return;
    await api.createTask({
      project_id: projectId,
      employee_id: employeeId,
      title,
      description,
      category,
      status,
      priority,
      start_date: startDate,
      due_date: dueDate,
    });
    toast.success(`Aufgabe „${title}“ erstellt`);
    setTitle("");
    setDescription("");
    onChanged();
  }

  function draftValue(task: Task, key: keyof Task): string {
    const override = drafts[task.id]?.[key];
    if (override !== undefined && override !== null) return String(override);
    const current = task[key];
    return current == null ? "" : String(current);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Neue Aufgabe erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 || projects.length === 0 ? (
            <EmptyState title="Zuerst Mitarbeiter und Projekt anlegen" />
          ) : (
            <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="task-title">Titel</Label>
                <Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="task-desc">Beschreibung</Label>
                <Textarea id="task-desc" value={description} onChange={(event) => setDescription(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Projekt</Label>
                <SelectField
                  value={projectId}
                  onChange={setProjectId}
                  options={projects.map((project) => ({ value: project.id, label: project.name }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Verantwortlich</Label>
                <SelectField
                  value={employeeId}
                  onChange={setEmployeeId}
                  options={employees.map((employee) => ({ value: employee.id, label: employee.name }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kategorie</Label>
                <SelectField
                  value={category}
                  onChange={setCategory}
                  options={meta.task_categories.map((item) => ({ value: item, label: item }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <SelectField
                  value={status}
                  onChange={setStatus}
                  options={meta.task_statuses.map((item) => ({ value: item, label: item }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Priorität</Label>
                <SelectField
                  value={priority}
                  onChange={setPriority}
                  options={priorityOptions.map((item) => ({ value: item, label: item }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-start">Startdatum</Label>
                <Input id="task-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-due">Fälligkeitsdatum</Label>
                <Input id="task-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
              <div className="flex items-end">
                <Button type="submit">Aufgabe erstellen</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bestehende Aufgaben</CardTitle>
          <CardDescription>Felder anpassen und einzeln speichern.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <EmptyState title="Keine Aufgaben im System" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aufgabe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priorität</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Fällig</TableHead>
                  <TableHead>Wiedervorlage</TableHead>
                  <TableHead>Projekt / Wer</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="min-w-52">
                      <Input
                        value={draftValue(task, "title")}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [task.id]: { ...current[task.id], title: event.target.value },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell className="min-w-40">
                      <SelectField
                        value={draftValue(task, "status") || task.status}
                        onChange={(value) =>
                          setDrafts((current) => ({
                            ...current,
                            [task.id]: { ...current[task.id], status: value },
                          }))
                        }
                        options={meta.task_statuses.map((item) => ({ value: item, label: item }))}
                      />
                    </TableCell>
                    <TableCell className="min-w-36">
                      <SelectField
                        value={draftValue(task, "priority") || task.priority || "Normal"}
                        onChange={(value) =>
                          setDrafts((current) => ({
                            ...current,
                            [task.id]: { ...current[task.id], priority: value },
                          }))
                        }
                        options={priorityOptions.map((item) => ({ value: item, label: item }))}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={(draftValue(task, "start_date") || task.start_date || "").slice(0, 10)}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [task.id]: { ...current[task.id], start_date: event.target.value },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={(draftValue(task, "due_date") || task.due_date || "").slice(0, 10)}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [task.id]: { ...current[task.id], due_date: event.target.value },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={(draftValue(task, "next_follow_up_date") || task.next_follow_up_date || "").slice(0, 10)}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [task.id]: { ...current[task.id], next_follow_up_date: event.target.value },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell className="whitespace-normal text-xs text-muted-foreground">
                      {task.project_name}
                      <br />
                      {task.employee_name}
                    </TableCell>
                    <TableCell className="space-y-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const patch = drafts[task.id];
                          if (!patch) {
                            toast.message("Keine Änderungen");
                            return;
                          }
                          await api.patchTask(task.id, patch);
                          toast.success("Aufgabe aktualisiert");
                          setDrafts((current) => {
                            const next = { ...current };
                            delete next[task.id];
                            return next;
                          });
                          onChanged();
                        }}
                      >
                        Speichern
                      </Button>
                      <DeleteButton
                        label="Löschen"
                        description={`Aufgabe „${task.title}“ wird unwiderruflich gelöscht.`}
                        onConfirm={async () => {
                          await api.deleteTask(task.id);
                          toast.success("Aufgabe gelöscht");
                          onChanged();
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StepsPanel({ tasks, onChanged }: { tasks: Task[]; onChanged: () => void }) {
  const [taskId, setTaskId] = useState("");
  const [steps, setSteps] = useState<{ description: string; is_completed: boolean }[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);

  async function loadSteps(id: string) {
    setTaskId(id);
    if (!id) {
      setSteps([]);
      return;
    }
    setLoadingSteps(true);
    try {
      const loaded = await api.taskSteps(id);
      const rows: TaskStep[] = loaded;
      const mapped = rows.map((step) => ({
        description: step.description,
        is_completed: step.is_completed,
      }));
      while (mapped.length < 5) {
        mapped.push({ description: "", is_completed: false });
      }
      mapped.push({ description: "", is_completed: false }, { description: "", is_completed: false });
      setSteps(mapped);
    } finally {
      setLoadingSteps(false);
    }
  }

  async function save() {
    if (!taskId) return;
    await api.saveTaskSteps(taskId, steps);
    toast.success("Projektplan gespeichert");
    onChanged();
    await loadSteps(taskId);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mini-Projektpläne</CardTitle>
        <CardDescription>Meilensteine und Schritte für eine Aufgabe definieren.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <EmptyState title="Keine Aufgaben vorhanden" />
        ) : (
          <>
            <div className="max-w-lg space-y-1.5">
              <Label>Mini-Projekt (Task)</Label>
              <SelectField
                value={taskId}
                onChange={(value) => void loadSteps(value)}
                placeholder="Bitte wählen"
                options={tasks.map((task) => ({
                  value: task.id,
                  label: `${task.title} [${task.project_name}]`,
                }))}
              />
            </div>
            {loadingSteps ? <LoadingState label="Lade Schritte…" /> : null}
            {taskId && !loadingSteps ? (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={`${taskId}-${index}`} className="flex items-center gap-3">
                    <span className="w-6 text-sm text-muted-foreground">{index + 1}.</span>
                    <Input
                      value={step.description}
                      placeholder="Schritt / Meilenstein"
                      onChange={(event) =>
                        setSteps((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, description: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <Label className="gap-2 font-normal">
                      <Checkbox
                        checked={step.is_completed}
                        onCheckedChange={(checked) =>
                          setSteps((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, is_completed: Boolean(checked) } : item,
                            ),
                          )
                        }
                      />
                      Erledigt
                    </Label>
                  </div>
                ))}
                <Button onClick={() => void save()}>Projektplan speichern</Button>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
