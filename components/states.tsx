"use client";

import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Lade Daten…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {text ? <p className="mt-1 text-sm text-muted-foreground">{text}</p> : null}
    </div>
  );
}
