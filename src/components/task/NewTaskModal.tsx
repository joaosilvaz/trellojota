"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppState, useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { Priority } from "@/lib/types";
import { PRIORITIES, cn, labelStyle } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";

export function NewTaskModal() {
  const state = useAppState();
  const { newTaskTarget, openNewTask, actions, openTask } = useStore();
  const toast = useToast();
  const open = newTaskTarget !== null;

  const [boardId, setBoardId] = useState("");
  const [columnId, setColumnId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!newTaskTarget) return;
    const b = newTaskTarget.boardId && state.boards[newTaskTarget.boardId] ? newTaskTarget.boardId : state.boardOrder[0] ?? "";
    setBoardId(b);
    const firstCol = state.boards[b]?.columnIds.find((c) => !state.columns[c]?.isDone) ?? state.boards[b]?.columnIds[0] ?? "";
    setColumnId(newTaskTarget.columnId ?? firstCol);
    setTitle("");
    setDescription("");
    setPriority("media");
    setStartDate("");
    setDueDate(newTaskTarget.dueDate ?? "");
    setAssigneeIds([state.currentUserId]);
    setLabelIds([]);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTaskTarget]);

  const board = state.boards[boardId];
  const columns = useMemo(() => board?.columnIds.map((c) => state.columns[c]).filter(Boolean) ?? [], [board, state.columns]);

  const close = () => openNewTask(null);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const errs: Record<string, string> = {};
    if (!board) errs.board = "Crie um quadro antes de adicionar tarefas.";
    if (!columnId) errs.column = "Escolha uma coluna.";
    if (title.trim().length < 2) errs.title = "O título precisa ter pelo menos 2 caracteres.";
    if (startDate && dueDate && dueDate < startDate) errs.due = "O prazo não pode ser anterior ao início.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const id = actions.createTask(boardId, columnId, {
      title,
      description,
      priority,
      startDate,
      dueDate,
      assigneeIds,
      labelIds,
    });
    close();
    toast.toast({
      kind: "success",
      title: "Tarefa criada",
      description: `Adicionada em ${state.columns[columnId]?.title} · ${board.title}`,
      action: { label: "Abrir", onClick: () => openTask(id) },
    });
  };

  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  return (
    <Modal
      open={open}
      onClose={close}
      title="Nova tarefa"
      description="Preencha o essencial agora e detalhe depois."
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={close}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={() => submit()}>
            Criar tarefa
          </button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={submit} noValidate>
        <div>
          <label htmlFor="nt-title" className="mb-1.5 block text-sm font-semibold text-slate-200">
            Título
          </label>
          <input
            id="nt-title"
            data-autofocus
            className={cn("field", errors.title && "border-rose-400/60")}
            placeholder="Ex.: Revisar textos da landing page"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!errors.title}
          />
          {errors.title && <p className="mt-1.5 text-[13px] text-rose-300">{errors.title}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nt-board" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Quadro
            </label>
            <select
              id="nt-board"
              className="field"
              value={boardId}
              onChange={(e) => {
                setBoardId(e.target.value);
                const b = state.boards[e.target.value];
                setColumnId(b?.columnIds.find((c) => !state.columns[c]?.isDone) ?? b?.columnIds[0] ?? "");
              }}
            >
              {state.boardOrder.map((id) => (
                <option key={id} value={id}>
                  {state.boards[id].title}
                </option>
              ))}
            </select>
            {errors.board && <p className="mt-1.5 text-[13px] text-rose-300">{errors.board}</p>}
          </div>
          <div>
            <label htmlFor="nt-col" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Coluna
            </label>
            <select id="nt-col" className="field" value={columnId} onChange={(e) => setColumnId(e.target.value)}>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {errors.column && <p className="mt-1.5 text-[13px] text-rose-300">{errors.column}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="nt-desc" className="mb-1.5 block text-sm font-semibold text-slate-200">
            Descrição <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea
            id="nt-desc"
            className="field min-h-20 resize-none"
            placeholder="Contexto, links ou critérios de pronto"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="nt-pri" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Prioridade
            </label>
            <select id="nt-pri" className="field" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nt-start" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Início
            </label>
            <input id="nt-start" type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="nt-due" className="mb-1.5 block text-sm font-semibold text-slate-200">
              Prazo
            </label>
            <input
              id="nt-due"
              type="date"
              className={cn("field", errors.due && "border-rose-400/60")}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-invalid={!!errors.due}
            />
          </div>
        </div>
        {errors.due && <p className="-mt-3 text-[13px] text-rose-300">{errors.due}</p>}

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-200">Responsáveis</legend>
          <div className="flex flex-wrap gap-2">
            {Object.values(state.members).map((m) => {
              const on = assigneeIds.includes(m.id);
              return (
                <button
                  type="button"
                  key={m.id}
                  aria-pressed={on}
                  onClick={() => setAssigneeIds(toggle(assigneeIds, m.id))}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-full border pr-3 pl-1 text-sm transition",
                    on ? "border-electric-400/60 bg-electric-500/20 text-white" : "border-white/10 text-slate-300 hover:border-white/25",
                  )}
                >
                  <Avatar member={m} size="xs" title={false} />
                  {m.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-200">Etiquetas</legend>
          <div className="flex flex-wrap gap-2">
            {Object.values(state.labels).map((l) => {
              const on = labelIds.includes(l.id);
              return (
                <button
                  type="button"
                  key={l.id}
                  aria-pressed={on}
                  onClick={() => setLabelIds(toggle(labelIds, l.id))}
                  className={cn("chip px-3 py-1.5 text-[13px] transition", on ? labelStyle[l.color].chip : "text-slate-400 ring-white/10 hover:text-slate-200")}
                >
                  {l.name}
                </button>
              );
            })}
          </div>
        </fieldset>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
