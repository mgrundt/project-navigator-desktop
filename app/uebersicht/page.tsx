"use client";

import { useMemo } from "react";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils-app";
import { useApi } from "@/components/use-api";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function OverviewPage() {
  const loader = useMemo(() => api.overview, []);
  const { data, loading } = useApi(loader);

  if (loading || !data) {
    return <LoadingState />;
  }

  if (data.length === 0) {
    return (
      <div>
        <PageHeader
          title="Strategische Stream- & Projektexploration"
          description="Vollständiger Drilldown deines Portfolios."
        />
        <EmptyState title="Noch keine Streams" text="Lege im Setup zuerst strategische Streams an." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Strategische Stream- & Projektexploration"
        description="Vollständiger Drilldown: Stream → Projekt → Aufgabe → Historie."
      />
      <Accordion className="rounded-xl border bg-card px-4">
        {data.map((stream) => (
          <AccordionItem key={stream.id} value={stream.id}>
            <AccordionTrigger>
              <span className="pr-4">
                Stream: {stream.name}
                <span className="ml-2 font-normal text-muted-foreground">
                  {stream.projects.length} Projekte
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {stream.description ? (
                <p className="mb-3 text-sm italic text-muted-foreground">Fokus: {stream.description}</p>
              ) : null}
              {stream.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Diesem Stream sind aktuell keine Projekte zugeordnet.</p>
              ) : (
                <Accordion className="rounded-lg border px-3">
                  {stream.projects.map((project) => (
                    <AccordionItem key={project.id} value={project.id}>
                      <AccordionTrigger>
                        <span className="flex items-center gap-2 pr-4">
                          Projekt: {project.name}
                          <StatusBadge status={project.status} />
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        {project.tasks.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Noch keine Aufgaben in diesem Projekt.</p>
                        ) : (
                          <Accordion className="rounded-lg border px-3">
                            {project.tasks.map((task) => (
                              <AccordionItem key={task.id} value={task.id}>
                                <AccordionTrigger>
                                  <span className="flex flex-wrap items-center gap-2 pr-4">
                                    {task.title}
                                    <Badge variant="outline">{task.employee_name}</Badge>
                                    <StatusBadge status={task.status} />
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3">
                                  {task.description ? (
                                    <p className="text-sm">
                                      <span className="font-medium">Beschreibung: </span>
                                      {task.description}
                                    </p>
                                  ) : null}
                                  <p className="text-xs text-muted-foreground">
                                    Deadline: {formatDate(task.due_date)} · Kategorie: {task.category}
                                  </p>
                                  {task.steps.length > 0 ? (
                                    <ul className="space-y-1 text-sm">
                                      {task.steps.map((step) => (
                                        <li key={step.id}>
                                          {step.is_completed ? "✓" : "○"} {step.step_number}. {step.description}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : null}
                                  <div>
                                    <p className="mb-2 font-medium">Bearbeitungshistorie</p>
                                    {task.history.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">
                                        Noch keine Status-Updates eingereicht.
                                      </p>
                                    ) : (
                                      <div className="space-y-2">
                                        {task.history.map((entry, index) => (
                                          <div key={entry.id ?? `${task.id}-${index}`} className="rounded-lg border p-3">
                                            <p className="text-xs text-muted-foreground">
                                              {formatDateTime(entry.date)} · {entry.status_entry}
                                            </p>
                                            <p className="mt-1 text-sm">
                                              {entry.comment || "Kein Kommentar hinterlassen"}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
