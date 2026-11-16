"use client";

import { useMemo, useState } from "react";
import { CalendarX2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { isDone } from "@/lib/selectors";
import { accentStyle, cn, formatLong, formatMonth, priorityStyle, today } from "@/lib/utils";
import { monthMatrix } from "./MiniCalendar";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Calendário mensal. Recebe as tarefas já filtradas (por quadro, filtros etc.) */
export function CalendarView({ tasks, defaultBoardId }: { tasks: Task[]; defaultBoardId?: string }) {
  const state = useAppState();
  const { openTask, openNewTask } = useStore();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(today());
  const t0 = today();
  const days = useMemo(() => monthMatrix(cursor), [cursor]);
  const month = String(cursor.getMonth() + 1).padStart(2, "0");

  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const arr = m.get(t.dueDate) ?? [];
      arr.push(t);
      m.set(t.dueDate, arr);
    }
    return m;
  }, [tasks]);

  const noDue = tasks.filter((t) => !t.dueDate && !isDone(state, t));
  const selectedTasks = byDay.get(selected) ?? [];

  const pill = (t: Task) => {
    const done = isDone(state, t);
    const overdue = !done && t.dueDate! < t0;
    const acc = accentStyle[state.boards[t.boardId]?.accent ?? "violet"];
    return (
      <button
        key={t.id}
        onClick={(e) => {
          e.stopPropagation();
          openTask(t.id);
        }}
        className={cn(
          "flex w-full items-center gap-1.5 truncate rounded-lg border px-1.5 py-1 text-left text-[12px] font-semibold transition",
          done
            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100/80 line-through"
            : overdue
              ? "border-rose-400/30 bg-rose-500/15 text-rose-100"
              : "border-white/[0.08] bg-white/[0.06] text-slate-100 hover:bg-white/[0.12]",
        )}
        title={`${t.title} · ${state.boards[t.boardId]?.title}`}
      >
        <span className="size-1.5 shrink-0 rounded-full" style={{ background: acc.hex }} aria-hidden />
        <span className="truncate">{t.title}</span>
      </button>
    );
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="glass min-w-0 rounded-3xl p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2 px-1">
          <h2 className="font-display mr-auto text-xl font-semibold text-white">{formatMonth(cursor)}</h2>
          <button
            className="btn-secondary h-9"
            onClick={() => {
              setCursor(new Date());
              setSelected(t0);
            }}
          >
            Hoje
          </button>
          <button className="icon-btn size-9" aria-label="Mês anterior" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft className="size-5" />
          </button>
          <button className="icon-btn size-9" aria-label="Próximo mês" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight className="size-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2" role="grid" aria-label={`Calendário de ${formatMonth(cursor)}`}>
          {WEEKDAYS.map((w) => (
            <div key={w} role="columnheader" className="pb-1 text-center text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
              {w}
            </div>
          ))}
          {days.map((d) => {
            const items = byDay.get(d) ?? [];
            const inMonth = d.slice(5, 7) === month;
            const isToday = d === t0;
            const isSel = d === selected;
            return (
              <div
                key={d}
                role="gridcell"
                aria-selected={isSel}
                tabIndex={0}
                onClick={() => setSelected(d)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(d);
                  }
                }}
                aria-label={`${formatLong(d)}, ${items.length} tarefa(s)`}
                className={cn(
                  "group relative flex min-h-14 cursor-pointer flex-col rounded-xl border p-1 transition sm:min-h-28 sm:rounded-2xl sm:p-2",
                  inMonth ? "border-white/[0.06] bg-white/[0.025]" : "border-transparent bg-transparent opacity-45",
                  isSel && "border-electric-400/60 bg-electric-500/10",
                  !isSel && "hover:border-white/15",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-xs font-semibold sm:size-7 sm:text-[13px]",
                      isToday ? "bg-gradient-to-br from-electric-500 to-violet-600 text-white" : "text-slate-300",
                    )}
                  >
                    {Number(d.slice(8, 10))}
                  </span>
                  <button
                    className="hidden size-6 place-items-center rounded-md text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-white focus-visible:opacity-100 sm:grid"
                    onClick={(e) => {
                      e.stopPropagation();
                      openNewTask({ boardId: defaultBoardId, dueDate: d });
                    }}
                    aria-label={`Nova tarefa em ${formatLong(d)}`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                {/* celular: pontos */}
                {items.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden" aria-hidden>
                    {items.slice(0, 4).map((t) => (
                      <span key={t.id} className={cn("size-1.5 rounded-full", isDone(state, t) ? "bg-emerald-400" : priorityStyle[t.priority].dot)} />
                    ))}
                  </div>
                )}
                {/* desktop: pílulas */}
                <div className="mt-1.5 hidden space-y-1 sm:block">
                  {items.slice(0, 3).map(pill)}
                  {items.length > 3 && (
                    <span className="block px-1 text-[11px] font-semibold text-cyan-200">+{items.length - 3} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="space-y-5" aria-label="Detalhes do dia">
        <div className="glass rounded-3xl p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-display text-[15px] font-semibold text-white first-letter:uppercase">{formatLong(selected)}</h3>
            <button className="icon-btn size-8" onClick={() => openNewTask({ boardId: defaultBoardId, dueDate: selected })} aria-label="Nova tarefa neste dia">
              <Plus className="size-4" />
            </button>
          </div>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma tarefa com prazo neste dia.</p>
          ) : (
            <ul className="space-y-1.5">
              {selectedTasks.map((t) => (
                <li key={t.id}>
                  <button onClick={() => openTask(t.id)} className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.07]">
                    <span className={cn("block text-sm font-semibold", isDone(state, t) ? "text-slate-400 line-through" : "text-white")}>{t.title}</span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span className={cn("size-1.5 rounded-full", priorityStyle[t.priority].dot)} aria-hidden />
                      {state.boards[t.boardId]?.title} · {state.columns[t.columnId]?.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass rounded-3xl p-5">
          <h3 className="font-display mb-3 text-[15px] font-semibold text-white">Sem prazo definido</h3>
          {noDue.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <CalendarX2 className="size-4" /> Todas as tarefas abertas têm prazo.
            </div>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto scroll-thin">
              {noDue.map((t) => (
                <li key={t.id}>
                  <button onClick={() => openTask(t.id)} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm text-slate-200 hover:bg-white/[0.06]">
                    <span className={cn("size-1.5 shrink-0 rounded-full", priorityStyle[t.priority].dot)} aria-hidden />
                    <span className="truncate">{t.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
