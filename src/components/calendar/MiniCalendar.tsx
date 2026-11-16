"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { activeTasks, isDone } from "@/lib/selectors";
import type { Task } from "@/lib/types";
import { cn, formatLong, formatMonth, priorityStyle, today, toISODate } from "@/lib/utils";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function monthMatrix(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const days: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(toISODate(d));
  }
  // remove a última semana se ela for toda do mês seguinte
  if (days[35].slice(5, 7) !== days[14].slice(5, 7)) return days.slice(0, 35);
  return days;
}

export function MiniCalendar() {
  const state = useAppState();
  const { openTask } = useStore();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(today());
  const t0 = today();
  const days = useMemo(() => monthMatrix(cursor), [cursor]);
  const month = String(cursor.getMonth() + 1).padStart(2, "0");

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    const tasks = activeTasks(state).filter((t) => t.dueDate);
    for (const t of tasks) {
      const arr = map.get(t.dueDate!) ?? [];
      arr.push(t);
      map.set(t.dueDate!, arr);
    }
    return map;
  }, [state]);

  const selectedTasks = byDay.get(selected) ?? [];

  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[15px] font-semibold text-white">{formatMonth(cursor)}</h2>
        <div className="flex gap-1">
          <button className="icon-btn size-8" aria-label="Mês anterior" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft className="size-4" />
          </button>
          <button className="icon-btn size-8" aria-label="Próximo mês" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-semibold text-neutral-500" aria-hidden>
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1" role="grid" aria-label="Calendário de prazos">
        {days.map((d) => {
          const inMonth = d.slice(5, 7) === month;
          const count = byDay.get(d)?.filter((t) => !isDone(state, t)).length ?? 0;
          const isToday = d === t0;
          const isSel = d === selected;
          return (
            <button
              key={d}
              role="gridcell"
              aria-selected={isSel}
              aria-label={`${formatLong(d)}${count ? `, ${count} tarefas` : ""}`}
              onClick={() => setSelected(d)}
              className={cn(
                "relative mx-auto grid size-9 place-items-center rounded-xl text-[13px] font-semibold transition",
                !inMonth && "text-neutral-600",
                inMonth && !isSel && "text-neutral-200 hover:bg-white/[0.07]",
                isToday && !isSel && "ring-1 ring-brand-300/60",
                isSel && "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_6px_18px_-6px_rgba(217,119,87,0.7)]",
              )}
            >
              {Number(d.slice(8, 10))}
              {count > 0 && (
                <span className={cn("absolute bottom-1 size-1 rounded-full", isSel ? "bg-white" : "bg-brand-300")} aria-hidden />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 border-t border-white/[0.06] pt-3">
        <p className="text-xs font-semibold text-neutral-400 first-letter:uppercase">{formatLong(selected)}</p>
        {selectedTasks.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-400">Nenhum prazo neste dia.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {selectedTasks.map((t) => (
              <li key={t.id}>
                <button onClick={() => openTask(t.id)} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-white/[0.06]">
                  <span className={cn("size-2 shrink-0 rounded-full", isDone(state, t) ? "bg-emerald-400" : priorityStyle[t.priority].dot)} aria-hidden />
                  <span className={cn("truncate", isDone(state, t) ? "text-neutral-400 line-through" : "text-neutral-100")}>{t.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
