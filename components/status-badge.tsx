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
