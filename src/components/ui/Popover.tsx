"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Popover leve: abre/fecha pelo gatilho, fecha ao clicar fora ou com Esc
 * e devolve o foco para o gatilho.
 */
export function Popover({
  trigger,
  children,
  align = "start",
  className,
  panelClassName,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger: (props: { open: boolean; toggle: () => void; "aria-expanded": boolean; "aria-haspopup": "true" }) => React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "start" | "end";
  className?: string;
  panelClassName?: string;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = (o: boolean) => {
    onOpenChange?.(o);
    if (controlledOpen === undefined) setInnerOpen(o);
  };
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        root.current?.querySelector<HTMLElement>("button,[tabindex]")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    root.current?.addEventListener("keydown", onKey);
    const node = root.current;
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      node?.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => setOpen(false);

  // open/toggle ficam não enumeráveis para que `{...p}` espalhe só atributos válidos no botão
  const triggerProps = { "aria-expanded": open, "aria-haspopup": "true" as const } as Parameters<typeof trigger>[0];
  Object.defineProperties(triggerProps, {
    open: { value: open, enumerable: false },
    toggle: { value: () => setOpen(!open), enumerable: false },
  });

  return (
    <div ref={root} className={cn("relative", className)} data-popover-open={open ? "true" : "false"}>
      {trigger(triggerProps)}
      {open && (
        <div
          className={cn(
            "glass-strong animate-scale-in absolute top-full z-50 mt-2 min-w-56 rounded-2xl p-1.5",
            align === "end" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  icon: Icon,
  children,
  onClick,
  danger,
  active,
  shortcut,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  active?: boolean;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition",
        danger ? "text-rose-200 hover:bg-rose-500/15" : "text-neutral-200 hover:bg-white/[0.08] hover:text-white",
        active && "bg-white/[0.08] text-white",
      )}
    >
      {Icon && <Icon className={cn("size-4 shrink-0", danger ? "text-rose-300" : "text-neutral-400")} />}
      <span className="flex-1">{children}</span>
      {shortcut && <kbd className="text-[11px] text-neutral-500">{shortcut}</kbd>}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-white/[0.07]" role="separator" />;
}
