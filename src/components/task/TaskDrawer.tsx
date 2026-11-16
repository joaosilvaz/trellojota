"use client";

import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Ellipsis,
  Flag,
  History,
  ImagePlus,
  ListChecks,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useAppState, useStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { LabelColor, Priority, Task } from "@/lib/types";
import {
  LABEL_COLORS,
  PRIORITIES,
  cn,
  dueLabel,
  dueState,
  formatLong,
  labelStyle,
  priorityStyle,
  relativeTime,
} from "@/lib/utils";
import { useFocusTrap, ConfirmDialog } from "@/components/ui/Modal";
import { MenuItem, MenuSeparator, Popover } from "@/components/ui/Popover";
import { Avatar } from "@/components/ui/Avatar";
import { Cover, COVER_PRESETS } from "@/components/ui/Cover";
import { LabelChip, ProgressBar } from "@/components/ui/Chips";

export function TaskDrawer() {
  const state = useAppState();
  const { openTaskId, openTask } = useStore();
  const task = openTaskId ? state.tasks[openTaskId] : undefined;

  useEffect(() => {
    if (openTaskId && !state.tasks[openTaskId]) openTask(null);
  }, [openTaskId, state.tasks, openTask]);

  if (!task) return null;
  return <TaskDrawerInner key={task.id} task={task} onClose={() => openTask(null)} />;
}

function TaskDrawerInner({ task, onClose }: { task: Task; onClose: () => void }) {
  const state = useAppState();
  const { actions, openTask } = useStore();
  const toast = useToast();
  const ref = useFocusTrap(true, onClose);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const board = state.boards[task.boardId];
  const column = state.columns[task.columnId];
  const done = !!column?.isDone;
  const cover = task.attachments.find((a) => a.id === task.coverId);

  if (!board || !column) return null;

  return (
    <div className="fixed inset-0 z-[65]">
      <div className="animate-fade-in absolute inset-0 bg-[#03030f]/65 backdrop-blur-[3px]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-title"
        className="glass-strong animate-slide-in absolute inset-y-0 right-0 flex w-full flex-col rounded-none border-y-0 border-r-0 sm:w-[min(940px,94vw)] sm:rounded-l-3xl"
      >
        {/* cabeçalho */}
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1 truncate text-[13px] text-slate-400">
            <span className="text-slate-300">{board.title}</span> <span aria-hidden>/</span> {column.title}
            {task.archived && <span className="ml-2 chip bg-slate-500/20 text-slate-200 ring-slate-400/30">Arquivada</span>}
          </div>
          <button
            className={cn("btn h-9 px-3 text-[13px]", done ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/30" : "btn-secondary h-9")}
            onClick={() => {
              actions.toggleDone(task.id);
              toast.success(done ? "Tarefa reaberta" : "Tarefa concluída", done ? undefined : "Bom trabalho! O dashboard já foi atualizado.");
            }}
          >
            {done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
            {done ? "Concluída" : "Concluir"}
          </button>
          <Popover
            align="end"
            trigger={(p) => (
              <button {...p} onClick={p.toggle} className="icon-btn size-9" aria-label="Mais ações da tarefa">
                <Ellipsis className="size-5" />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem
                  icon={Copy}
                  onClick={() => {
                    close();
                    const id = actions.duplicateTask(task.id);
                    toast.toast({ kind: "success", title: "Tarefa duplicada", action: { label: "Abrir cópia", onClick: () => openTask(id) } });
                  }}
                >
                  Duplicar
                </MenuItem>
                <MenuItem
                  icon={task.archived ? ArchiveRestore : Archive}
                  onClick={() => {
                    close();
                    actions.archiveTask(task.id, !task.archived);
                    if (!task.archived) {
                      onClose();
                      toast.toast({
                        kind: "info",
                        title: "Tarefa arquivada",
                        description: "Ela some do quadro, mas pode ser restaurada.",
                        action: { label: "Desfazer", onClick: () => actions.archiveTask(task.id, false) },
                      });
                    } else toast.success("Tarefa restaurada");
                  }}
                >
                  {task.archived ? "Restaurar" : "Arquivar"}
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  icon={Trash2}
                  danger
                  onClick={() => {
                    close();
                    setConfirmDelete(true);
                  }}
                >
                  Excluir
                </MenuItem>
              </>
            )}
          </Popover>
          <button className="icon-btn size-9" onClick={onClose} aria-label="Fechar detalhes">
            <X className="size-5" />
          </button>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          {cover && (
            <div className="px-4 pt-4 sm:px-6">
              <Cover src={cover.src} alt={cover.name} className="h-40 w-full rounded-2xl sm:h-48" />
            </div>
          )}
          <div className="grid gap-8 px-4 py-5 sm:px-6 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0 space-y-8">
              <TitleEditor task={task} />
              <DescriptionEditor task={task} />
              <ChecklistSection task={task} />
              <AttachmentsSection task={task} />
              <ActivityTabs task={task} />
            </div>
            <aside className="space-y-5 md:border-l md:border-white/[0.06] md:pl-6" aria-label="Propriedades da tarefa">
              <Properties task={task} />
              <div className="space-y-2 border-t border-white/[0.06] pt-5">
                <p className="label-xs">Ações</p>
                <button
                  className="btn-secondary w-full justify-start"
                  onClick={() => {
                    const id = actions.duplicateTask(task.id);
                    toast.toast({ kind: "success", title: "Tarefa duplicada", action: { label: "Abrir cópia", onClick: () => openTask(id) } });
                  }}
                >
                  <Copy className="size-4" /> Duplicar
                </button>
                <button
                  className="btn-secondary w-full justify-start"
                  onClick={() => {
                    actions.archiveTask(task.id, !task.archived);
                    if (!task.archived) {
                      onClose();
                      toast.toast({
                        kind: "info",
                        title: "Tarefa arquivada",
                        action: { label: "Desfazer", onClick: () => actions.archiveTask(task.id, false) },
                      });
                    } else toast.success("Tarefa restaurada");
                  }}
                >
                  {task.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                  {task.archived ? "Restaurar" : "Arquivar"}
                </button>
                <button className="btn-danger w-full justify-start" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="size-4" /> Excluir
                </button>
              </div>
              <div className="space-y-1 border-t border-white/[0.06] pt-5 text-xs text-slate-400">
                <p>Criada {relativeTime(task.createdAt)}</p>
                {task.completedAt && done && <p>Concluída {relativeTime(task.completedAt)}</p>}
              </div>
            </aside>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir tarefa?"
        description={`“${task.title}” e todos os comentários, anexos e histórico serão removidos permanentemente. Essa ação não pode ser desfeita.`}
        onConfirm={() => {
          onClose();
          actions.deleteTask(task.id);
          toast.success("Tarefa excluída");
        }}
      />
    </div>
  );
}

/* ---------------------------------- título ---------------------------------- */

function TitleEditor({ task }: { task: Task }) {
  const { actions } = useStore();
  const { labels } = useAppState();
  const toast = useToast();
  const [value, setValue] = useState(task.title);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setValue(task.title), [task.title]);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [value]);

  const commit = () => {
    const v = value.trim().replace(/\s+/g, " ");
    if (v.length < 2) {
      toast.error("Título inválido", "Use pelo menos 2 caracteres.");
      setValue(task.title);
      return;
    }
    if (v !== task.title) {
      actions.updateTask(task.id, { title: v });
      toast.success("Título atualizado");
    }
  };

  return (
    <div>
      <label htmlFor="task-title" className="sr-only">
        Título da tarefa
      </label>
      <textarea
        id="task-title"
        ref={ref}
        rows={1}
        value={value}
        maxLength={140}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
        className="font-display w-full resize-none overflow-hidden rounded-xl border border-transparent bg-transparent px-2 py-1 -mx-2 text-2xl leading-tight font-semibold text-white transition outline-none hover:border-white/10 focus:border-electric-400/60 focus:bg-white/[0.04]"
      />
      {task.labelIds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.labelIds.map((l) => (
            <LabelChip key={l} label={labels[l]} />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- descrição -------------------------------- */

function DescriptionEditor({ task }: { task: Task }) {
  const { actions } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(task.description);

  useEffect(() => {
    if (!editing) setValue(task.description);
  }, [task.description, editing]);

  return (
    <section aria-labelledby="desc-h">
      <h3 id="desc-h" className="mb-2 font-display text-sm font-semibold text-white">
        Descrição
      </h3>
      {editing ? (
        <div>
          <textarea
            autoFocus
            className="field min-h-32 resize-y leading-relaxed"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Contexto, objetivos, links e critérios de pronto…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                actions.updateTask(task.id, { description: value.trim() });
                setEditing(false);
                toast.success("Descrição salva");
              }
            }}
          />
          <div className="mt-2 flex gap-2">
            <button
              className="btn-primary h-9"
              onClick={() => {
                actions.updateTask(task.id, { description: value.trim() });
                setEditing(false);
                toast.success("Descrição salva");
              }}
            >
              Salvar
            </button>
            <button
              className="btn-ghost h-9"
              onClick={() => {
                setValue(task.description);
                setEditing(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-left text-[15px] leading-relaxed whitespace-pre-wrap transition hover:border-white/15"
        >
          {task.description ? (
            <span className="text-slate-200">{task.description}</span>
          ) : (
            <span className="text-slate-400">Adicionar uma descrição mais detalhada…</span>
          )}
        </button>
      )}
    </section>
  );
}

/* -------------------------------- checklist -------------------------------- */

function ChecklistSection({ task }: { task: Task }) {
  const { actions } = useStore();
  const [newItem, setNewItem] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const total = task.checklist.length;
  const doneCount = task.checklist.filter((c) => c.done).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const add = () => {
    const v = newItem.trim();
    if (!v) return;
    actions.addChecklistItem(task.id, v);
    setNewItem("");
  };

  return (
    <section aria-labelledby="check-h">
      <div className="mb-3 flex items-center gap-2">
        <ListChecks className="size-4 text-cyan-300" aria-hidden />
        <h3 id="check-h" className="font-display text-sm font-semibold text-white">
          Checklist
        </h3>
        {total > 0 && (
          <span className="ml-auto text-xs font-semibold text-slate-300">
            {doneCount}/{total} · {pct}%
          </span>
        )}
      </div>
      {total > 0 && <ProgressBar value={pct} tone={pct === 100 ? "done" : "brand"} className="mb-3" label="Progresso do checklist" />}
      <ul className="space-y-1">
        {task.checklist.map((item) => (
          <li key={item.id} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.04]">
            <button
              role="checkbox"
              aria-checked={item.done}
              aria-label={item.text}
              onClick={() => actions.updateChecklistItem(task.id, item.id, { done: !item.done })}
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-md border transition",
                item.done ? "border-emerald-400 bg-emerald-500 text-white" : "border-white/25 hover:border-white/50",
              )}
            >
              {item.done && <Check className="size-3.5" strokeWidth={3} />}
            </button>
            {editingId === item.id ? (
              <input
                autoFocus
                className="field h-8 py-1"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => {
                  if (editText.trim()) actions.updateChecklistItem(task.id, item.id, { text: editText.trim() });
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setEditingId(null);
                  }
                }}
                aria-label="Editar item"
              />
            ) : (
              <button
                className={cn("min-w-0 flex-1 text-left text-sm", item.done ? "text-slate-400 line-through" : "text-slate-100")}
                onClick={() => {
                  setEditingId(item.id);
                  setEditText(item.text);
                }}
                title="Clique para editar"
              >
                {item.text}
              </button>
            )}
            <button
              className="icon-btn size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => actions.removeChecklistItem(task.id, item.id)}
              aria-label={`Remover ${item.text}`}
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          className="field h-10"
          placeholder="Adicionar item ao checklist"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          aria-label="Novo item do checklist"
        />
        <button className="btn-secondary h-10 shrink-0" onClick={add} disabled={!newItem.trim()}>
          <Plus className="size-4" /> Adicionar
        </button>
      </div>
    </section>
  );
}

/* --------------------------------- anexos --------------------------------- */

function AttachmentsSection({ task }: { task: Task }) {
  const { actions } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Formato não suportado", "Envie uma imagem PNG, JPG, WEBP ou GIF.");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Imagem muito grande", "O limite é 1,5 MB para manter o armazenamento local leve.");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      actions.addAttachment(task.id, {
        name: file.name,
        src: String(reader.result),
        kind: "image",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      });
      setUploading(false);
      toast.success("Imagem anexada");
    };
    reader.onerror = () => {
      setUploading(false);
      toast.error("Falha ao ler o arquivo");
    };
    reader.readAsDataURL(file);
  };

  return (
    <section aria-labelledby="att-h">
      <div className="mb-3 flex items-center gap-2">
        <Paperclip className="size-4 text-violet-300" aria-hidden />
        <h3 id="att-h" className="font-display text-sm font-semibold text-white">
          Anexos
        </h3>
        <span className="text-xs text-slate-400">{task.attachments.length}</span>
        <div className="ml-auto flex gap-1">
          <Popover
            align="end"
            trigger={(p) => (
              <button {...p} onClick={p.toggle} className="btn-ghost h-8 px-2.5 text-[13px]">
                <ImagePlus className="size-4" /> Demonstração
              </button>
            )}
            panelClassName="w-72 p-3"
          >
            {(close) => (
              <div>
                <p className="label-xs mb-2">Imagens de demonstração</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(COVER_PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      className="overflow-hidden rounded-xl ring-1 ring-white/10 transition hover:ring-cyan-300/60"
                      onClick={() => {
                        actions.addAttachment(task.id, { name: `${p.name.toLowerCase()}.png`, src: `cover:${key}`, kind: "image", size: "1.4 MB" });
                        close();
                        toast.success("Imagem anexada");
                      }}
                      aria-label={`Anexar ${p.name}`}
                    >
                      <Cover src={`cover:${key}`} className="h-14 w-full" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Popover>
          <button className="btn-ghost h-8 px-2.5 text-[13px]" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="size-4" /> {uploading ? "Enviando…" : "Enviar"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {task.attachments.length === 0 ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-1 rounded-2xl border border-dashed border-white/15 py-6 text-sm text-slate-400 transition hover:border-white/30 hover:text-slate-200"
        >
          <ImagePlus className="size-5" />
          Clique para enviar uma imagem (até 1,5 MB)
        </button>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {task.attachments.map((a) => (
            <li key={a.id} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <div className="relative">
                <Cover src={a.src} alt={a.name} className="h-24 w-full" />
                {task.coverId === a.id && (
                  <span className="chip absolute top-2 left-2 bg-black/50 text-white ring-white/20 backdrop-blur">Capa</span>
                )}
              </div>
              <div className="p-2.5">
                <p className="truncate text-[13px] font-semibold text-slate-100" title={a.name}>
                  {a.name}
                </p>
                <p className="text-xs text-slate-400">{a.size ?? "Imagem"}</p>
                <div className="mt-2 flex gap-1">
                  <button
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-cyan-200 hover:bg-white/[0.06]"
                    onClick={() => actions.setCover(task.id, task.coverId === a.id ? undefined : a.id)}
                  >
                    {task.coverId === a.id ? "Remover capa" : "Usar como capa"}
                  </button>
                  <button
                    className="ml-auto rounded-lg px-2 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/10"
                    onClick={() => setRemoveId(a.id)}
                    aria-label={`Remover ${a.name}`}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        title="Remover anexo?"
        description="O arquivo será removido desta tarefa."
        confirmLabel="Remover"
        onConfirm={() => {
          if (removeId) actions.removeAttachment(task.id, removeId);
          toast.success("Anexo removido");
        }}
      />
    </section>
  );
}

/* --------------------------- comentários / histórico --------------------------- */

function ActivityTabs({ task }: { task: Task }) {
  const state = useAppState();
  const { actions } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<"comments" | "history">("comments");
  const [text, setText] = useState("");
  const me = state.members[state.currentUserId];

  const send = () => {
    const v = text.trim();
    if (!v) return;
    actions.addComment(task.id, v);
    setText("");
    toast.success("Comentário publicado");
  };

  return (
    <section>
      <div role="tablist" aria-label="Comentários e histórico" className="mb-4 inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
        <button
          role="tab"
          aria-selected={tab === "comments"}
          onClick={() => setTab("comments")}
          className={cn("flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold transition", tab === "comments" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")}
        >
          <MessageSquare className="size-4" /> Comentários
          <span className="text-xs text-slate-400">{task.comments.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === "history"}
          onClick={() => setTab("history")}
          className={cn("flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold transition", tab === "history" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")}
        >
          <History className="size-4" /> Histórico
          <span className="text-xs text-slate-400">{task.history.length}</span>
        </button>
      </div>

      {tab === "comments" ? (
        <div role="tabpanel" className="space-y-4">
          <div className="flex gap-3">
            <Avatar member={me} size="md" />
            <div className="flex-1">
              <textarea
                className="field min-h-20 resize-none"
                placeholder="Escreva um comentário…  (Ctrl + Enter para enviar)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
                }}
                aria-label="Novo comentário"
              />
              <div className="mt-2 flex justify-end">
                <button className="btn-primary h-9" onClick={send} disabled={!text.trim()}>
                  <Send className="size-4" /> Comentar
                </button>
              </div>
            </div>
          </div>
          {task.comments.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Nenhum comentário ainda. Comece a conversa.</p>}
          <ul className="space-y-4">
            {[...task.comments].reverse().map((c) => {
              const m = state.members[c.memberId];
              return (
                <li key={c.id} className="group flex gap-3">
                  <Avatar member={m} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-white">{m?.name ?? "Membro"}</span>{" "}
                      <span className="text-xs text-slate-400">{relativeTime(c.createdAt)}</span>
                    </p>
                    <p className="mt-1 rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
                      {c.text}
                    </p>
                    {c.memberId === state.currentUserId && (
                      <button
                        className="mt-1 text-xs text-slate-400 hover:text-rose-200"
                        onClick={() => {
                          actions.deleteComment(task.id, c.id);
                          toast.info("Comentário removido");
                        }}
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <ol role="tabpanel" className="relative space-y-4 border-l border-white/10 pl-5">
          {[...task.history].reverse().map((h) => {
            const m = state.members[h.memberId];
            return (
              <li key={h.id} className="relative">
                <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-[#0e0e2a] bg-violet-400" aria-hidden />
                <p className="text-sm text-slate-200">
                  <span className="font-semibold text-white">{m?.name ?? "Membro"}</span> {h.text}
                </p>
                <p className="text-xs text-slate-400">{relativeTime(h.createdAt)}</p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/* ------------------------------ propriedades ------------------------------ */

function Properties({ task }: { task: Task }) {
  const state = useAppState();
  const { actions } = useStore();
  const toast = useToast();
  const board = state.boards[task.boardId];
  const done = !!state.columns[task.columnId]?.isDone;
  const ds = dueState(task, done);
  const [newLabel, setNewLabel] = useState("");
  const [newLabelColor, setNewLabelColor] = useState<LabelColor>("violet");

  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="prop-status" className="label-xs mb-1.5 block">
          Status
        </label>
        <select
          id="prop-status"
          className="field"
          value={task.columnId}
          onChange={(e) => {
            actions.moveTask(task.id, e.target.value, null);
            toast.success("Status atualizado", `Movida para ${state.columns[e.target.value]?.title}`);
          }}
        >
          {board.columnIds.map((c) => (
            <option key={c} value={c}>
              {state.columns[c].title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="label-xs mb-1.5 flex items-center gap-1.5" id="prio-label">
          <Flag className="size-3.5" /> Prioridade
        </p>
        <div role="radiogroup" aria-labelledby="prio-label" className="grid grid-cols-2 gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.id}
              role="radio"
              aria-checked={task.priority === p.id}
              onClick={() => actions.updateTask(task.id, { priority: p.id as Priority })}
              className={cn(
                "flex h-9 items-center gap-2 rounded-xl border px-2.5 text-[13px] font-semibold transition",
                task.priority === p.id ? cn("border-transparent ring-1", priorityStyle[p.id].chip) : "border-white/10 text-slate-300 hover:border-white/25",
              )}
            >
              <span className={cn("size-2 rounded-full", priorityStyle[p.id].dot)} aria-hidden />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="label-xs flex items-center gap-1.5">
            <Users className="size-3.5" /> Responsáveis
          </p>
          <Popover
            align="end"
            trigger={(p) => (
              <button {...p} onClick={p.toggle} className="rounded-lg px-2 py-0.5 text-xs font-semibold text-cyan-200 hover:bg-white/[0.06]">
                Editar
              </button>
            )}
          >
            {Object.values(state.members).map((m) => {
              const on = task.assigneeIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  role="menuitemcheckbox"
                  aria-checked={on}
                  onClick={() => actions.updateTask(task.id, { assigneeIds: toggle(task.assigneeIds, m.id) })}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-slate-200 hover:bg-white/[0.08]"
                >
                  <Avatar member={m} size="sm" title={false} />
                  <span className="flex-1">{m.name}</span>
                  {on && <Check className="size-4 text-cyan-300" />}
                </button>
              );
            })}
          </Popover>
        </div>
        {task.assigneeIds.length === 0 ? (
          <p className="text-sm text-slate-400">Ninguém atribuído</p>
        ) : (
          <ul className="space-y-1.5">
            {task.assigneeIds.map((id) => {
              const m = state.members[id];
              return (
                <li key={id} className="flex items-center gap-2.5 text-sm text-slate-100">
                  <Avatar member={m} size="sm" />
                  <span className="truncate">{m?.name}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <p className="label-xs flex items-center gap-1.5">
          <CalendarDays className="size-3.5" /> Datas
        </p>
        <div>
          <label htmlFor="prop-start" className="mb-1 block text-xs text-slate-400">
            Início
          </label>
          <input
            id="prop-start"
            type="date"
            className="field h-10 py-1.5"
            value={task.startDate ?? ""}
            max={task.dueDate}
            onChange={(e) => {
              const v = e.target.value || undefined;
              if (v && task.dueDate && v > task.dueDate) {
                toast.error("Data inválida", "O início não pode ser depois do prazo.");
                return;
              }
              actions.updateTask(task.id, { startDate: v });
            }}
          />
        </div>
        <div>
          <label htmlFor="prop-due" className="mb-1 flex items-center justify-between text-xs text-slate-400">
            Prazo
            {ds && task.dueDate && (
              <span
                className={cn(
                  "font-semibold",
                  ds === "overdue" && "text-rose-300",
                  ds === "soon" && "text-amber-200",
                  ds === "done" && "text-emerald-300",
                  ds === "later" && "text-slate-300",
                )}
              >
                {ds === "overdue" ? "Atrasada · " : ""}
                {dueLabel(task.dueDate)}
              </span>
            )}
          </label>
          <input
            id="prop-due"
            type="date"
            className="field h-10 py-1.5"
            value={task.dueDate ?? ""}
            min={task.startDate}
            onChange={(e) => {
              const v = e.target.value || undefined;
              if (v && task.startDate && v < task.startDate) {
                toast.error("Data inválida", "O prazo não pode ser anterior ao início.");
                return;
              }
              actions.updateTask(task.id, { dueDate: v });
            }}
          />
          {task.dueDate && <p className="mt-1 text-xs text-slate-400 first-letter:uppercase">{formatLong(task.dueDate)}</p>}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="label-xs flex items-center gap-1.5">
            <Tag className="size-3.5" /> Etiquetas
          </p>
          <Popover
            align="end"
            panelClassName="w-64"
            trigger={(p) => (
              <button {...p} onClick={p.toggle} className="rounded-lg px-2 py-0.5 text-xs font-semibold text-cyan-200 hover:bg-white/[0.06]">
                Editar
              </button>
            )}
          >
            <div>
              {Object.values(state.labels).map((l) => {
                const on = task.labelIds.includes(l.id);
                return (
                  <button
                    key={l.id}
                    role="menuitemcheckbox"
                    aria-checked={on}
                    onClick={() => actions.updateTask(task.id, { labelIds: toggle(task.labelIds, l.id) })}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-slate-200 hover:bg-white/[0.08]"
                  >
                    <span className={cn("h-2.5 w-6 rounded-full", labelStyle[l.color].bar)} aria-hidden />
                    <span className="flex-1">{l.name}</span>
                    {on && <Check className="size-4 text-cyan-300" />}
                  </button>
                );
              })}
              <MenuSeparator />
              <form
                className="space-y-2 p-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = newLabel.trim();
                  if (!n) return;
                  if (Object.values(state.labels).some((l) => l.name.toLowerCase() === n.toLowerCase())) {
                    toast.error("Etiqueta já existe");
                    return;
                  }
                  const id = actions.createLabel(n, newLabelColor);
                  actions.updateTask(task.id, { labelIds: [...task.labelIds, id] });
                  setNewLabel("");
                  toast.success("Etiqueta criada");
                }}
              >
                <input className="field h-9 py-1.5" placeholder="Nova etiqueta" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} aria-label="Nome da nova etiqueta" maxLength={24} />
                <div className="flex items-center gap-1.5">
                  {LABEL_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewLabelColor(c)}
                      aria-label={`Cor ${c}`}
                      aria-pressed={newLabelColor === c}
                      className={cn("size-6 rounded-full ring-2", labelStyle[c].bar, newLabelColor === c ? "ring-white" : "ring-transparent")}
                    />
                  ))}
                </div>
                <button type="submit" className="btn-secondary h-8 w-full text-[13px]" disabled={!newLabel.trim()}>
                  Criar etiqueta
                </button>
              </form>
            </div>
          </Popover>
        </div>
        {task.labelIds.length === 0 ? (
          <p className="text-sm text-slate-400">Sem etiquetas</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {task.labelIds.map((l) => (
              <LabelChip key={l} label={state.labels[l]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
