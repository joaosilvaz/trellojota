"use client";

import { useMemo, useState } from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { useAppState } from "@/lib/store";
import { ActivityItem } from "@/components/dashboard/Widgets";
import { EmptyState } from "@/components/ui/Chips";
import { Avatar } from "@/components/ui/Avatar";
import { cn, formatLong, toISODate, today, addDays } from "@/lib/utils";
import type { Activity } from "@/lib/types";

export default function ActivityPage() {
  const state = useAppState();
  const [boardId, setBoardId] = useState("");
  const [memberId, setMemberId] = useState("");

  const groups = useMemo(() => {
    const list = state.activity.filter((a) => (!boardId || a.boardId === boardId) && (!memberId || a.memberId === memberId));
    const map = new Map<string, Activity[]>();
    for (const a of list) {
      const k = toISODate(new Date(a.createdAt));
      map.set(k, [...(map.get(k) ?? []), a]);
    }
    return [...map.entries()];
  }, [state.activity, boardId, memberId]);

  const dayTitle = (d: string) => (d === today() ? "Hoje" : d === addDays(today(), -1) ? "Ontem" : formatLong(d));

  return (
    <div className="animate-fade-in mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Atividade</h1>
        <p className="mt-1 text-[15px] text-neutral-300">Tudo o que a equipe criou, moveu, comentou e concluiu.</p>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="act-board" className="label-xs mb-1.5 block">
            Quadro
          </label>
          <select id="act-board" className="field" value={boardId} onChange={(e) => setBoardId(e.target.value)}>
            <option value="">Todos os quadros</option>
            {state.boardOrder.map((id) => (
              <option key={id} value={id}>
                {state.boards[id].title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="label-xs mb-1.5">Pessoa</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por pessoa">
            {Object.values(state.members).map((m) => (
              <button
                key={m.id}
                aria-pressed={memberId === m.id}
                onClick={() => setMemberId(memberId === m.id ? "" : m.id)}
                className={cn("rounded-full p-0.5 ring-2 transition", memberId === m.id ? "ring-brand-300" : "ring-transparent opacity-70 hover:opacity-100")}
                aria-label={`Filtrar por ${m.name}`}
              >
                <Avatar member={m} size="md" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="glass rounded-3xl">
          <EmptyState icon={ActivityIcon} title="Nenhuma atividade" description="Quando alguém criar ou mover tarefas, aparecerá aqui." />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, items]) => (
            <section key={day} className="glass rounded-3xl p-5 sm:p-6">
              <h2 className="font-display mb-4 text-sm font-semibold text-neutral-300 first-letter:uppercase">{dayTitle(day)}</h2>
              <ul className="space-y-4">
                {items.map((a) => (
                  <ActivityItem key={a.id} a={a} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
