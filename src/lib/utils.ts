import type { LabelColor, Priority, Task, BoardAccent } from "./types";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

/* ---------- datas (sempre em horário local, formato YYYY-MM-DD) ---------- */

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string) {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function today() {
  return toISODate(new Date());
}

export function addDays(base: string | Date, n: number) {
  const d = typeof base === "string" ? parseISODate(base) : new Date(base);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function diffDays(a: string, b: string) {
  const ms = parseISODate(a).getTime() - parseISODate(b).getTime();
  return Math.round(ms / 86400000);
}

const shortFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const longFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const weekdayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

export function formatShort(s: string) {
  return shortFmt.format(parseISODate(s)).replace(".", "").replace(" de ", " ");
}
export function formatLong(s: string) {
  return longFmt.format(parseISODate(s));
}
export function formatWeekday(s: string) {
  return weekdayFmt.format(parseISODate(s)).replace(".", "");
}
export function formatMonth(d: Date) {
  const s = monthFmt.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ontem";
  if (d < 30) return `há ${d} dias`;
  return formatShort(iso.slice(0, 10));
}

export function dueLabel(due: string) {
  const d = diffDays(due, today());
  if (d === 0) return "Hoje";
  if (d === 1) return "Amanhã";
  if (d === -1) return "Ontem";
  return formatShort(due);
}

export type DueState = "overdue" | "soon" | "later" | "done";

export function dueState(task: Task, isDone: boolean): DueState | null {
  if (!task.dueDate) return null;
  if (isDone) return "done";
  const d = diffDays(task.dueDate, today());
  if (d < 0) return "overdue";
  if (d <= 3) return "soon";
  return "later";
}

/* ---------- tokens visuais ---------- */

export const PRIORITIES: { id: Priority; name: string; weight: number }[] = [
  { id: "urgente", name: "Urgente", weight: 4 },
  { id: "alta", name: "Alta", weight: 3 },
  { id: "media", name: "Média", weight: 2 },
  { id: "baixa", name: "Baixa", weight: 1 },
];

export const priorityName: Record<Priority, string> = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const priorityWeight: Record<Priority, number> = {
  urgente: 4,
  alta: 3,
  media: 2,
  baixa: 1,
};

/** classes com contraste AA sobre fundo escuro */
export const priorityStyle: Record<Priority, { chip: string; dot: string; hex: string }> = {
  urgente: { chip: "bg-rose-500/15 text-rose-200 ring-rose-400/30", dot: "bg-rose-400", hex: "#fb7185" },
  alta: { chip: "bg-amber-500/15 text-amber-200 ring-amber-400/30", dot: "bg-amber-400", hex: "#fbbf24" },
  media: { chip: "bg-sky-500/15 text-sky-200 ring-sky-400/30", dot: "bg-sky-400", hex: "#38bdf8" },
  baixa: { chip: "bg-slate-400/15 text-slate-200 ring-slate-300/25", dot: "bg-slate-400", hex: "#94a3b8" },
};

export const labelStyle: Record<LabelColor, { chip: string; bar: string; hex: string }> = {
  violet: { chip: "bg-violet-500/18 text-violet-200 ring-violet-400/30", bar: "bg-violet-400", hex: "#a78bfa" },
  blue: { chip: "bg-blue-500/18 text-blue-200 ring-blue-400/30", bar: "bg-blue-400", hex: "#60a5fa" },
  cyan: { chip: "bg-cyan-500/15 text-cyan-200 ring-cyan-400/30", bar: "bg-cyan-400", hex: "#22d3ee" },
  amber: { chip: "bg-amber-500/15 text-amber-200 ring-amber-400/30", bar: "bg-amber-400", hex: "#fbbf24" },
  green: { chip: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30", bar: "bg-emerald-400", hex: "#34d399" },
  pink: { chip: "bg-pink-500/15 text-pink-200 ring-pink-400/30", bar: "bg-pink-400", hex: "#f472b6" },
  red: { chip: "bg-red-500/15 text-red-200 ring-red-400/30", bar: "bg-red-400", hex: "#f87171" },
};

export const LABEL_COLORS: LabelColor[] = ["violet", "blue", "cyan", "amber", "green", "pink", "red"];

export const accentStyle: Record<BoardAccent, { from: string; to: string; text: string; hex: string }> = {
  violet: { from: "#8b5cf6", to: "#4f46e5", text: "text-violet-300", hex: "#a78bfa" },
  blue: { from: "#3b82f6", to: "#1d4ed8", text: "text-blue-300", hex: "#60a5fa" },
  cyan: { from: "#22d3ee", to: "#2563eb", text: "text-cyan-300", hex: "#22d3ee" },
  pink: { from: "#ec4899", to: "#8b5cf6", text: "text-pink-300", hex: "#f472b6" },
  amber: { from: "#f59e0b", to: "#ef4444", text: "text-amber-300", hex: "#fbbf24" },
  green: { from: "#10b981", to: "#0ea5e9", text: "text-emerald-300", hex: "#34d399" },
};

export const BOARD_ACCENTS: BoardAccent[] = ["violet", "blue", "cyan", "pink", "amber", "green"];

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
