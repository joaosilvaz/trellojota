"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Circle, ListChecks, MessageSquare, PanelRight, Plus } from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { BoardFilters, Priority, SortMode, Task } from "@/lib/types";
import { matchesFilters, sortTasks } from "@/lib/selectors";
import { PRIORITIES, cn, dueState, labelStyle, priorityStyle } from "@/lib/utils";
import { AvatarStack } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Chips";

export function ListView({ boardId, filters, sort }: { boardId: string; filters: BoardFilters; sort: SortMode }) {
  const state = useAppState();
  const { openNewTask } = useStore();
  const board = state.boards[boardId];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = board.columnIds.map((cid) => {
    const col = state.columns[cid];
    const tasks = col.taskIds.map((id) => state.tasks[id]).filter((t): t is Task => !!t && matchesFilters(t, filters, state));
    return { col, tasks: sortTasks(tasks, sort) };
  });
  const total = groups.reduce((s, g) => s + g.tasks.length, 0);

  if (total === 0)
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="glass rounded-3xl">
          <EmptyState
            icon={ListChecks}
            title={filters.showArchived ? "Nenhuma tarefa arquivada" : "Nenhuma tarefa encontrada"}
            description="Ajuste os filtros ou crie uma nova tarefa para este quadro."
            action={
              <button className="btn-primary h-9" onClick={() => openNewTask({ boardId })}>
                <Plus className="size-4" /> Nova tarefa
              </button>
            }
          />
        </div>
      </div>
    );

  return (
    <div className="space-y-4 px-4 pb-8 sm:px-6 lg:px-8">
      <div className="hidden grid-cols-[minmax(0,1fr)_150px_130px_110px_150px_40px] gap-3 px-5 text-xs font-semibold tracking-wide text-neutral-400 uppercase lg:grid">
        <span>Tarefa</span>
        <span>Status</span>
        <span>Prioridade</span>
        <span>Responsáveis</span>
        <span>Prazo</span>
        <span className="sr-only">Abrir</span>
      </div>
      {groups.map(({ col, tasks }) => (
        <section key={col.id} className="glass overflow-hidden rounded-3xl" aria-label={col.title}>
          <button
            className="flex w-full items-center gap-2 px-5 py-3.5 text-left"
            onClick={() => setCollapsed((c) => ({ ...c, [col.id]: !c[col.id] }))}
            aria-expanded={!collapsed[col.id]}
          >
            <ChevronDown className={cn("size-4 text-neutral-400 transition", collapsed[col.id] && "-rotate-90")} />
            <span className="font-display text-[15px] font-semibold text-white">{col.title}</span>
            {col.isDone && <CheckCircle2 className="size-4 text-emerald-300" aria-hidden />}
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs font-semibold text-neutral-300">{tasks.length}</span>
          </button>
          {!collapsed[col.id] && (
            <>
              <ul className="divide-y divide-white/[0.05] border-t border-white/[0.05]">
                {tasks.map((t) => (
                  <ListRow key={t.id} task={t} />
                ))}
              </ul>
              <button
                className="flex h-11 w-full items-center gap-2 border-t border-white/[0.05] px-5 text-sm font-semibold text-neutral-400 transition hover:bg-white/[0.04] hover:text-white"
                onClick={() => openNewTask({ boardId, columnId: col.id })}
              >
                <Plus className="size-4" /> Adicionar tarefa em {col.title}
              </button>
            </>
          )}
        </section>
      ))}
    </div>
  );
}

function ListRow({ task }: { task: Task }) {
  const state = useAppState();
  const { actions, openTask } = useStore();
  const toast = useToast();
  const board = state.boards[task.boardId];
  const done = !!state.columns[task.columnId]?.isDone;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const ds = dueState(task, done);
  const checkDone = task.checklist.filter((c) => c.done).length;

  const commit = () => {
    const v = title.trim();
    if (v.length < 2) {
      toast.error("Título muito curto");
      setTitle(task.title);
    } else if (v !== task.title) {
      actions.updateTask(task.id, { title: v });
      toast.success("Título atualizado");
    }
    setEditing(false);
  };

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-5 py-3 transition hover:bg-white/[0.03] lg:grid-cols-[minmax(0,1fr)_150px_130px_110px_150px_40px]">
      <div className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
        <button
          onClick={() => {
            actions.toggleDone(task.id);
            toast.success(done ? "Tarefa reaberta" : "Tarefa concluída");
          }}
          aria-label={done ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
          className={cn("shrink-0 transition", done ? "text-emerald-300" : "text-neutral-500 hover:text-emerald-300")}
        >
          {done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
        </button>
        <span className={cn("h-6 w-[3px] shrink-0 rounded-full", priorityStyle[task.priority].dot)} aria-hidden />
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              className="field h-9 py-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setTitle(task.title);
                  setEditing(false);
                }
              }}
              aria-label="Editar título"
            />
          ) : (
            <button
              className={cn("block max-w-full truncate text-left text-sm font-semibold", done ? "text-neutral-400 line-through" : "text-white hover:text-brand-100")}
              onClick={() => {
                setTitle(task.title);
                setEditing(true);
              }}
              title="Clique para editar o título"
            >
              {task.title}
            </button>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
            {task.labelIds.map((l) => {
              const lb = state.labels[l];
              return lb ? (
                <span key={l} className={cn("chip px-1.5 py-0 text-[11px]", labelStyle[lb.color].chip)}>
                  {lb.name}
                </span>
              ) : null;
            })}
            {task.checklist.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <ListChecks className="size-3.5" /> {checkDone}/{task.checklist.length}
              </span>
            )}
            {task.comments.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-3.5" /> {task.comments.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <button className="icon-btn size-9 lg:hidden" onClick={() => openTask(task.id)} aria-label={`Abrir ${task.title}`}>
        <PanelRight className="size-4" />
      </button>

      <div className="col-span-3 flex flex-wrap items-center gap-2 lg:contents">
        <select
          className="field h-9 w-auto min-w-32 py-1 text-[13px] lg:w-full"
          value={task.columnId}
          onChange={(e) => {
            actions.moveTask(task.id, e.target.value, null);
            toast.success("Status atualizado");
          }}
          aria-label="Status"
        >
          {board.columnIds.map((c) => (
            <option key={c} value={c}>
              {state.columns[c].title}
            </option>
          ))}
        </select>
        <select
          className={cn("field h-9 w-auto py-1 text-[13px] lg:w-full", priorityStyle[task.priority].chip.split(" ").find((c) => c.startsWith("text-")))}
          value={task.priority}
          onChange={(e) => actions.updateTask(task.id, { priority: e.target.value as Priority })}
          aria-label="Prioridade"
        >
          {PRIORITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="flex min-w-0 items-center">
          {task.assigneeIds.length ? (
            <AvatarStack members={task.assigneeIds.map((m) => state.members[m])} max={3} size="sm" />
          ) : (
            <span className="text-xs text-neutral-500">—</span>
          )}
        </div>
        <input
          type="date"
          className={cn(
            "field h-9 w-auto py-1 text-[13px] lg:w-full",
            ds === "overdue" && "border-rose-400/40 text-rose-200",
            ds === "soon" && "text-amber-200",
          )}
          value={task.dueDate ?? ""}
          min={task.startDate}
          onChange={(e) => {
            const v = e.target.value || undefined;
            if (v && task.startDate && v < task.startDate) {
              toast.error("O prazo não pode ser anterior ao início");
              return;
            }
            actions.updateTask(task.id, { dueDate: v });
          }}
          aria-label="Prazo"
        />
        <button className="icon-btn hidden size-9 lg:inline-flex" onClick={() => openTask(task.id)} aria-label={`Abrir ${task.title}`}>
          <PanelRight className="size-4" />
        </button>
      </div>
    </li>
  );
}
