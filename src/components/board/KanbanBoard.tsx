"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  getFirstCollision,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Ellipsis,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { BoardFilters, Column, SortMode, Task } from "@/lib/types";
import { matchesFilters, sortTasks } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";
import { MenuItem, MenuSeparator, Popover } from "@/components/ui/Popover";
import { ConfirmDialog } from "@/components/ui/Modal";

const COL = "col:";

export function KanbanBoard({ boardId, filters, sort }: { boardId: string; filters: BoardFilters; sort: SortMode }) {
  const state = useAppState();
  const { actions } = useStore();
  const toast = useToast();
  const board = state.boards[boardId];

  // ids visíveis por coluna (após filtros/ordenação)
  const visible = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const cid of board.columnIds) {
      const col = state.columns[cid];
      const tasks = col.taskIds.map((id) => state.tasks[id]).filter((t): t is Task => !!t && matchesFilters(t, filters, state));
      out[cid] = sortTasks(tasks, sort).map((t) => t.id);
    }
    return out;
  }, [board.columnIds, state, filters, sort]);

  const [containers, setContainers] = useState(visible);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeType, setActiveType] = useState<"task" | "column" | null>(null);
  const dragOrigin = useRef<string | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);

  useEffect(() => {
    if (!activeId) setContainers(visible);
  }, [visible, activeId]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  const findContainer = (id: UniqueIdentifier) => {
    const s = String(id);
    if (s.startsWith(COL)) return s.slice(COL.length);
    return Object.keys(containers).find((c) => containers[c].includes(s));
  };

  const collision: CollisionDetection = (args) => {
    if (activeType === "column") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => String(c.id).startsWith(COL)),
      });
    }
    const pointer = pointerWithin(args);
    const hits = pointer.length > 0 ? pointer : rectIntersection(args);
    let overId = getFirstCollision(hits, "id");
    if (overId != null) {
      if (String(overId).startsWith(COL)) {
        const items = containers[String(overId).slice(COL.length)] ?? [];
        if (items.length > 0) {
          const inner = closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter((c) => items.includes(String(c.id))),
          });
          overId = inner[0]?.id ?? overId;
        }
      }
      lastOverId.current = overId;
      return [{ id: overId }];
    }
    return lastOverId.current ? [{ id: lastOverId.current }] : [];
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id);
    const isCol = String(active.id).startsWith(COL);
    setActiveType(isCol ? "column" : "task");
    dragOrigin.current = isCol ? null : findContainer(active.id) ?? null;
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (activeType !== "task" || !over) return;
    const from = findContainer(active.id);
    const to = findContainer(over.id);
    if (!from || !to || from === to) return;
    setContainers((prev) => {
      const fromItems = prev[from].filter((x) => x !== active.id);
      const toItems = [...prev[to]];
      const overIndex = toItems.indexOf(String(over.id));
      const isBelow =
        over.rect && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
      const index = overIndex >= 0 ? overIndex + (isBelow ? 1 : 0) : toItems.length;
      toItems.splice(index, 0, String(active.id));
      return { ...prev, [from]: fromItems, [to]: toItems };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const type = activeType;
    setActiveId(null);
    setActiveType(null);
    if (!over) {
      setContainers(visible);
      return;
    }
    if (type === "column") {
      const from = board.columnIds.indexOf(String(active.id).slice(COL.length));
      const to = board.columnIds.indexOf(findContainer(over.id) ?? "");
      if (from >= 0 && to >= 0 && from !== to) actions.moveColumn(boardId, from, to);
      return;
    }
    const container = findContainer(active.id);
    if (!container) return;
    let list = containers[container];
    const overContainer = findContainer(over.id);
    if (overContainer === container && !String(over.id).startsWith(COL)) {
      const oldIndex = list.indexOf(String(active.id));
      const newIndex = list.indexOf(String(over.id));
      if (oldIndex !== newIndex && newIndex >= 0) list = arrayMove(list, oldIndex, newIndex);
    }
    const sameColumn = dragOrigin.current === container;
    if (sameColumn && sort !== "manual") {
      setContainers(visible);
      toast.info("Ordenação automática ativa", "Mude para “Ordem manual” para reorganizar dentro da coluna.");
      return;
    }
    const idx = list.indexOf(String(active.id));
    const before = list[idx + 1] ?? null;
    actions.moveTask(String(active.id), container, before);
    if (!sameColumn) {
      const col = state.columns[container];
      toast.success(col?.isDone ? "Tarefa concluída" : `Movida para ${col?.title}`);
    }
  };

  const activeTask = activeType === "task" && activeId ? state.tasks[String(activeId)] : undefined;
  const activeColumn = activeType === "column" && activeId ? state.columns[String(activeId).slice(COL.length)] : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setActiveType(null);
        setContainers(visible);
      }}
      accessibility={{
        screenReaderInstructions: {
          draggable: "Pressione espaço para pegar. Use as setas para mover e espaço novamente para soltar. Esc cancela.",
        },
        announcements: {
          onDragStart: () => "Item selecionado.",
          onDragOver: ({ over }) => (over ? "Movendo sobre nova posição." : "Fora de uma área válida."),
          onDragEnd: ({ over }) => (over ? "Item solto." : "Movimento cancelado."),
          onDragCancel: () => "Movimento cancelado.",
        },
      }}
    >
      <div className="scroll-thin flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pt-1 pb-6 sm:snap-none sm:px-6 lg:px-8">
        <SortableContext items={board.columnIds.map((c) => COL + c)} strategy={horizontalListSortingStrategy}>
          {board.columnIds.map((cid, i) => (
            <KanbanColumn
              key={cid}
              column={state.columns[cid]}
              taskIds={containers[cid] ?? []}
              index={i}
              total={board.columnIds.length}
              hiddenCount={state.columns[cid].taskIds.length - (visible[cid]?.length ?? 0)}
              activeTaskId={activeType === "task" ? String(activeId) : null}
            />
          ))}
        </SortableContext>
        <AddColumn boardId={boardId} />
      </div>
      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.35" } } }) }}>
        {activeTask ? (
          <div className="w-[min(300px,82vw)]">
            <TaskCard task={activeTask} state={state} isDone={!!state.columns[activeTask.columnId]?.isDone} overlay />
          </div>
        ) : activeColumn ? (
          <div className="glass-col w-[300px] rotate-1 rounded-3xl p-4 opacity-90">
            <p className="font-display font-semibold text-white">{activeColumn.title}</p>
            <p className="text-xs text-slate-400">{activeColumn.taskIds.length} tarefas</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/* --------------------------------- coluna --------------------------------- */

function KanbanColumn({
  column,
  taskIds,
  index,
  total,
  hiddenCount,
  activeTaskId,
}: {
  column: Column;
  taskIds: string[];
  index: number;
  total: number;
  hiddenCount: number;
  activeTaskId: string | null;
}) {
  const state = useAppState();
  const { actions, openTask } = useStore();
  const toast = useToast();
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging, setActivatorNodeRef } = useSortable({
    id: COL + column.id,
    data: { type: "column" },
  });

  const commitRename = () => {
    const v = title.trim();
    if (!v) {
      toast.error("O nome da coluna não pode ficar vazio");
      setTitle(column.title);
    } else if (v !== column.title) {
      actions.renameColumn(column.id, v);
      toast.success("Coluna renomeada");
    }
    setRenaming(false);
  };

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-label={`Coluna ${column.title}`}
      className={cn(
        "glass-col flex max-h-[calc(100dvh-15rem)] w-[85vw] shrink-0 snap-start flex-col rounded-3xl sm:w-[300px]",
        isDragging && "opacity-40",
      )}
    >
      <header className="flex items-center gap-1.5 px-3 pt-3 pb-2">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-slate-200 active:cursor-grabbing"
          aria-label={`Reordenar coluna ${column.title}`}
          aria-roledescription="coluna arrastável"
        >
          <GripVertical className="size-4" />
        </button>
        {renaming ? (
          <input
            autoFocus
            className="field h-8 px-2 py-1 font-semibold"
            value={title}
            maxLength={40}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setTitle(column.title);
                setRenaming(false);
              }
            }}
            aria-label="Nome da coluna"
          />
        ) : (
          <button
            className="min-w-0 flex-1 truncate rounded-lg px-1 text-left font-display text-[15px] font-semibold text-white hover:bg-white/[0.04]"
            onClick={() => {
              setTitle(column.title);
              setRenaming(true);
            }}
            title="Clique para renomear"
          >
            {column.title}
          </button>
        )}
        {column.isDone && <CheckCircle2 className="size-4 shrink-0 text-emerald-300" aria-label="Coluna de conclusão" />}
        <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs font-semibold text-slate-300">{taskIds.length}</span>
        <button className="icon-btn size-8" onClick={() => setAdding(true)} aria-label={`Adicionar tarefa em ${column.title}`}>
          <Plus className="size-4" />
        </button>
        <Popover
          align="end"
          trigger={(p) => (
            <button {...p} onClick={p.toggle} className="icon-btn size-8" aria-label={`Opções da coluna ${column.title}`}>
              <Ellipsis className="size-4" />
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuItem icon={Plus} onClick={() => { close(); setAdding(true); }}>
                Adicionar tarefa
              </MenuItem>
              <MenuItem icon={Pencil} onClick={() => { close(); setTitle(column.title); setRenaming(true); }}>
                Renomear
              </MenuItem>
              <MenuItem
                icon={CheckCircle2}
                onClick={() => {
                  close();
                  actions.setColumnDone(column.id, !column.isDone);
                  toast.success(column.isDone ? "Coluna desmarcada como conclusão" : "Tarefas aqui contam como concluídas");
                }}
              >
                {column.isDone ? "Desmarcar como conclusão" : "Marcar como coluna de conclusão"}
              </MenuItem>
              <MenuSeparator />
              <MenuItem icon={ArrowLeft} onClick={() => { close(); if (index > 0) actions.moveColumn(column.boardId, index, index - 1); }}>
                Mover para a esquerda
              </MenuItem>
              <MenuItem icon={ArrowRight} onClick={() => { close(); if (index < total - 1) actions.moveColumn(column.boardId, index, index + 1); }}>
                Mover para a direita
              </MenuItem>
              <MenuSeparator />
              <MenuItem icon={Trash2} danger onClick={() => { close(); setConfirmDelete(true); }}>
                Excluir coluna
              </MenuItem>
            </>
          )}
        </Popover>
      </header>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 pb-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <ul className="flex min-h-12 flex-col gap-2.5 pb-1">
            {taskIds.map((id) => {
              const t = state.tasks[id];
              if (!t) return null;
              return <SortableCard key={id} task={t} isDone={!!column.isDone} onOpen={() => openTask(id)} hidden={activeTaskId === id} />;
            })}
          </ul>
        </SortableContext>
        {taskIds.length === 0 && !adding && (
          <div className="rounded-2xl border border-dashed border-white/10 px-3 py-6 text-center text-[13px] text-slate-400">
            {hiddenCount > 0 ? `${hiddenCount} tarefa(s) ocultas pelos filtros` : "Solte cartões aqui ou crie uma tarefa"}
          </div>
        )}
        {adding && <QuickAdd column={column} onDone={() => setAdding(false)} />}
      </div>

      {!adding && (
        <div className="px-3 pb-3">
          <button
            className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-4" /> Adicionar tarefa
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Excluir a coluna “${column.title}”?`}
        description={
          column.taskIds.length
            ? `As ${column.taskIds.length} tarefa(s) desta coluna também serão excluídas. Essa ação não pode ser desfeita.`
            : "A coluna está vazia e será removida do quadro."
        }
        onConfirm={() => {
          actions.deleteColumn(column.id);
          toast.success("Coluna excluída");
        }}
      />
    </section>
  );
}

function SortableCard({ task, isDone, onOpen, hidden }: { task: Task; isDone: boolean; onOpen: () => void; hidden: boolean }) {
  const state = useAppState();
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task" },
  });
  return (
    <li>
      <TaskCard
        ref={setNodeRef}
        task={task}
        state={state}
        isDone={isDone}
        dragging={isDragging || hidden}
        onOpen={onOpen}
        style={{ transform: CSS.Translate.toString(transform), transition }}
        {...attributes}
        {...listeners}
        aria-roledescription="cartão arrastável"
      />
    </li>
  );
}

/* ------------------------------- criação rápida ------------------------------- */

function QuickAdd({ column, onDone }: { column: Column; onDone: () => void }) {
  const { actions } = useStore();
  const toast = useToast();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const v = value.trim();
    if (v.length < 2) {
      setError("Digite pelo menos 2 caracteres");
      return;
    }
    actions.createTask(column.boardId, column.id, { title: v });
    setValue("");
    setError("");
    toast.success("Tarefa criada", v);
  };

  return (
    <div className="glass-card mt-1 rounded-2xl p-2.5">
      <label htmlFor={`qa-${column.id}`} className="sr-only">
        Título da nova tarefa
      </label>
      <textarea
        id={`qa-${column.id}`}
        autoFocus
        rows={2}
        className="w-full resize-none bg-transparent px-1 text-sm text-white outline-none placeholder:text-slate-400"
        placeholder="O que precisa ser feito?"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") {
            e.stopPropagation();
            onDone();
          }
        }}
      />
      {error && <p className="px-1 text-xs text-rose-300">{error}</p>}
      <div className="mt-1.5 flex items-center gap-1.5">
        <button className="btn-primary h-8 px-3 text-[13px]" onClick={submit}>
          Adicionar
        </button>
        <button className="icon-btn size-8" onClick={onDone} aria-label="Cancelar">
          <X className="size-4" />
        </button>
        <span className="ml-auto text-[11px] text-slate-500">Enter para salvar</span>
      </div>
    </div>
  );
}

function AddColumn({ boardId }: { boardId: string }) {
  const { actions } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const submit = () => {
    const v = value.trim();
    if (!v) {
      toast.error("Dê um nome para a coluna");
      return;
    }
    actions.createColumn(boardId, v);
    toast.success("Coluna criada", v);
    setValue("");
    setOpen(false);
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-14 w-[85vw] shrink-0 snap-start items-center justify-center gap-2 rounded-3xl border border-dashed border-white/15 text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:bg-white/[0.04] hover:text-white sm:w-[280px]"
      >
        <Plus className="size-4" /> Nova coluna
      </button>
    );

  return (
    <div className="glass-col w-[85vw] shrink-0 snap-start rounded-3xl p-3 sm:w-[280px]">
      <label htmlFor="new-col" className="sr-only">
        Nome da nova coluna
      </label>
      <input
        id="new-col"
        autoFocus
        className="field"
        placeholder="Nome da coluna"
        value={value}
        maxLength={40}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <div className="mt-2 flex gap-2">
        <button className="btn-primary h-9" onClick={submit}>
          Criar coluna
        </button>
        <button className="btn-ghost h-9" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
