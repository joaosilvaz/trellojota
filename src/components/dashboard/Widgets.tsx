"use client";

import Link from "next/link";
import { AlarmClock, ArrowRight, CheckCircle2, Circle, CircleDot, FolderKanban, Sparkles, Star, TriangleAlert } from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { boardProgress, isDone, taskStats, upcomingTasks } from "@/lib/selectors";
import { accentStyle, cn, diffDays, dueLabel, formatShort, formatWeekday, priorityStyle, relativeTime, today } from "@/lib/utils";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { EmptyState, ProgressBar } from "@/components/ui/Chips";
import type { Activity } from "@/lib/types";

export function StatCards() {
  const state = useAppState();
  const s = taskStats(state);
  const items = [
    { label: "Em aberto", value: s.open, hint: `${s.total} no total`, icon: CircleDot, tone: "from-electric-500/30 to-electric-500/0", iconCls: "text-electric-300" },
    { label: "Concluídas", value: s.done, hint: `${s.total ? Math.round((s.done / s.total) * 100) : 0}% do total`, icon: CheckCircle2, tone: "from-emerald-500/25 to-emerald-500/0", iconCls: "text-emerald-300" },
    { label: "Atrasadas", value: s.overdue, hint: s.overdue ? "Precisam de atenção" : "Nada atrasado", icon: TriangleAlert, tone: "from-rose-500/25 to-rose-500/0", iconCls: "text-rose-300" },
    { label: "Prazo próximo", value: s.soon, hint: "Nos próximos 3 dias", icon: AlarmClock, tone: "from-amber-500/25 to-amber-500/0", iconCls: "text-amber-200" },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {items.map((it) => (
        <li key={it.label} className="glass relative overflow-hidden rounded-3xl p-4 sm:p-5">
          <div className={cn("pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-gradient-to-br blur-2xl", it.tone)} aria-hidden />
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.05]">
              <it.icon className={cn("size-4", it.iconCls)} aria-hidden />
            </span>
            <p className="truncate text-sm font-semibold text-slate-200">{it.label}</p>
          </div>
          <p className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">{it.value}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{it.hint}</p>
        </li>
      ))}
    </ul>
  );
}

export function ProjectProgress() {
  const state = useAppState();
  const boards = state.boardOrder.map((id) => state.boards[id]).filter(Boolean);
  return (
    <div className="glass h-full rounded-3xl p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[15px] font-semibold text-white">Progresso dos projetos</h2>
        <Link href="/boards" className="text-xs font-semibold text-cyan-200 hover:underline">
          Ver quadros
        </Link>
      </div>
      {boards.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Nenhum projeto ainda" description="Crie um quadro para acompanhar o progresso aqui." />
      ) : (
        <ul className="space-y-5">
          {boards.map((b) => {
            const p = boardProgress(state, b.id);
            const acc = accentStyle[b.accent];
            return (
              <li key={b.id}>
                <Link href={`/boards/${b.id}`} className="group block rounded-xl">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="size-2.5 rounded-[4px]" style={{ background: `linear-gradient(135deg, ${acc.from}, ${acc.to})` }} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-100 group-hover:text-white">{b.title}</span>
                    <span className="text-xs text-slate-400">
                      {p.done}/{p.total}
                    </span>
                    <span className="w-10 text-right text-sm font-semibold text-white">{p.pct}%</span>
                  </div>
                  <ProgressBar value={p.pct} tone={`linear-gradient(90deg, ${acc.from}, ${acc.to})`} className="h-2" label={`Progresso de ${b.title}`} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function UpcomingList({ days = 7 }: { days?: number }) {
  const state = useAppState();
  const { openTask, actions, openNewTask } = useStore();
  const toast = useToast();
  const tasks = upcomingTasks(state, days);
  const t0 = today();

  const groups: { key: string; title: string; items: typeof tasks }[] = [];
  for (const t of tasks) {
    const d = diffDays(t.dueDate!, t0);
    const key = d < 0 ? "overdue" : t.dueDate!;
    const title = d < 0 ? "Atrasadas" : d <= 1 ? dueLabel(t.dueDate!) : `${formatWeekday(t.dueDate!)}, ${formatShort(t.dueDate!)}`;
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, title, items: [] };
      groups.push(g);
    }
    g.items.push(t);
  }

  return (
    <div className="glass h-full rounded-3xl p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[15px] font-semibold text-white">Próximos dias</h2>
        <Link href="/calendar" className="text-xs font-semibold text-cyan-200 hover:underline">
          Abrir calendário
        </Link>
      </div>
      {groups.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Agenda livre"
          description="Nenhum prazo nos próximos dias. Que tal planejar a próxima entrega?"
          action={
            <button className="btn-secondary h-9" onClick={() => openNewTask({})}>
              Nova tarefa
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.key}>
              <p className={cn("mb-1.5 text-xs font-semibold first-letter:uppercase", g.key === "overdue" ? "text-rose-300" : "text-slate-400")}>
                {g.title} · {g.items.length}
              </p>
              <ul className="space-y-1">
                {g.items.map((t) => (
                  <li key={t.id} className="group flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-white/[0.05]">
                    <button
                      className="grid size-6 shrink-0 place-items-center rounded-full text-slate-400 transition hover:text-emerald-300"
                      onClick={() => {
                        actions.toggleDone(t.id);
                        toast.success("Tarefa concluída", t.title);
                      }}
                      aria-label={`Concluir ${t.title}`}
                    >
                      <Circle className="size-5" />
                    </button>
                    <button className="min-w-0 flex-1 text-left" onClick={() => openTask(t.id)}>
                      <span className="block truncate text-sm font-medium text-slate-100 group-hover:text-white">{t.title}</span>
                      <span className="flex items-center gap-2 text-xs text-slate-400">
                        <span className={cn("size-1.5 rounded-full", priorityStyle[t.priority].dot)} aria-hidden />
                        {state.boards[t.boardId]?.title}
                      </span>
                    </button>
                    <AvatarStack members={t.assigneeIds.map((m) => state.members[m])} max={2} size="xs" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActivityItem({ a }: { a: Activity }) {
  const state = useAppState();
  const { openTask } = useStore();
  const m = state.members[a.memberId];
  const canOpen = a.taskId && state.tasks[a.taskId];
  return (
    <li className="flex gap-3">
      <Avatar member={m} size="sm" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="text-slate-300">
          <span className="font-semibold text-white">{m?.name.split(" ")[0] ?? "Alguém"}</span>{" "}
          {canOpen ? (
            <button className="text-left hover:text-white hover:underline" onClick={() => openTask(a.taskId!)}>
              {a.text}
            </button>
          ) : (
            a.text
          )}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {relativeTime(a.createdAt)}
          {a.boardId && state.boards[a.boardId] ? ` · ${state.boards[a.boardId].title}` : ""}
        </p>
      </div>
    </li>
  );
}

export function RecentActivity({ limit = 6 }: { limit?: number }) {
  const state = useAppState();
  const items = state.activity.slice(0, limit);
  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[15px] font-semibold text-white">Atividade recente</h2>
        <Link href="/activity" className="text-xs font-semibold text-cyan-200 hover:underline">
          Ver tudo
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">As ações da equipe aparecerão aqui.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((a) => (
            <ActivityItem key={a.id} a={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function FavoritesQuick() {
  const state = useAppState();
  const { setCreateBoardOpen } = useStore();
  const favs = state.boardOrder.map((id) => state.boards[id]).filter((b) => b?.favorite);
  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[15px] font-semibold text-white">Quadros favoritos</h2>
        <Star className="size-4 text-amber-300" aria-hidden />
      </div>
      {favs.length === 0 ? (
        <EmptyState
          className="py-4"
          icon={Star}
          title="Sem favoritos"
          description="Use a estrela de um quadro para acessá-lo rápido."
          action={
            <Link href="/boards" className="btn-secondary h-9">
              Ver quadros
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {favs.map((b) => {
            const p = boardProgress(state, b.id);
            const acc = accentStyle[b.accent];
            const open = taskStats(state, b.id).open;
            return (
              <li key={b.id} className="group relative">
                <Link
                  href={`/boards/${b.id}`}
                  className="flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 transition hover:border-white/15 hover:bg-white/[0.06]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: `linear-gradient(135deg, ${acc.from}, ${acc.to})` }}>
                    <FolderKanban className="size-[18px] text-white" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{b.title}</span>
                    <span className="block text-xs text-slate-400">
                      {open} abertas · {p.pct}% concluído
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <button className="btn-ghost mt-3 h-9 w-full text-[13px]" onClick={() => setCreateBoardOpen(true)}>
        + Criar quadro
      </button>
    </div>
  );
}

export function TodayFocus() {
  const state = useAppState();
  const t0 = today();
  const mine = Object.values(state.tasks).filter(
    (t) => !t.archived && state.boards[t.boardId] && t.assigneeIds.includes(state.currentUserId) && !isDone(state, t),
  );
  const dueToday = mine.filter((t) => t.dueDate === t0).length;
  const overdue = mine.filter((t) => t.dueDate && t.dueDate < t0).length;
  if (dueToday === 0 && overdue === 0) return <>Nenhum prazo seu para hoje. Ótimo momento para tirar ideias do papel.</>;
  return (
    <>
      Você tem <strong className="text-white">{dueToday} {dueToday === 1 ? "entrega" : "entregas"} hoje</strong>
      {overdue > 0 && (
        <>
          {" "}e <strong className="text-rose-200">{overdue} {overdue === 1 ? "atrasada" : "atrasadas"}</strong>
        </>
      )}
      .
    </>
  );
}
