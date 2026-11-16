"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, FolderKanban, Search, X } from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { searchAll } from "@/lib/selectors";
import { accentStyle, cn } from "@/lib/utils";

export function GlobalSearch() {
  const state = useAppState();
  const { openTask, searchOpen, setSearchOpen } = useStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchAll(state, query), [state, query]);
  const flat = useMemo(
    () => [
      ...results.boards.map((b) => ({ type: "board" as const, id: b.id })),
      ...results.tasks.map((t) => ({ type: "task" as const, id: t.id })),
    ],
    [results],
  );

  // atalhos: Ctrl/Cmd+K e "/"
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.closest("input, textarea, select, [contenteditable='true']");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 20);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => inputRef.current?.focus(), 20);
  }, [searchOpen]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setFocused(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [setSearchOpen]);

  const choose = (item: { type: "board" | "task"; id: string }) => {
    if (item.type === "board") router.push(`/boards/${item.id}`);
    else openTask(item.id);
    setQuery("");
    setFocused(false);
    setSearchOpen(false);
    inputRef.current?.blur();
  };

  const showResults = focused && query.trim().length > 0;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative min-w-0 flex-1 md:max-w-md",
        searchOpen ? "absolute inset-x-3 top-3 z-50 md:static" : "hidden md:block",
      )}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-neutral-400" aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => Math.min(c + 1, flat.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            } else if (e.key === "Enter" && flat[cursor]) {
              e.preventDefault();
              choose(flat[cursor]);
            } else if (e.key === "Escape") {
              setQuery("");
              setFocused(false);
              setSearchOpen(false);
              inputRef.current?.blur();
            }
          }}
          type="search"
          role="combobox"
          aria-expanded={showResults}
          aria-controls="global-search-results"
          aria-label="Buscar quadros e tarefas"
          placeholder="Buscar quadros e tarefas…"
          className="field h-11 rounded-2xl border-white/[0.09] bg-white/[0.05] pr-20 pl-10"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-white/10 px-1.5 py-0.5 text-[11px] text-neutral-400 md:block">
          Ctrl K
        </kbd>
        {searchOpen && (
          <button
            className="icon-btn absolute top-1/2 right-1 size-9 -translate-y-1/2 md:hidden"
            onClick={() => setSearchOpen(false)}
            aria-label="Fechar busca"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {showResults && (
        <div
          id="global-search-results"
          role="listbox"
          className="glass-strong animate-scale-in absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl p-2 scroll-thin"
        >
          {flat.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-neutral-400">
              Nada encontrado para “{query}”. Tente outro termo.
            </p>
          )}
          {results.boards.length > 0 && <p className="label-xs px-3 pt-2 pb-1">Quadros</p>}
          {results.boards.map((b) => {
            const i = flat.findIndex((f) => f.id === b.id);
            return (
              <button
                key={b.id}
                role="option"
                aria-selected={cursor === i}
                onMouseEnter={() => setCursor(i)}
                onClick={() => choose({ type: "board", id: b.id })}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", cursor === i && "bg-white/[0.08]")}
              >
                <span
                  className="grid size-8 place-items-center rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${accentStyle[b.accent].from}, ${accentStyle[b.accent].to})` }}
                >
                  <FolderKanban className="size-4 text-white" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{b.title}</span>
                  <span className="block truncate text-xs text-neutral-400">{b.description}</span>
                </span>
              </button>
            );
          })}
          {results.tasks.length > 0 && <p className="label-xs px-3 pt-3 pb-1">Tarefas</p>}
          {results.tasks.map((t) => {
            const i = flat.findIndex((f) => f.id === t.id);
            const col = state.columns[t.columnId];
            return (
              <button
                key={t.id}
                role="option"
                aria-selected={cursor === i}
                onMouseEnter={() => setCursor(i)}
                onClick={() => choose({ type: "task", id: t.id })}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", cursor === i && "bg-white/[0.08]")}
              >
                <span className={cn("size-2 shrink-0 rounded-full", col?.isDone ? "bg-emerald-400" : "bg-brand-400")} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{t.title}</span>
                  <span className="block truncate text-xs text-neutral-400">
                    {state.boards[t.boardId]?.title} · {col?.title}
                  </span>
                </span>
                {t.archived && <Archive className="size-3.5 text-neutral-500" aria-label="Arquivada" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
