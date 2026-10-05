export const LEITPLANKEN = {
  sources: [
    {
      title: "Prozessoptimierungsliste",
      text: "Dokumentation des Status der laufenden Projekte.",
    },
    {
      title: "Datenschutzliste",
      text: "Prüfung auf Updates und Statuspflege.",
    },
    {
      title: "Planner",
      text: "Aufgaben- und Projektmanagement.",
    },
    {
      title: "KI-Register",
      text: "Pflege und Updates der gelisteten KI-Systeme.",
    },
    {
      title: "Projekt-Navigator",
      text: "Was muss ich wann nachfragen und nachhalten?",
    },
  ],
  learning: [
    { title: "Job", text: "Team und KI-Themen erfolgreich weiterentwickeln." },
    { title: "M365", text: "AI-103 / MS-102" },
    { title: "KI", text: "Datacamp AI Engineer" },
    { title: "FU", text: "GrInfi I & Algo.Math." },
    { title: "Python und Co.", text: "Python Intermediate CC" },
  ],
  operational: [
    "AI Governance: Bei jedem M365/KI-Projekt direkt Compliance und DSGVO mitdenken.",
    "Dienststellen: Die Dienststellen müssen eingebunden werden. Deadline, DSGVO, Commitment.",
    "Fokus-Prinzip: Aufgaben im Team konsequent priorisieren, um Verzettelung bei Mitarbeitern zu vermeiden.",
  ],
};

export function formatDate(value?: string | null): string {
  if (!value) return "–";
  const stamp = value.slice(0, 10);
  const [year, month, day] = stamp.split("-");
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "–";
  const [datePart, timePart] = value.split(" ");
  const date = formatDate(datePart);
  if (!timePart) return date;
  return `${date} ${timePart.slice(0, 5)}`;
}

export function plusDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
