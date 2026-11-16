import { Flag } from "lucide-react";
import type { Label, Priority } from "@/lib/types";
import { cn, labelStyle, priorityName, priorityStyle } from "@/lib/utils";

export function LabelChip({ label, className }: { label?: Label; className?: string }) {
  if (!label) return null;
  return <span className={cn("chip", labelStyle[label.color].chip, className)}>{label.name}</span>;
}

export function PriorityChip({ priority, compact = false }: { priority: Priority; compact?: boolean }) {
  const s = priorityStyle[priority];
  return (
    <span className={cn("chip", s.chip)} title={`Prioridade ${priorityName[priority]}`}>
      <Flag className="size-3" aria-hidden />
      {compact ? <span className="sr-only">Prioridade </span> : null}
      {priorityName[priority]}
    </span>
  );
}

export function ProgressBar({
  value,
  className,
  tone = "brand",
  label,
}: {
  value: number;
  className?: string;
  tone?: "brand" | "done" | string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const bg =
    tone === "brand"
      ? "linear-gradient(90deg, #c15f3c, #d97757, #eea486)"
      : tone === "done"
        ? "linear-gradient(90deg, #10b981, #34d399)"
        : tone;
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: bg }} />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      <div className="mb-4 grid size-12 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/25 to-brand-600/20">
        <Icon className="size-5 text-brand-300" />
      </div>
      <p className="font-display text-[15px] font-semibold text-white">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-neutral-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-display text-[15px] font-semibold text-white">{children}</h2>
      {action}
    </div>
  );
}
