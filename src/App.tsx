import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  addEmployee,
  addProject,
  addStream,
  addTask,
  addUpdate,
  deleteEmployee,
  deleteProject,
  deleteStream,
  deleteTask,
  getEmployees,
  getProjects,
  getStreams,
  getTasks,
  getUpdatesForTask,
  initDb,
} from '@/lib/tauri-db';
import type {
  Employee,
  Project,
  Stream,
  Task,
  Update,
  TaskCategory,
  TaskStatus,
  StrategicPriority,
} from '@/lib/types';

const TABS = ['Employees', 'Streams', 'Projects', 'Tasks'] as const;
const TASK_STATUSES: TaskStatus[] = ['Nicht gestartet', 'In Arbeit', 'Blockiert', 'Review', 'Done'];
const TASK_CATEGORIES: TaskCategory[] = ['Tech', 'PM', 'Kommunikation', 'Orga', 'Sonstiges'];
const PROJECT_STATUSES = ['Aktiv', 'Pausiert', 'Abgeschlossen'] as const;
const STRATEGIC_PRIORITIES: StrategicPriority[] = [1, 2, 3, 4];

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : '-';
}

const App = () => {
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskUpdates, setTaskUpdates] = useState<Update[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [employeeName, setEmployeeName] = useState('');
  const [employeeRole, setEmployeeRole] = useState('Team');

  const [streamName, setStreamName] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [streamColor, setStreamColor] = useState('');
  const [streamSortOrder, setStreamSortOrder] = useState('0');

  const [projectName, setProjectName] = useState('');
  const [projectStart, setProjectStart] = useState(new Date().toISOString().slice(0, 10));
  const [projectEnd, setProjectEnd] = useState('');
  const [projectStatus, setProjectStatus] = useState<typeof PROJECT_STATUSES[number]>('Aktiv');
  const [projectStreamId, setProjectStreamId] = useState('');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskEmployeeId, setTaskEmployeeId] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('Sonstiges');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Nicht gestartet');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskNextFollowUp, setTaskNextFollowUp] = useState('');
  const [taskOutcome, setTaskOutcome] = useState('');
  const [taskPriority, setTaskPriority] = useState<StrategicPriority | ''>('');

  const [updateComment, setUpdateComment] = useState('');
  const [updateStatusEntry, setUpdateStatusEntry] = useState<TaskStatus>('In Arbeit');
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().slice(0, 10));
  const [updateNextFollowUp, setUpdateNextFollowUp] = useState('');

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  useEffect(() => {
    (async () => {
      await initDb();
      await refreshAll();
      setReady(true);
    })();
  }, []);

  const refreshAll = async () => {
    const [emps, strs, projs, tsks] = await Promise.all([
      getEmployees(),
      getStreams(),
      getProjects(),
      getTasks(),
    ]);
    setEmployees(emps);
    setStreams(strs);
    setProjects(projs);
    setTasks(tsks);
    if (selectedTaskId) {
      const updates = await getUpdatesForTask(selectedTaskId);
      setTaskUpdates(updates);
    }
  };

  const refreshUpdates = async (taskId: string) => {
    setSelectedTaskId(taskId);
    const updates = await getUpdatesForTask(taskId);
    setTaskUpdates(updates);
  };

  const handleAddEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employeeName.trim()) return;
    await addEmployee(employeeName.trim(), employeeRole);
    setEmployeeName('');
    setEmployeeRole('Team');
    await refreshAll();
  };

  const handleAddStream = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!streamName.trim()) return;
    await addStream({
      name: streamName.trim(),
      description: streamDescription.trim(),
      color: streamColor.trim() || null,
      sortOrder: Number(streamSortOrder) || 0,
    });
    setStreamName('');
    setStreamDescription('');
    setStreamColor('');
    setStreamSortOrder('0');
    await refreshAll();
  };

  const handleAddProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectName.trim()) return;
    await addProject({
      name: projectName.trim(),
      startDate: projectStart,
      endDate: projectEnd || null,
      status: projectStatus,
      streamId: projectStreamId || null,
    });
    setProjectName('');
    setProjectStart(new Date().toISOString().slice(0, 10));
    setProjectEnd('');
    setProjectStatus('Aktiv');
    setProjectStreamId('');
    await refreshAll();
  };

  const handleAddTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskTitle.trim() || !taskProjectId || !taskEmployeeId) return;
    await addTask({
      projectId: taskProjectId,
      employeeId: taskEmployeeId,
      title: taskTitle.trim(),
      description: '',
      category: taskCategory,
      status: taskStatus,
      dueDate: taskDueDate || null,
      nextFollowUpDate: taskNextFollowUp || null,
      lastCheckDate: new Date().toISOString(),
      outcome: taskOutcome.trim(),
      strategicPriority: taskPriority === '' ? null : taskPriority,
    });
    setTaskTitle('');
    setTaskCategory('Sonstiges');
    setTaskStatus('Nicht gestartet');
    setTaskDueDate('');
    setTaskNextFollowUp('');
    setTaskOutcome('');
    setTaskPriority('');
    await refreshAll();
  };

  const handleAddUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTaskId || !updateComment.trim()) return;
    await addUpdate({
      taskId: selectedTaskId,
      date: updateDate,
      statusEntry: updateStatusEntry,
      comment: updateComment.trim(),
      nextFollowUpDate: updateNextFollowUp || null,
    });
    setUpdateComment('');
    setUpdateNextFollowUp('');
    setUpdateDate(new Date().toISOString().slice(0, 10));
    const updates = await getUpdatesForTask(selectedTaskId);
    setTaskUpdates(updates);
  };

  const handleDeleteEmployee = async (id: string) => {
    await deleteEmployee(id);
    await refreshAll();
  };

  const handleDeleteStream = async (id: string) => {
    await deleteStream(id);
    await refreshAll();
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    await refreshAll();
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    if (selectedTaskId === id) setSelectedTaskId(null);
    await refreshAll();
  };

  return (
    <main>
      <div className="app-shell">
        <header className="app-header">
          <div>
            <h1>Project Navigator Desktop</h1>
            <p>Lokale Tauri-App mit SQLite für Projekt-, Team- und Task-Verwaltung.</p>
          </div>
          <div className="pill-list">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={tab === activeTab ? 'pill pill-active' : 'pill'}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {!ready ? (
          <div className="notice">
            <p>Lade Daten...</p>
          </div>
        ) : (
          <div className="section-grid">
            {activeTab === 'Employees' && (
              <section className="panel">
                <h2>Mitarbeiter</h2>
                <form onSubmit={handleAddEmployee} className="card form-card">
                  <label>
                    Name
                    <input
                      value={employeeName}
                      onChange={(event) => setEmployeeName(event.target.value)}
                      placeholder="Mitarbeitername"
                    />
                  </label>
                  <label>
                    Rolle
                    <input
                      value={employeeRole}
                      onChange={(event) => setEmployeeRole(event.target.value)}
                    />
                  </label>
                  <button type="submit">Hinzufügen</button>
                </form>

                <div className="card list-card">
                  <h3>Team</h3>
                  <ul>
                    {employees.map((employee) => (
                      <li key={employee.id}>
                        <div>
                          <strong>{employee.name}</strong>
                          <span>{employee.role}</span>
                        </div>
                        <button type="button" className="text-button" onClick={() => handleDeleteEmployee(employee.id)}>
                          Löschen
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {activeTab === 'Streams' && (
              <section className="panel">
                <h2>Streams</h2>
                <form onSubmit={handleAddStream} className="card form-card">
                  <label>
                    Name
                    <input
                      value={streamName}
                      onChange={(event) => setStreamName(event.target.value)}
                      placeholder="Streamname"
                    />
                  </label>
                  <label>
                    Beschreibung
                    <input
                      value={streamDescription}
                      onChange={(event) => setStreamDescription(event.target.value)}
                      placeholder="Beschreibung"
                    />
                  </label>
                  <label>
                    Farbe
                    <input
                      value={streamColor}
                      onChange={(event) => setStreamColor(event.target.value)}
                      placeholder="#123456"
                    />
                  </label>
                  <label>
                    Sortier-Reihenfolge
                    <input
                      type="number"
                      value={streamSortOrder}
                      onChange={(event) => setStreamSortOrder(event.target.value)}
                    />
                  </label>
                  <button type="submit">Hinzufügen</button>
                </form>

                <div className="card list-card">
                  <h3>Stream-Liste</h3>
                  <ul>
                    {streams.map((stream) => (
                      <li key={stream.id}>
                        <div>
                          <strong>{stream.name}</strong>
                          <span>{stream.description || 'Keine Beschreibung'}</span>
                        </div>
                        <button type="button" className="text-button" onClick={() => handleDeleteStream(stream.id)}>
                          Löschen
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {activeTab === 'Projects' && (
              <section className="panel">
                <h2>Projekte</h2>
                <form onSubmit={handleAddProject} className="card form-card">
                  <label>
                    Name
                    <input
                      value={projectName}
                      onChange={(event) => setProjectName(event.target.value)}
                      placeholder="Projektname"
                    />
                  </label>
                  <label>
                    Startdatum
                    <input
                      type="date"
                      value={projectStart}
                      onChange={(event) => setProjectStart(event.target.value)}
                    />
                  </label>
                  <label>
                    Enddatum
                    <input
                      type="date"
                      value={projectEnd}
                      onChange={(event) => setProjectEnd(event.target.value)}
                    />
                  </label>
                  <label>
                    Status
                    <select value={projectStatus} onChange={(event) => setProjectStatus(event.target.value as any)}>
                      {PROJECT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Stream
                    <select value={projectStreamId} onChange={(event) => setProjectStreamId(event.target.value)}>
                      <option value="">Keiner</option>
                      {streams.map((stream) => (
                        <option key={stream.id} value={stream.id}>
                          {stream.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit">Erstellen</button>
                </form>

                <div className="card list-card">
                  <h3>Projektliste</h3>
                  <ul>
                    {projects.map((project) => (
                      <li key={project.id}>
                        <div>
                          <strong>{project.name}</strong>
                          <span>{project.status} • {formatDate(project.startDate)} bis {project.endDate ? formatDate(project.endDate) : '–'}</span>
                        </div>
                        <button type="button" className="text-button" onClick={() => handleDeleteProject(project.id)}>
                          Löschen
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {activeTab === 'Tasks' && (
              <section className="panel">
                <h2>Tasks</h2>
                <form onSubmit={handleAddTask} className="card form-card">
                  <label>
                    Titel
                    <input
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      placeholder="Task-Titel"
                    />
                  </label>
                  <label>
                    Projekt
                    <select value={taskProjectId} onChange={(event) => setTaskProjectId(event.target.value)}>
                      <option value="">Wähle Projekt</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Mitarbeiter
                    <select value={taskEmployeeId} onChange={(event) => setTaskEmployeeId(event.target.value)}>
                      <option value="">Wähle Mitarbeiter</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Kategorie
                    <select value={taskCategory} onChange={(event) => setTaskCategory(event.target.value as TaskCategory)}>
                      {TASK_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Status
                    <select value={taskStatus} onChange={(event) => setTaskStatus(event.target.value as TaskStatus)}>
                      {TASK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Fälligkeitsdatum
                    <input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} />
                  </label>
                  <label>
                    Nächste Nachverfolgung
                    <input type="date" value={taskNextFollowUp} onChange={(event) => setTaskNextFollowUp(event.target.value)} />
                  </label>
                  <label>
                    Priorität
                    <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as StrategicPriority | '')}>
                      <option value="">Keine</option>
                      {STRATEGIC_PRIORITIES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Outcome
                    <input value={taskOutcome} onChange={(event) => setTaskOutcome(event.target.value)} placeholder="Ergebnis" />
                  </label>
                  <button type="submit">Task anlegen</button>
                </form>

                <div className="card list-card">
                  <h3>Taskliste</h3>
                  <ul>
                    {tasks.map((task) => (
                      <li key={task.id} className="task-row">
                        <button type="button" className="task-link" onClick={() => refreshUpdates(task.id)}>
                          <div>
                            <strong>{task.title}</strong>
                            <span>{task.status} • {formatDate(task.dueDate)}</span>
                          </div>
                          <div>{task.outcome || 'kein Outcome'}</div>
                        </button>
                        <button type="button" className="text-button" onClick={() => handleDeleteTask(task.id)}>
                          Löschen
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedTask && (
                  <div className="card details-card">
                    <h3>Updates für: {selectedTask.title}</h3>
                    <ul>
                      {taskUpdates.map((update) => (
                        <li key={update.id}>
                          <div>
                            <strong>{formatDate(update.date)}</strong> – {update.statusEntry}
                          </div>
                          <p>{update.comment}</p>
                        </li>
                      ))}
                    </ul>
                    <form onSubmit={handleAddUpdate} className="nested-form">
                      <label>
                        Datum
                        <input type="date" value={updateDate} onChange={(event) => setUpdateDate(event.target.value)} />
                      </label>
                      <label>
                        Status
                        <select value={updateStatusEntry} onChange={(event) => setUpdateStatusEntry(event.target.value as TaskStatus)}>
                          {TASK_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Kommentar
                        <input value={updateComment} onChange={(event) => setUpdateComment(event.target.value)} placeholder="Kommentar" />
                      </label>
                      <label>
                        Nächste Nachverfolgung
                        <input type="date" value={updateNextFollowUp} onChange={(event) => setUpdateNextFollowUp(event.target.value)} />
                      </label>
                      <button type="submit">Update hinzufügen</button>
                    </form>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default App;
