import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "Abgeschlossen"
      ? "secondary"
      : status === "Wartet"
        ? "outline"
        : status === "Aktiv" || status === "In Bearbeitung"
          ? "default"
          : "outline";

  return (
    <Badge
      variant={variant}
      className={cn(
        (status === "Aktiv" || status === "In Bearbeitung") && "bg-primary text-primary-foreground",
        status === "Abgeschlossen" && "bg-sky-100 text-sky-800",
        status === "Wartet" && "border-primary/30 bg-primary/10 text-primary",
      )}
    >
      {status}
    </Badge>
  );
}

export function FocusBadge({ label, days }: { label: string; days: number | null }) {
  const overdue = days !== null && days < 0;
  const today = days === 0;
  return (
    <Badge
      variant={overdue ? "destructive" : today ? "default" : "secondary"}
      className={cn(today && "bg-amber-500 text-white")}
    >
      {label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge
      variant={priority === "Kritisch" || priority === "Hoch" ? "default" : "secondary"}
      className={cn(
        priority === "Kritisch" && "bg-red-600 text-white hover:bg-red-600",
        priority === "Hoch" && "bg-orange-500 text-white hover:bg-orange-500",
        priority === "Normal" && "bg-slate-100 text-slate-700",
        priority === "Niedrig" && "bg-muted text-muted-foreground",
      )}
    >
      {priority || "Normal"}
    </Badge>
  );
}
