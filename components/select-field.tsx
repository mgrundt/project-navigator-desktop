"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { value: string; label: string };

export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}) {
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <Select
      value={selected}
      onValueChange={(next) => {
        if (next && typeof next === "object" && "value" in next) {
          onChange(String((next as Option).value));
          return;
        }
        onChange(next == null ? "" : String(next));
      }}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
