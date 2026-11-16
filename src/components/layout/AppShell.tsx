"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Monogram } from "@/components/ui/Logo";
import { useFocusTrap } from "@/components/ui/Modal";
import { NAV, Sidebar, SidebarContent, isActivePath } from "./Sidebar";
import { Topbar } from "./Topbar";
import { TaskDrawer } from "@/components/task/TaskDrawer";
import { NewTaskModal } from "@/components/task/NewTaskModal";
import { CreateBoardModal } from "@/components/board/CreateBoardModal";
import { useToast } from "@/lib/toast";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { hydrated, openNewTask, setCreateBoardOpen, saveError } = useStore();
  const [mobileNav, setMobileNav] = useState(false);
  const pathname = usePathname();
  const toast = useToast();

  useEffect(() => setMobileNav(false), [pathname]);

  useEffect(() => {
    if (saveError) toast.error("Não foi possível salvar", "O armazenamento local do navegador está cheio. Remova anexos grandes.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveError]);

  // atalhos globais: N = nova tarefa, B = novo quadro
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable='true'], [role='dialog']")) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        const boardMatch = window.location.pathname.match(/^\/boards\/([^/]+)/);
        openNewTask(boardMatch ? { boardId: boardMatch[1] } : {});
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setCreateBoardOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openNewTask, setCreateBoardOpen]);

  if (!hydrated) return <LoadingScreen />;

  return (
    <div className="flex min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only z-[90] rounded-xl bg-white px-4 py-2 font-semibold text-black focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <Sidebar />
      <MobileNav open={mobileNav} onClose={() => setMobileNav(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNav(true)} />
        <main id="conteudo" className="min-w-0 flex-1 pb-24 lg:pb-10">
          {children}
        </main>
      </div>
      <BottomNav />
      <TaskDrawer />
      <NewTaskModal />
      <CreateBoardModal />
    </div>
  );
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useFocusTrap(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="animate-fade-in absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className="glass-strong animate-fade-in absolute inset-y-0 left-0 w-[86vw] max-w-[300px] rounded-none rounded-r-3xl"
      >
        <button className="icon-btn absolute top-3 right-3 z-10" onClick={onClose} aria-label="Fechar menu">
          <X className="size-5" />
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const items = NAV.slice(0, 4);
  return (
    <nav
      aria-label="Navegação rápida"
      className="glass fixed inset-x-3 bottom-3 z-40 flex h-16 items-center justify-around rounded-2xl px-2 lg:hidden"
    >
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition",
              active ? "text-white" : "text-neutral-400",
            )}
          >
            <span className={cn("grid h-7 w-12 place-items-center rounded-full transition", active && "bg-gradient-to-r from-brand-500/40 to-brand-600/30")}>
              <item.icon className={cn("size-[18px]", active && "text-brand-200")} />
            </span>
            {item.short}
          </Link>
        );
      })}
    </nav>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-dvh" aria-busy="true" aria-live="polite">
      <div className="glass hidden w-[264px] shrink-0 flex-col gap-4 rounded-none border-y-0 border-l-0 p-5 lg:flex">
        <div className="flex items-center gap-3">
          <Monogram />
          <div className="skeleton h-4 w-24 rounded-md" />
        </div>
        <div className="skeleton mt-4 h-10 rounded-xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-9 rounded-xl" />
        ))}
      </div>
      <div className="flex-1 p-6 lg:p-8">
        <div className="skeleton h-11 max-w-md rounded-2xl" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-3xl" />
          ))}
        </div>
        <div className="skeleton mt-6 h-72 rounded-3xl" />
        <p className="sr-only">Carregando seu espaço de trabalho…</p>
      </div>
    </div>
  );
}
