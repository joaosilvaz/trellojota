"use client";

import { X } from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { boardProgress, memberWorkload, taskStats, upcomingTasks } from "@/lib/selectors";
import { accentStyle, cn, dueLabel, priorityStyle, today } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/Chips";

/** Painel contextual à direita do quadro: progresso, equipe e próximos prazos */
export function BoardInsights({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const state = useAppState();
  const { openTask } = useStore();
  const board = state.boards[boardId];
  const p = boardProgress(state, boardId);
  const s = taskStats(state, boardId);
  const workload = memberWorkload(state, boardId);
  const maxLoad = Math.max(1, ...board.memberIds.map((m) => workload.get(m) ?? 0));
  const upcoming = upcomingTasks(state, 14).filter((t) => t.boardId === boardId).slice(0, 5);
  const acc = accentStyle[board.accent];
  const circ = 2 * Math.PI * 34;

  return (
    <aside className="glass animate-slide-in w-full shrink-0 space-y-6 rounded-3xl p-5 xl:w-[300px]" aria-label="Painel do quadro">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[15px] font-semibold text-white">Visão do projeto</h2>
        <button className="icon-btn size-8" onClick={onClose} aria-label="Fechar painel">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`${p.pct}% concluído`}>
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={acc.from} />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <circle cx="42" cy="42" r="34" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
          <circle
            cx="42"
            cy="42"
            r="34"
            stroke="url(#ringGrad)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - p.pct / 100)}
            transform="rotate(-90 42 42)"
            style={{ transition: "stroke-dashoffset 500ms ease" }}
          />
          <text x="42" y="47" textAnchor="middle" className="fill-white font-display text-[17px] font-semibold">
            {p.pct}%
          </text>
        </svg>
        <dl className="grid flex-1 grid-cols-2 gap-2 text-center">
          {[
            ["Abertas", s.open, "text-white"],
            ["Feitas", s.done, "text-emerald-300"],
            ["Atrasadas", s.overdue, "text-rose-300"],
            ["Em breve", s.soon, "text-amber-200"],
          ].map(([l, v, c]) => (
            <div key={l as string} className="rounded-xl bg-white/[0.04] px-2 py-1.5">
              <dd className={cn("font-display text-lg font-semibold", c as string)}>{v}</dd>
              <dt className="text-[11px] text-slate-400">{l}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <p className="label-xs mb-3">Carga da equipe</p>
        <ul className="space-y-3">
          {board.memberIds.map((id) => {
            const m = state.members[id];
            const n = workload.get(id) ?? 0;
            return (
              <li key={id} className="flex items-center gap-3">
                <Avatar member={m} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="truncate text-slate-200">{m?.name}</span>
                    <span className="text-slate-400">{n}</span>
                  </div>
                  <ProgressBar value={(n / maxLoad) * 100} tone={`linear-gradient(90deg, ${acc.from}, ${acc.to})`} label={`Carga de ${m?.name}`} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="label-xs mb-2">Próximos prazos</p>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400">Sem prazos nas próximas duas semanas.</p>
        ) : (
          <ul className="space-y-1">
            {upcoming.map((t) => (
              <li key={t.id}>
                <button onClick={() => openTask(t.id)} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-white/[0.06]">
                  <span className={cn("size-2 shrink-0 rounded-full", priorityStyle[t.priority].dot)} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-100">{t.title}</span>
                  <span className={cn("text-xs font-semibold", t.dueDate! < today() ? "text-rose-300" : "text-slate-400")}>
                    {dueLabel(t.dueDate!)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
