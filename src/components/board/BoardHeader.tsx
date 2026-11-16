"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  Columns3,
  Ellipsis,
  Filter,
  FolderKanban,
  PanelRight,
  Pencil,
  Plus,
  Rows3,
  Search,
  Star,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { BoardFilters, Priority, SortMode, ViewMode } from "@/lib/types";
import { emptyFilters, hasActiveFilters } from "@/lib/selectors";
import { BOARD_ACCENTS, PRIORITIES, accentStyle, cn, labelStyle, priorityStyle } from "@/lib/utils";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { MenuItem, MenuSeparator, Popover } from "@/components/ui/Popover";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";

const SORTS: { id: SortMode; name: string }[] = [
  { id: "manual", name: "Ordem manual" },
  { id: "due", name: "Prazo mais próximo" },
  { id: "priority", name: "Maior prioridade" },
  { id: "title", name: "Título (A–Z)" },
  { id: "recent", name: "Mais recentes" },
];

const VIEWS: { id: ViewMode; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "board", name: "Quadro", icon: Columns3 },
  { id: "list", name: "Lista", icon: Rows3 },
  { id: "calendar", name: "Calendário", icon: CalendarDays },
];

export function BoardHeader({
  boardId,
  view,
  onView,
  filters,
  onFilters,
  sort,
  onSort,
  panelOpen,
  onTogglePanel,
  resultCount,
}: {
  boardId: string;
  view: ViewMode;
  onView: (v: ViewMode) => void;
  filters: BoardFilters;
  onFilters: (f: BoardFilters) => void;
  sort: SortMode;
  onSort: (s: SortMode) => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
  resultCount: number;
}) {
  const state = useAppState();
  const { actions, openNewTask } = useStore();
  const toast = useToast();
  const router = useRouter();
  const board = state.boards[boardId];
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [desc, setDesc] = useState(board.description);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const acc = accentStyle[board.accent];
  const filterCount = filters.assigneeIds.length + filters.labelIds.length + filters.priorities.length + (filters.showArchived ? 1 : 0);
  const archivedCount = Object.values(state.tasks).filter((t) => t.boardId === boardId && t.archived).length;

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const commitTitle = () => {
    const v = title.trim();
    if (v.length < 2) {
      toast.error("Nome inválido", "Use pelo menos 2 caracteres.");
      setTitle(board.title);
    } else if (v !== board.title) {
      actions.updateBoard(boardId, { title: v });
      toast.success("Quadro renomeado");
    }
    setEditingTitle(false);
  };

  return (
    <div className="px-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start gap-4">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-2xl shadow-[0_10px_30px_-10px_rgba(217,119,87,0.6)]"
          style={{ background: `linear-gradient(135deg, ${acc.from}, ${acc.to})` }}
          aria-hidden
        >
          <FolderKanban className="size-5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {editingTitle ? (
              <input
                autoFocus
                className="field font-display h-11 max-w-lg text-2xl font-semibold"
                value={title}
                maxLength={60}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitle();
                  if (e.key === "Escape") {
                    setTitle(board.title);
                    setEditingTitle(false);
                  }
                }}
                aria-label="Nome do quadro"
              />
            ) : (
              <h1>
                <button
                  className="font-display truncate rounded-lg px-1 -mx-1 text-left text-2xl font-semibold tracking-tight text-white hover:bg-white/[0.05] sm:text-[28px]"
                  onClick={() => {
                    setTitle(board.title);
                    setEditingTitle(true);
                  }}
                  title="Clique para renomear"
                >
                  {board.title}
                </button>
              </h1>
            )}
            <button
              className={cn("icon-btn size-9", board.favorite && "text-amber-300 hover:text-amber-200")}
              onClick={() => {
                actions.toggleFavorite(boardId);
                toast.success(board.favorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
              }}
              aria-pressed={board.favorite}
              aria-label={board.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Star className={cn("size-5", board.favorite && "fill-current")} />
            </button>
            <Popover
              trigger={(p) => (
                <button {...p} onClick={p.toggle} className="icon-btn size-9" aria-label="Opções do quadro">
                  <Ellipsis className="size-5" />
                </button>
              )}
              panelClassName="w-64"
            >
              {(close) => (
                <>
                  <MenuItem icon={Pencil} onClick={() => { close(); setTitle(board.title); setEditingTitle(true); }}>
                    Renomear quadro
                  </MenuItem>
                  <MenuItem icon={Pencil} onClick={() => { close(); setDesc(board.description); setEditingDesc(true); }}>
                    Editar descrição
                  </MenuItem>
                  <MenuItem icon={UserPlus} onClick={() => { close(); setMembersOpen(true); }}>
                    Gerenciar membros
                  </MenuItem>
                  <div className="px-3 py-2">
                    <p className="mb-2 text-xs font-semibold text-neutral-400">Cor do quadro</p>
                    <div className="flex gap-1.5">
                      {BOARD_ACCENTS.map((a) => (
                        <button
                          key={a}
                          onClick={() => actions.updateBoard(boardId, { accent: a })}
                          aria-label={`Cor ${a}`}
                          aria-pressed={board.accent === a}
                          className={cn("size-7 rounded-lg ring-2", board.accent === a ? "ring-white" : "ring-transparent")}
                          style={{ background: `linear-gradient(135deg, ${accentStyle[a].from}, ${accentStyle[a].to})` }}
                        />
                      ))}
                    </div>
                  </div>
                  <MenuSeparator />
                  <MenuItem icon={Trash2} danger onClick={() => { close(); setConfirmDelete(true); }}>
                    Excluir quadro
                  </MenuItem>
                </>
              )}
            </Popover>
          </div>
          {editingDesc ? (
            <div className="mt-2 flex max-w-2xl gap-2">
              <input
                autoFocus
                className="field h-10"
                value={desc}
                maxLength={160}
                onChange={(e) => setDesc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    actions.updateBoard(boardId, { description: desc.trim() });
                    setEditingDesc(false);
                    toast.success("Descrição atualizada");
                  }
                  if (e.key === "Escape") setEditingDesc(false);
                }}
                aria-label="Descrição do quadro"
              />
              <button
                className="btn-primary h-10"
                onClick={() => {
                  actions.updateBoard(boardId, { description: desc.trim() });
                  setEditingDesc(false);
                  toast.success("Descrição atualizada");
                }}
              >
                Salvar
              </button>
            </div>
          ) : (
            <button
              className="mt-1 max-w-2xl rounded-lg px-1 -mx-1 text-left text-[15px] text-neutral-300 hover:bg-white/[0.04]"
              onClick={() => {
                setDesc(board.description);
                setEditingDesc(true);
              }}
            >
              {board.description || <span className="text-neutral-500">Adicionar descrição…</span>}
            </button>
          )}
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
          <button onClick={() => setMembersOpen(true)} className="rounded-full p-1 transition hover:bg-white/[0.06]" aria-label="Membros do quadro">
            <AvatarStack members={board.memberIds.map((m) => state.members[m])} max={4} size="md" />
          </button>
          <button className="btn-primary" onClick={() => openNewTask({ boardId })}>
            <Plus className="size-4" /> <span className="hidden sm:inline">Nova tarefa</span>
          </button>
        </div>
      </div>

      {/* barra de ferramentas */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-4">
        <div role="tablist" aria-label="Visualização" className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.04] p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={view === v.id}
              onClick={() => onView(v.id)}
              className={cn(
                "flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold transition",
                view === v.id ? "bg-gradient-to-r from-brand-500/40 to-brand-600/30 text-white shadow-inner" : "text-neutral-400 hover:text-white",
              )}
            >
              <v.icon className="size-4" />
              <span className="hidden sm:inline">{v.name}</span>
            </button>
          ))}
        </div>

        <div className="relative order-last w-full sm:order-none sm:w-60">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input
            className="field h-10 pl-9"
            placeholder="Buscar neste quadro"
            value={filters.query}
            onChange={(e) => onFilters({ ...filters, query: e.target.value })}
            aria-label="Buscar neste quadro"
          />
        </div>

        <Popover
          trigger={(p) => (
            <button {...p} onClick={p.toggle} className={cn("btn-secondary h-10", filterCount > 0 && "border-brand-400/50 bg-brand-500/15")}>
              <Filter className="size-4" /> Filtros
              {filterCount > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-[11px] text-white">{filterCount}</span>}
            </button>
          )}
          panelClassName="w-[min(20rem,calc(100vw-2rem))] p-3"
        >
          <div className="space-y-4">
            <div>
              <p className="label-xs mb-2">Responsável</p>
              <div className="flex flex-wrap gap-1.5">
                {board.memberIds.map((id) => {
                  const m = state.members[id];
                  const on = filters.assigneeIds.includes(id);
                  return (
                    <button
                      key={id}
                      aria-pressed={on}
                      onClick={() => onFilters({ ...filters, assigneeIds: toggle(filters.assigneeIds, id) })}
                      className={cn(
                        "flex h-8 items-center gap-1.5 rounded-full border pr-2.5 pl-1 text-xs font-semibold transition",
                        on ? "border-brand-400/60 bg-brand-500/20 text-white" : "border-white/10 text-neutral-300 hover:border-white/25",
                      )}
                    >
                      <Avatar member={m} size="xs" title={false} />
                      {m?.name.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="label-xs mb-2">Etiqueta</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(state.labels).map((l) => {
                  const on = filters.labelIds.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      aria-pressed={on}
                      onClick={() => onFilters({ ...filters, labelIds: toggle(filters.labelIds, l.id) })}
                      className={cn("chip px-2.5 py-1 transition", on ? labelStyle[l.color].chip : "text-neutral-400 ring-white/10 hover:text-white")}
                    >
                      {on && <Check className="size-3" />}
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="label-xs mb-2">Prioridade</p>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map((p) => {
                  const on = filters.priorities.includes(p.id as Priority);
                  return (
                    <button
                      key={p.id}
                      aria-pressed={on}
                      onClick={() => onFilters({ ...filters, priorities: toggle(filters.priorities, p.id as Priority) })}
                      className={cn("chip px-2.5 py-1 transition", on ? priorityStyle[p.id].chip : "text-neutral-400 ring-white/10 hover:text-white")}
                    >
                      {on && <Check className="size-3" />}
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm text-neutral-200">
              <span>
                Ver arquivadas <span className="text-neutral-400">({archivedCount})</span>
              </span>
              <input
                type="checkbox"
                className="size-4 accent-brand-600"
                checked={filters.showArchived}
                onChange={(e) => onFilters({ ...filters, showArchived: e.target.checked })}
              />
            </label>
            <button className="btn-ghost h-9 w-full" onClick={() => onFilters({ ...emptyFilters })} disabled={!hasActiveFilters(filters)}>
              Limpar filtros
            </button>
          </div>
        </Popover>

        <Popover
          trigger={(p) => (
            <button {...p} onClick={p.toggle} className={cn("btn-secondary h-10", sort !== "manual" && "border-brand-400/50 bg-brand-500/15")}>
              <ArrowUpDown className="size-4" />
              <span className="hidden md:inline">{SORTS.find((s) => s.id === sort)?.name}</span>
            </button>
          )}
        >
          {(close) =>
            SORTS.map((s) => (
              <MenuItem
                key={s.id}
                active={sort === s.id}
                icon={sort === s.id ? Check : undefined}
                onClick={() => {
                  onSort(s.id);
                  close();
                }}
              >
                {s.name}
              </MenuItem>
            ))
          }
        </Popover>

        {hasActiveFilters(filters) && (
          <button className="btn-ghost h-10 text-[13px]" onClick={() => onFilters({ ...emptyFilters })}>
            <X className="size-4" /> {resultCount} resultado(s) · limpar
          </button>
        )}

        <button
          className={cn("btn-secondary ml-auto hidden h-10 xl:inline-flex", panelOpen && "border-brand-300/40 bg-brand-400/10")}
          onClick={onTogglePanel}
          aria-pressed={panelOpen}
        >
          <PanelRight className="size-4" /> Painel
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Excluir “${board.title}”?`}
        description="Todas as colunas, tarefas, comentários e anexos deste quadro serão removidos permanentemente. Essa ação não pode ser desfeita."
        confirmLabel="Excluir quadro"
        onConfirm={() => {
          actions.deleteBoard(boardId);
          toast.success("Quadro excluído");
          router.push("/boards");
        }}
      />

      <Modal open={membersOpen} onClose={() => setMembersOpen(false)} title="Membros do quadro" description="Escolha quem participa deste projeto." size="sm">
        <ul className="space-y-1">
          {Object.values(state.members).map((m) => {
            const on = board.memberIds.includes(m.id);
            const isMe = m.id === state.currentUserId;
            return (
              <li key={m.id}>
                <button
                  disabled={isMe}
                  onClick={() => actions.updateBoard(boardId, { memberIds: toggle(board.memberIds, m.id) })}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.06] disabled:cursor-default disabled:hover:bg-transparent"
                  aria-pressed={on}
                >
                  <Avatar member={m} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">
                      {m.name} {isMe && <span className="text-xs text-brand-200">(você)</span>}
                    </span>
                    <span className="block text-xs text-neutral-400">{m.role}</span>
                  </span>
                  <span
                    className={cn("grid size-6 place-items-center rounded-md border", on ? "border-brand-400 bg-brand-600 text-white" : "border-white/20")}
                    aria-hidden
                  >
                    {on && <Check className="size-4" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>
    </div>
  );
}
