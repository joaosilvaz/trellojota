"use client";

import { forwardRef } from "react";
import { CalendarClock, CheckCircle2, ListChecks, MessageSquare, Paperclip } from "lucide-react";
import type { AppState, Task } from "@/lib/types";
import { cn, dueLabel, dueState, labelStyle, priorityName, priorityStyle } from "@/lib/utils";
import { AvatarStack } from "@/components/ui/Avatar";
import { Cover } from "@/components/ui/Cover";

type Props = {
  task: Task;
  state: AppState;
  isDone: boolean;
  dragging?: boolean;
  overlay?: boolean;
  style?: React.CSSProperties;
  onOpen?: () => void;
} & React.HTMLAttributes<HTMLDivElement>;

export const TaskCard = forwardRef<HTMLDivElement, Props>(function TaskCard(
  { task, state, isDone, dragging, overlay, style, onOpen, className, ...rest },
  ref,
) {
  const cover = task.attachments.find((a) => a.id === task.coverId);
  const ds = dueState(task, isDone);
  const checkTotal = task.checklist.length;
  const checkDone = task.checklist.filter((c) => c.done).length;
  const pStyle = priorityStyle[task.priority];

  return (
    <div
      ref={ref}
      style={style}
      {...rest}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onOpen?.();
        }
        rest.onKeyDown?.(e);
      }}
      aria-label={`${task.title}. Prioridade ${priorityName[task.priority]}${task.dueDate ? `, prazo ${dueLabel(task.dueDate)}` : ""}. Enter para abrir, espaço para mover.`}
      className={cn(
        "glass-card group relative cursor-pointer touch-manipulation overflow-hidden rounded-2xl text-left transition duration-150 outline-none select-none",
        "hover:-translate-y-0.5 hover:border-white/[0.16] hover:shadow-[0_14px_30px_-14px_rgba(0,0,0,0.8)]",
        "focus-visible:ring-2 focus-visible:ring-cyan-300/70",
        dragging && "opacity-35",
        overlay && "rotate-[2deg] cursor-grabbing border-white/20 shadow-[0_24px_50px_-14px_rgba(70,60,200,0.65)]",
        task.archived && "opacity-70",
        className,
      )}
    >
      {/* fio de prioridade à esquerda */}
      <span className={cn("absolute top-3 bottom-3 left-0 w-[3px] rounded-r-full", pStyle.dot)} aria-hidden />

      {cover && <Cover src={cover.src} alt="" className="pointer-events-none h-28 w-full" />}

      <div className="space-y-2.5 p-3.5 pl-4">
        {task.labelIds.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labelIds.slice(0, 3).map((id) => {
              const l = state.labels[id];
              return l ? (
                <span key={id} className={cn("chip px-2 py-[1px] text-[11px]", labelStyle[l.color].chip)}>
                  {l.name}
                </span>
              ) : null;
            })}
          </div>
        )}

        <div>
          <p className={cn("text-[14px] leading-snug font-semibold", isDone ? "text-slate-300" : "text-white")}>
            {isDone && <CheckCircle2 className="mr-1 -mt-0.5 inline size-4 text-emerald-300" aria-hidden />}
            {task.title}
          </p>
          {task.description && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-slate-400">{task.description}</p>}
        </div>

        {checkTotal > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={cn("h-full rounded-full", checkDone === checkTotal ? "bg-emerald-400" : "bg-gradient-to-r from-electric-400 to-violet-400")}
                style={{ width: `${(checkDone / checkTotal) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className={cn("chip px-1.5 py-[1px] text-[11px]", pStyle.chip)}>{priorityName[task.priority]}</span>
          {task.dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-[1px] text-[11px] font-semibold",
                ds === "overdue" && "bg-rose-500/20 text-rose-200",
                ds === "soon" && "bg-amber-500/15 text-amber-200",
                ds === "later" && "text-slate-300",
                ds === "done" && "bg-emerald-500/15 text-emerald-200",
              )}
            >
              <CalendarClock className="size-3" aria-hidden />
              {dueLabel(task.dueDate)}
            </span>
          )}
          {checkTotal > 0 && (
            <span className={cn("inline-flex items-center gap-1", checkDone === checkTotal && "text-emerald-300")} title="Checklist">
              <ListChecks className="size-3.5" aria-hidden />
              {checkDone}/{checkTotal}
            </span>
          )}
          {task.comments.length > 0 && (
            <span className="inline-flex items-center gap-1" title="Comentários">
              <MessageSquare className="size-3.5" aria-hidden />
              {task.comments.length}
            </span>
          )}
          {task.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1" title="Anexos">
              <Paperclip className="size-3.5" aria-hidden />
              {task.attachments.length}
            </span>
          )}
          <span className="ml-auto">
            <AvatarStack members={task.assigneeIds.map((m) => state.members[m])} max={3} size="xs" />
          </span>
        </div>
      </div>
    </div>
  );
});
