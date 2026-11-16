"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { useAppState } from "@/lib/store";
import type { BoardFilters, SortMode, Task, ViewMode } from "@/lib/types";
import { emptyFilters, matchesFilters } from "@/lib/selectors";
import { BoardHeader } from "@/components/board/BoardHeader";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { ListView } from "@/components/board/ListView";
import { BoardInsights } from "@/components/board/BoardInsights";
import { CalendarView } from "@/components/calendar/CalendarView";
import { EmptyState } from "@/components/ui/Chips";

function BoardPageInner() {
  const { id } = useParams<{ id: string }>();
  const state = useAppState();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const view = (["board", "list", "calendar"].includes(params.get("view") ?? "") ? params.get("view") : "board") as ViewMode;
  const [filters, setFilters] = useState<BoardFilters>(emptyFilters);
  const [sort, setSort] = useState<SortMode>("manual");
  const [panelOpen, setPanelOpen] = useState(false);
  const board = state.boards[id];

  const filtered = useMemo(
    () => (board ? Object.values(state.tasks).filter((t): t is Task => t.boardId === id && matchesFilters(t, filters, state)) : []),
    [state, id, filters, board],
  );

  if (!board) {
    return (
      <div className="px-4 py-16 sm:px-8">
        <div className="glass mx-auto max-w-lg rounded-3xl">
          <EmptyState
            icon={FolderKanban}
            title="Quadro não encontrado"
            description="Ele pode ter sido excluído ou o link está incorreto."
            action={
              <Link href="/boards" className="btn-primary">
                Ver meus quadros
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const setView = (v: ViewMode) => {
    const sp = new URLSearchParams(params.toString());
    if (v === "board") sp.delete("view");
    else sp.set("view", v);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  return (
    <div className="animate-fade-in">
      <BoardHeader
        boardId={id}
        view={view}
        onView={setView}
        filters={filters}
        onFilters={setFilters}
        sort={sort}
        onSort={setSort}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((o) => !o)}
        resultCount={filtered.length}
      />
      <div className="flex gap-5 pt-5">
        <div key={view} className="animate-slide-up min-w-0 flex-1">
          {view === "board" && <KanbanBoard boardId={id} filters={filters} sort={sort} />}
          {view === "list" && <ListView boardId={id} filters={filters} sort={sort} />}
          {view === "calendar" && (
            <div className="px-4 pb-8 sm:px-6 lg:px-8">
              <CalendarView tasks={filtered} defaultBoardId={id} />
            </div>
          )}
        </div>
        {panelOpen && (
          <div className="hidden pr-8 xl:block">
            <BoardInsights boardId={id} onClose={() => setPanelOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={<div className="skeleton m-8 h-96 rounded-3xl" />}>
      <BoardPageInner />
    </Suspense>
  );
}
