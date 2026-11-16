"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Star,
} from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { accentStyle, cn } from "@/lib/utils";
import { Wordmark } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";

export const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/boards", label: "Meus quadros", icon: FolderKanban },
  { href: "/calendar", label: "Calendário", icon: CalendarDays },
  { href: "/activity", label: "Atividade", icon: Activity },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SidebarContent({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const state = useAppState();
  const { actions, setCreateBoardOpen } = useStore();
  const pathname = usePathname();
  const favorites = state.boardOrder.map((id) => state.boards[id]).filter((b) => b?.favorite);
  const me = state.members[state.currentUserId];

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center", collapsed ? "justify-center" : "px-5")}>
        <Link href="/" onClick={onNavigate} aria-label="JOTA Boards — início" className="rounded-xl">
          <Wordmark collapsed={collapsed} />
        </Link>
      </div>

      <div className={cn("mt-2", collapsed ? "px-3" : "px-4")}>
        <button
          className={cn("btn-primary w-full", collapsed && "px-0")}
          onClick={() => {
            setCreateBoardOpen(true);
            onNavigate?.();
          }}
          aria-label="Criar quadro"
          title="Criar quadro"
        >
          <Plus className="size-4" />
          {!collapsed && "Novo quadro"}
        </button>
      </div>

      <nav aria-label="Navegação principal" className={cn("mt-6 space-y-1", collapsed ? "px-3" : "px-3")}>
        {!collapsed && <p className="label-xs mb-2 px-3">Menu</p>}
        {NAV.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex h-11 items-center gap-3 rounded-xl text-sm font-semibold transition",
                collapsed ? "justify-center" : "px-3",
                active
                  ? "bg-gradient-to-r from-electric-500/25 to-violet-500/10 text-white"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              {active && <span className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full bg-cyan-300" aria-hidden />}
              <item.icon className={cn("size-[18px] shrink-0", active ? "text-cyan-200" : "text-slate-400 group-hover:text-slate-200")} />
              {!collapsed && item.label}
              {collapsed && <span className="sr-only">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("mt-7 min-h-0 flex-1 overflow-y-auto scroll-thin", collapsed ? "px-3" : "px-3")}>
        {!collapsed && (
          <div className="mb-2 flex items-center justify-between px-3">
            <p className="label-xs">Favoritos</p>
            <Star className="size-3.5 text-amber-300/80" aria-hidden />
          </div>
        )}
        {favorites.length === 0 && !collapsed && (
          <p className="px-3 text-[13px] text-slate-400">Marque quadros com a estrela para vê-los aqui.</p>
        )}
        <ul className="space-y-1">
          {favorites.map((b) => {
            const active = pathname === `/boards/${b.id}`;
            return (
              <li key={b.id} className="group/fav relative">
                <Link
                  href={`/boards/${b.id}`}
                  onClick={onNavigate}
                  title={b.title}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-xl text-sm transition",
                    collapsed ? "justify-center" : "pr-9 pl-3",
                    active ? "bg-white/[0.08] text-white" : "text-slate-300 hover:bg-white/[0.05] hover:text-white",
                  )}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-[4px]"
                    style={{ background: `linear-gradient(135deg, ${accentStyle[b.accent].from}, ${accentStyle[b.accent].to})` }}
                    aria-hidden
                  />
                  {collapsed ? <span className="sr-only">{b.title}</span> : <span className="truncate">{b.title}</span>}
                </Link>
                {!collapsed && (
                  <button
                    className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-amber-300 opacity-0 transition group-hover/fav:opacity-100 hover:bg-white/10 focus-visible:opacity-100"
                    onClick={() => actions.toggleFavorite(b.id)}
                    aria-label={`Remover ${b.title} dos favoritos`}
                  >
                    <Star className="size-3.5 fill-current" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className={cn("border-t border-white/[0.06] p-3")}>
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn("flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.05]", collapsed && "justify-center")}
        >
          <Avatar member={me} size="md" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{me.name}</p>
              <p className="truncate text-xs text-slate-400">{state.workspaceName}</p>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}

export function Sidebar() {
  const state = useAppState();
  const { actions } = useStore();
  const collapsed = state.settings.sidebarCollapsed;
  return (
    <aside
      className={cn(
        "glass sticky top-0 z-30 hidden h-dvh shrink-0 flex-col rounded-none border-y-0 border-l-0 transition-[width] duration-200 lg:flex",
        collapsed ? "w-[84px]" : "w-[264px]",
      )}
      aria-label="Barra lateral"
    >
      <SidebarContent collapsed={collapsed} />
      <button
        className="absolute top-5 -right-3.5 grid size-7 place-items-center rounded-full border border-white/15 bg-[#151540] text-slate-300 shadow-lg transition hover:text-white"
        onClick={() => actions.updateSettings({ sidebarCollapsed: !collapsed })}
        aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
        title={collapsed ? "Expandir" : "Recolher"}
      >
        {collapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
      </button>
    </aside>
  );
}
