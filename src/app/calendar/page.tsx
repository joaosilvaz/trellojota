"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { activeTasks } from "@/lib/selectors";
import { accentStyle, cn } from "@/lib/utils";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function CalendarPage() {
  const state = useAppState();
  const { openNewTask } = useStore();
  const [boardIds, setBoardIds] = useState<string[]>([]);
  const [onlyMine, setOnlyMine] = useState(false);

  const tasks = useMemo(
    () =>
      activeTasks(state).filter(
        (t) => (!boardIds.length || boardIds.includes(t.boardId)) && (!onlyMine || t.assigneeIds.includes(state.currentUserId)),
      ),
    [state, boardIds, onlyMine],
  );

  return (
    <div className="animate-fade-in mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Calendário</h1>
          <p className="mt-1 text-[15px] text-neutral-300">Prazos de todos os quadros em um só lugar.</p>
        </div>
        <button className="btn-primary" onClick={() => openNewTask({})}>
          <Plus className="size-4" /> Nova tarefa
        </button>
      </header>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar por quadro">
        <button
          aria-pressed={boardIds.length === 0}
          onClick={() => setBoardIds([])}
          className={cn("chip h-9 px-3.5 text-[13px]", boardIds.length === 0 ? "bg-white/10 text-white ring-white/20" : "text-neutral-400 ring-white/10 hover:text-white")}
        >
          Todos os quadros
        </button>
        {state.boardOrder.map((id) => {
          const b = state.boards[id];
          const on = boardIds.includes(id);
          return (
            <button
              key={id}
              aria-pressed={on}
              onClick={() => setBoardIds(on ? boardIds.filter((x) => x !== id) : [...boardIds, id])}
              className={cn("chip h-9 gap-2 px-3.5 text-[13px]", on ? "bg-white/10 text-white ring-white/25" : "text-neutral-300 ring-white/10 hover:text-white")}
            >
              <span className="size-2 rounded-full" style={{ background: accentStyle[b.accent].hex }} aria-hidden />
              {b.title}
            </button>
          );
        })}
        <button
          aria-pressed={onlyMine}
          onClick={() => setOnlyMine(!onlyMine)}
          className={cn("chip h-9 px-3.5 text-[13px] sm:ml-auto", onlyMine ? "bg-brand-500/25 text-white ring-brand-400/50" : "text-neutral-300 ring-white/10 hover:text-white")}
        >
          Somente minhas
        </button>
      </div>
      <CalendarView tasks={tasks} defaultBoardId={boardIds[0]} />
    </div>
  );
}
