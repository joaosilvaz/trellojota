"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  Keyboard,
  Menu,
  Moon,
  Sun,
  Plus,
  RotateCcw,
  Search,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useAppState, useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { cn, relativeTime } from "@/lib/utils";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { MenuItem, MenuSeparator, Popover } from "@/components/ui/Popover";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { Monogram } from "@/components/ui/Logo";
import { GlobalSearch } from "./GlobalSearch";
import { memberWorkload } from "@/lib/selectors";

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const state = useAppState();
  const { actions, openTask, openNewTask, setSearchOpen } = useStore();
  const toast = useToast();
  const router = useRouter();
  const [confirmReset, setConfirmReset] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const me = state.members[state.currentUserId];
  const members = Object.values(state.members);
  const unread = state.notifications.filter((n) => !n.read).length;
  const workload = memberWorkload(state);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0a]/70 backdrop-blur-xl">
      <div className="relative flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-5 lg:px-8">
        <button className="icon-btn lg:hidden" onClick={onOpenMobileNav} aria-label="Abrir menu">
          <Menu className="size-5" />
        </button>
        <Link href="/" className="lg:hidden" aria-label="JOTA Boards — início">
          <Monogram size={32} />
        </Link>

        {/* espaço de trabalho */}
        <Popover
          className="hidden sm:block"
          trigger={(p) => (
            <button
              {...p}
              onClick={p.toggle}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm font-semibold text-neutral-100 transition hover:bg-white/[0.08]"
            >
              <span className="size-2 rounded-full bg-brand-300 shadow-[0_0_10px_rgba(217,119,87,0.8)]" aria-hidden />
              <span className="max-w-36 truncate">{state.workspaceName}</span>
              <ChevronDown className="size-4 text-neutral-400" />
            </button>
          )}
          panelClassName="w-80 p-3"
        >
          {(close) => (
            <div>
              <p className="label-xs px-1">Espaço de trabalho</p>
              <p className="mt-1 px-1 font-display text-base font-semibold text-white">{state.workspaceName}</p>
              <p className="px-1 text-xs text-neutral-400">
                {members.length} membros · {state.boardOrder.length} quadros
              </p>
              <ul className="mt-3 space-y-1">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                    <Avatar member={m} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {m.name} {m.id === state.currentUserId && <span className="text-xs text-brand-200">(você)</span>}
                      </p>
                      <p className="truncate text-xs text-neutral-400">{m.role}</p>
                    </div>
                    <span className="text-xs text-neutral-400">{workload.get(m.id) ?? 0} abertas</span>
                  </li>
                ))}
              </ul>
              <MenuSeparator />
              <MenuItem
                icon={Settings}
                onClick={() => {
                  close();
                  router.push("/settings");
                }}
              >
                Configurações do espaço
              </MenuItem>
            </div>
          )}
        </Popover>

        <GlobalSearch />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button className="icon-btn md:hidden" onClick={() => setSearchOpen(true)} aria-label="Buscar">
            <Search className="size-5" />
          </button>

          <button className="btn-primary hidden h-10 sm:inline-flex" onClick={() => openNewTask({})} title="Nova tarefa (N)">
            <Plus className="size-4" />
            <span className="hidden xl:inline">Nova tarefa</span>
          </button>

          <div className="hidden px-1 xl:block" aria-label="Membros do espaço">
            <AvatarStack members={members} max={4} />
          </div>

          <button
            className="icon-btn"
            onClick={() => actions.updateSettings({ theme: state.settings.theme === "light" ? "dark" : "light" })}
            aria-label={state.settings.theme === "light" ? "Mudar para tema preto" : "Mudar para tema branco"}
            title={state.settings.theme === "light" ? "Tema preto" : "Tema branco"}
          >
            {state.settings.theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </button>

          {/* notificações */}
          <Popover
            align="end"
            trigger={(p) => (
              <button {...p} onClick={p.toggle} className="icon-btn relative" aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}>
                <Bell className="size-5" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
            )}
            panelClassName="w-[min(22rem,calc(100vw-1.5rem))] p-2"
          >
            {(close) => (
              <div>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <p className="font-display text-sm font-semibold text-white">Notificações</p>
                  <button
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-200 hover:bg-white/[0.06] disabled:opacity-40"
                    onClick={() => actions.markAllNotificationsRead()}
                    disabled={unread === 0}
                  >
                    <CheckCheck className="size-3.5" /> Marcar todas como lidas
                  </button>
                </div>
                {state.notifications.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-neutral-400">Tudo em dia por aqui.</p>
                ) : (
                  <ul className="max-h-80 space-y-0.5 overflow-y-auto scroll-thin">
                    {state.notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          className="flex w-full gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white/[0.06]"
                          onClick={() => {
                            actions.markNotificationRead(n.id);
                            close();
                            if (n.taskId && state.tasks[n.taskId]) openTask(n.taskId);
                            else if (n.boardId) router.push(`/boards/${n.boardId}`);
                          }}
                        >
                          <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-white/15" : "bg-brand-300")} aria-hidden />
                          <span className="min-w-0">
                            <span className={cn("block text-sm", n.read ? "text-neutral-300" : "font-semibold text-white")}>{n.text}</span>
                            <span className="text-xs text-neutral-400">{relativeTime(n.createdAt)}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Popover>

          {/* menu do usuário */}
          <Popover
            align="end"
            trigger={(p) => (
              <button {...p} onClick={p.toggle} className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-white/[0.06]" aria-label="Menu do usuário">
                <Avatar member={me} size="md" title={false} />
                <ChevronDown className="mr-1 hidden size-4 text-neutral-400 sm:block" />
              </button>
            )}
            panelClassName="w-64"
          >
            {(close) => (
              <div>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar member={me} size="lg" title={false} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{me.name}</p>
                    <p className="truncate text-xs text-neutral-400">{me.role}</p>
                  </div>
                </div>
                <MenuSeparator />
                <MenuItem icon={UserRound} onClick={() => { close(); router.push("/settings"); }}>
                  Meu perfil
                </MenuItem>
                <MenuItem icon={Users} onClick={() => { close(); router.push("/boards"); }}>
                  Meus quadros
                </MenuItem>
                <MenuItem icon={Keyboard} onClick={() => { close(); setShortcutsOpen(true); }}>
                  Atalhos de teclado
                </MenuItem>
                <MenuSeparator />
                <MenuItem icon={RotateCcw} danger onClick={() => { close(); setConfirmReset(true); }}>
                  Restaurar dados de demonstração
                </MenuItem>
              </div>
            )}
          </Popover>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Restaurar demonstração?"
        description="Todos os quadros, tarefas e alterações salvas neste navegador serão substituídos pelos dados iniciais do JOTA Studio."
        confirmLabel="Restaurar"
        onConfirm={() => {
          actions.resetDemo();
          router.push("/");
          toast.success("Demonstração restaurada", "Os dados iniciais foram recarregados.");
        }}
      />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </header>
  );
}

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rows = [
    ["Ctrl K  ou  /", "Buscar quadros e tarefas"],
    ["N", "Criar nova tarefa"],
    ["B", "Criar novo quadro"],
    ["Esc", "Fechar painéis e janelas"],
    ["Enter", "Abrir o cartão em foco"],
    ["Espaço", "Pegar e soltar um cartão (teclado)"],
    ["Setas", "Mover o cartão durante o arraste"],
  ];
  return (
    <Modal open={open} onClose={onClose} title="Atalhos de teclado" size="sm">
      <ul className="space-y-2">
        {rows.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-neutral-300">{v}</span>
            <kbd className="rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-xs font-semibold text-white">{k}</kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
