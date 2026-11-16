"use client";

import Link from "next/link";
import { useState } from "react";
import { FolderKanban, Plus, Search, Star, Trash2 } from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { boardProgress, normalize, taskStats } from "@/lib/selectors";
import { accentStyle, cn, relativeTime } from "@/lib/utils";
import { AvatarStack } from "@/components/ui/Avatar";
import { EmptyState, ProgressBar } from "@/components/ui/Chips";
import { ConfirmDialog } from "@/components/ui/Modal";

export default function BoardsPage() {
  const state = useAppState();
  const { setCreateBoardOpen, actions } = useStore();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const boards = state.boardOrder
    .map((id) => state.boards[id])
    .filter((b) => b && (!onlyFav || b.favorite) && normalize(b.title + " " + b.description).includes(normalize(query.trim())));

  return (
    <div className="animate-fade-in mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Meus quadros</h1>
          <p className="mt-1 text-[15px] text-neutral-300">
            {state.boardOrder.length} projetos no espaço {state.workspaceName}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateBoardOpen(true)}>
          <Plus className="size-4" /> Novo quadro
        </button>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input className="field h-10 pl-9" placeholder="Filtrar quadros" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filtrar quadros" />
        </div>
        <button className={cn("btn-secondary h-10", onlyFav && "border-amber-300/40 bg-amber-400/10 text-amber-100")} aria-pressed={onlyFav} onClick={() => setOnlyFav(!onlyFav)}>
          <Star className={cn("size-4", onlyFav && "fill-current text-amber-300")} /> Favoritos
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="glass rounded-3xl">
          <EmptyState
            icon={FolderKanban}
            title={state.boardOrder.length ? "Nenhum quadro encontrado" : "Comece seu primeiro quadro"}
            description={state.boardOrder.length ? "Tente outro termo ou remova o filtro de favoritos." : "Quadros organizam projetos em colunas e cartões."}
            action={
              <button className="btn-primary h-9" onClick={() => setCreateBoardOpen(true)}>
                <Plus className="size-4" /> Criar quadro
              </button>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {boards.map((b) => {
            const acc = accentStyle[b.accent];
            const p = boardProgress(state, b.id);
            const s = taskStats(state, b.id);
            return (
              <li key={b.id} className="glass group relative overflow-hidden rounded-3xl transition hover:-translate-y-0.5 hover:border-white/15">
                <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${acc.from}, ${acc.to})` }}>
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "14px 14px" }}
                    aria-hidden
                  />
                  <div className="absolute -right-6 -bottom-10 size-32 rounded-full bg-white/20 blur-2xl" aria-hidden />
                </div>
                <div className="p-5">
                  <Link href={`/boards/${b.id}`} className="font-display text-lg font-semibold text-white after:absolute after:inset-0 after:content-['']">
                    {b.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 min-h-10 text-sm text-neutral-400">{b.description || "Sem descrição"}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-neutral-300">
                    <span>
                      {s.open} abertas · {s.done} concluídas
                    </span>
                    <span className="font-semibold text-white">{p.pct}%</span>
                  </div>
                  <ProgressBar value={p.pct} tone={`linear-gradient(90deg, ${acc.from}, ${acc.to})`} className="mt-2 h-2" label={`Progresso de ${b.title}`} />
                  <div className="mt-4 flex items-center justify-between">
                    <AvatarStack members={b.memberIds.map((m) => state.members[m])} max={4} />
                    <span className="text-xs text-neutral-500">criado {relativeTime(b.createdAt)}</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 z-10 flex gap-1">
                  <button
                    className={cn("grid size-9 place-items-center rounded-xl bg-black/30 backdrop-blur transition hover:bg-black/50", b.favorite ? "text-amber-300" : "text-white")}
                    onClick={() => actions.toggleFavorite(b.id)}
                    aria-pressed={b.favorite}
                    aria-label={b.favorite ? `Remover ${b.title} dos favoritos` : `Favoritar ${b.title}`}
                  >
                    <Star className={cn("size-4", b.favorite && "fill-current")} />
                  </button>
                  <button
                    className="grid size-9 place-items-center rounded-xl bg-black/30 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-rose-500/60 focus-visible:opacity-100"
                    onClick={() => setDeleteId(b.id)}
                    aria-label={`Excluir ${b.title}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
          <li>
            <button
              onClick={() => setCreateBoardOpen(true)}
              className="flex h-full min-h-64 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 text-neutral-300 transition hover:border-white/30 hover:bg-white/[0.03] hover:text-white"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-white/[0.06]">
                <Plus className="size-5" />
              </span>
              <span className="font-semibold">Criar novo quadro</span>
            </button>
          </li>
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={`Excluir “${deleteId ? state.boards[deleteId]?.title : ""}”?`}
        description="Todas as colunas e tarefas deste quadro serão removidas permanentemente. Essa ação não pode ser desfeita."
        confirmLabel="Excluir quadro"
        onConfirm={() => {
          if (deleteId) actions.deleteBoard(deleteId);
          toast.success("Quadro excluído");
        }}
      />
    </div>
  );
}
