"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  AppState,
  Attachment,
  BoardAccent,
  ChecklistItem,
  LabelColor,
  Settings,
  Task,
} from "./types";
import { createSeed, STATE_VERSION } from "./seed";
import { sanitizeState } from "./migrate";
import { formatShort, priorityName, uid } from "./utils";

const STORAGE_KEY = "jota-boards:v1";

type Recipe = (draft: AppState) => void;

export interface NewTaskInput {
  title: string;
  description?: string;
  priority?: Task["priority"];
  dueDate?: string;
  startDate?: string;
  assigneeIds?: string[];
  labelIds?: string[];
  position?: "top" | "bottom";
}

function now() {
  return new Date().toISOString();
}

function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.version === STATE_VERSION && parsed.boards && parsed.tasks) return sanitizeState(parsed);
    }
  } catch {
    /* dados corrompidos: volta para a demonstração */
  }
  return createSeed();
}

function useStoreValue() {
  const [state, setState] = useState<AppState | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [newTaskTarget, setNewTaskTarget] = useState<{ boardId?: string; columnId?: string; dueDate?: string } | null>(null);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const saveTimer = useRef<number | null>(null);

  // hidrata a partir do localStorage apenas no cliente
  useEffect(() => {
    setState(loadState());
  }, []);

  // persiste com pequeno debounce
  useEffect(() => {
    if (!state) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setSaveError(false);
      } catch {
        setSaveError(true);
      }
    }, 150);
  }, [state]);

  // sincroniza entre abas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch {
          /* ignora */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // preferência de movimento
  useEffect(() => {
    if (!state) return;
    document.documentElement.dataset.motion = state.settings.reducedMotion;
  }, [state?.settings.reducedMotion, state]);

  useEffect(() => {
    if (!state) return;
    document.documentElement.dataset.theme = state.settings.theme ?? "dark";
  }, [state?.settings.theme, state]);

  const mutate = useCallback((recipe: Recipe) => {
    setState((prev) => {
      if (!prev) return prev;
      const draft = structuredClone(prev);
      recipe(draft);
      return draft;
    });
  }, []);

  const actions = useMemo(() => {
    const log = (d: AppState, text: string, boardId?: string, taskId?: string) => {
      d.activity.unshift({ id: uid("a"), memberId: d.currentUserId, text, boardId, taskId, createdAt: now() });
      d.activity = d.activity.slice(0, 200);
    };
    const hist = (task: Task, d: AppState, text: string) => {
      task.history.push({ id: uid("h"), memberId: d.currentUserId, text, createdAt: now() });
    };

    return {
      /* ------------------------------ quadros ------------------------------ */
      createBoard(input: { title: string; description: string; accent: BoardAccent; columns?: string[] }) {
        const id = uid("b");
        mutate((d) => {
          const titles = input.columns ?? ["Ideias", "A fazer", "Em andamento", "Em revisão", "Concluído"];
          const columnIds = titles.map((title, i) => {
            const cid = uid("c");
            d.columns[cid] = { id: cid, boardId: id, title, taskIds: [], isDone: i === titles.length - 1 };
            return cid;
          });
          d.boards[id] = {
            id,
            title: input.title,
            description: input.description,
            accent: input.accent,
            memberIds: [d.currentUserId],
            columnIds,
            favorite: false,
            createdAt: now(),
          };
          d.boardOrder.push(id);
          log(d, `criou o quadro “${input.title}”`, id);
        });
        return id;
      },
      updateBoard(id: string, patch: Partial<{ title: string; description: string; accent: BoardAccent; memberIds: string[] }>) {
        mutate((d) => {
          const b = d.boards[id];
          if (!b) return;
          if (patch.title && patch.title !== b.title) log(d, `renomeou o quadro para “${patch.title}”`, id);
          Object.assign(b, patch);
        });
      },
      toggleFavorite(id: string) {
        mutate((d) => {
          const b = d.boards[id];
          if (b) b.favorite = !b.favorite;
        });
      },
      deleteBoard(id: string) {
        mutate((d) => {
          const b = d.boards[id];
          if (!b) return;
          for (const cid of b.columnIds) delete d.columns[cid];
          for (const t of Object.values(d.tasks)) if (t.boardId === id) delete d.tasks[t.id];
          delete d.boards[id];
          d.boardOrder = d.boardOrder.filter((x) => x !== id);
          d.activity = d.activity.filter((a) => a.boardId !== id);
          d.notifications = d.notifications.filter((n) => n.boardId !== id);
          log(d, `excluiu o quadro “${b.title}”`);
        });
      },

      /* ------------------------------ colunas ------------------------------ */
      createColumn(boardId: string, title: string) {
        const id = uid("c");
        mutate((d) => {
          const b = d.boards[boardId];
          if (!b) return;
          d.columns[id] = { id, boardId, title, taskIds: [] };
          b.columnIds.push(id);
          log(d, `criou a coluna “${title}”`, boardId);
        });
        return id;
      },
      renameColumn(id: string, title: string) {
        mutate((d) => {
          const c = d.columns[id];
          if (c) c.title = title;
        });
      },
      setColumnDone(id: string, isDone: boolean) {
        mutate((d) => {
          const c = d.columns[id];
          if (!c) return;
          c.isDone = isDone;
          for (const tid of c.taskIds) {
            const t = d.tasks[tid];
            if (!t) continue;
            t.completedAt = isDone ? t.completedAt ?? now() : undefined;
          }
        });
      },
      deleteColumn(id: string) {
        mutate((d) => {
          const c = d.columns[id];
          if (!c) return;
          for (const tid of c.taskIds) delete d.tasks[tid];
          const b = d.boards[c.boardId];
          if (b) b.columnIds = b.columnIds.filter((x) => x !== id);
          delete d.columns[id];
          log(d, `excluiu a coluna “${c.title}”`, c.boardId);
        });
      },
      moveColumn(boardId: string, from: number, to: number) {
        mutate((d) => {
          const b = d.boards[boardId];
          if (!b) return;
          const [moved] = b.columnIds.splice(from, 1);
          b.columnIds.splice(to, 0, moved);
        });
      },

      /* ------------------------------ tarefas ------------------------------ */
      createTask(boardId: string, columnId: string, input: NewTaskInput) {
        const id = uid("t");
        mutate((d) => {
          const col = d.columns[columnId];
          if (!col) return;
          const task: Task = {
            id,
            boardId,
            columnId,
            title: input.title.trim(),
            description: input.description?.trim() ?? "",
            labelIds: input.labelIds ?? [],
            priority: input.priority ?? "media",
            assigneeIds: input.assigneeIds ?? [],
            startDate: input.startDate || undefined,
            dueDate: input.dueDate || undefined,
            checklist: [],
            comments: [],
            attachments: [],
            history: [{ id: uid("h"), memberId: d.currentUserId, text: `criou esta tarefa em ${col.title}`, createdAt: now() }],
            createdAt: now(),
            completedAt: col.isDone ? now() : undefined,
            archived: false,
          };
          d.tasks[id] = task;
          if (input.position === "top") col.taskIds.unshift(id);
          else col.taskIds.push(id);
          log(d, `criou “${task.title}”`, boardId, id);
        });
        return id;
      },

      updateTask(id: string, patch: Partial<Omit<Task, "id" | "boardId" | "columnId">>) {
        mutate((d) => {
          const t = d.tasks[id];
          if (!t) return;
          if (patch.title !== undefined && patch.title !== t.title) hist(t, d, `renomeou para “${patch.title}”`);
          if (patch.description !== undefined && patch.description !== t.description) hist(t, d, "editou a descrição");
          if (patch.priority && patch.priority !== t.priority) hist(t, d, `alterou a prioridade para ${priorityName[patch.priority]}`);
          if ("dueDate" in patch && patch.dueDate !== t.dueDate)
            hist(t, d, patch.dueDate ? `definiu o prazo para ${formatShort(patch.dueDate)}` : "removeu o prazo");
          if ("startDate" in patch && patch.startDate !== t.startDate)
            hist(t, d, patch.startDate ? `definiu o início para ${formatShort(patch.startDate)}` : "removeu a data de início");
          if (patch.assigneeIds && patch.assigneeIds.join() !== t.assigneeIds.join()) {
            const added = patch.assigneeIds.filter((m) => !t.assigneeIds.includes(m));
            const removed = t.assigneeIds.filter((m) => !patch.assigneeIds!.includes(m));
            added.forEach((m) => hist(t, d, `adicionou ${d.members[m]?.name ?? "membro"} como responsável`));
            removed.forEach((m) => hist(t, d, `removeu ${d.members[m]?.name ?? "membro"} dos responsáveis`));
          }
          if (patch.labelIds && patch.labelIds.join() !== t.labelIds.join()) hist(t, d, "atualizou as etiquetas");
          Object.assign(t, patch);
        });
      },

      moveTask(taskId: string, toColumnId: string, beforeTaskId: string | null) {
        mutate((d) => {
          const t = d.tasks[taskId];
          const to = d.columns[toColumnId];
          if (!t || !to) return;
          const from = d.columns[t.columnId];
          if (from) from.taskIds = from.taskIds.filter((x) => x !== taskId);
          const ids = to.taskIds.filter((x) => x !== taskId);
          const idx = beforeTaskId ? ids.indexOf(beforeTaskId) : -1;
          if (idx >= 0) ids.splice(idx, 0, taskId);
          else ids.push(taskId);
          to.taskIds = ids;
          const changedColumn = t.columnId !== toColumnId;
          t.columnId = toColumnId;
          if (changedColumn) {
            hist(t, d, `moveu para ${to.title}`);
            if (to.isDone && !from?.isDone) {
              t.completedAt = now();
              log(d, `concluiu “${t.title}”`, t.boardId, t.id);
            } else if (!to.isDone) {
              t.completedAt = undefined;
              log(d, `moveu “${t.title}” para ${to.title}`, t.boardId, t.id);
            }
          }
        });
      },

      toggleDone(taskId: string) {
        mutate((d) => {
          const t = d.tasks[taskId];
          if (!t) return;
          const b = d.boards[t.boardId];
          const from = d.columns[t.columnId];
          if (!b || !from) return;
          const target = from.isDone
            ? b.columnIds.map((c) => d.columns[c]).find((c) => c && !c.isDone)
            : b.columnIds.map((c) => d.columns[c]).find((c) => c?.isDone);
          if (!target) return;
          from.taskIds = from.taskIds.filter((x) => x !== taskId);
          target.taskIds.push(taskId);
          t.columnId = target.id;
          hist(t, d, `moveu para ${target.title}`);
          if (target.isDone) {
            t.completedAt = now();
            log(d, `concluiu “${t.title}”`, t.boardId, t.id);
          } else {
            t.completedAt = undefined;
            log(d, `reabriu “${t.title}”`, t.boardId, t.id);
          }
        });
      },

      duplicateTask(taskId: string) {
        const id = uid("t");
        mutate((d) => {
          const t = d.tasks[taskId];
          if (!t) return;
          const copy: Task = structuredClone(t);
          copy.id = id;
          copy.title = `${t.title} (cópia)`;
          copy.comments = [];
          copy.createdAt = now();
          copy.archived = false;
          copy.checklist = copy.checklist.map((c) => ({ ...c, id: uid("ck") }));
          copy.attachments = copy.attachments.map((a) => {
            const nid = uid("att");
            if (copy.coverId === a.id) copy.coverId = nid;
            return { ...a, id: nid };
          });
          copy.history = [{ id: uid("h"), memberId: d.currentUserId, text: `duplicou a partir de “${t.title}”`, createdAt: now() }];
          d.tasks[id] = copy;
          const col = d.columns[t.columnId];
          const idx = col.taskIds.indexOf(taskId);
          col.taskIds.splice(idx + 1, 0, id);
          log(d, `duplicou “${t.title}”`, t.boardId, id);
        });
        return id;
      },

      archiveTask(taskId: string, archived: boolean) {
        mutate((d) => {
          const t = d.tasks[taskId];
          if (!t) return;
          t.archived = archived;
          hist(t, d, archived ? "arquivou a tarefa" : "restaurou a tarefa");
          log(d, `${archived ? "arquivou" : "restaurou"} “${t.title}”`, t.boardId, t.id);
        });
      },

      deleteTask(taskId: string) {
        mutate((d) => {
          const t = d.tasks[taskId];
          if (!t) return;
          const col = d.columns[t.columnId];
          if (col) col.taskIds = col.taskIds.filter((x) => x !== taskId);
          delete d.tasks[taskId];
          d.notifications = d.notifications.filter((n) => n.taskId !== taskId);
          log(d, `excluiu “${t.title}”`, t.boardId);
        });
      },

      /* --------------------------- detalhes da tarefa --------------------------- */
      addComment(taskId: string, text: string) {
        mutate((d) => {
          const t = d.tasks[taskId];
          if (!t) return;
          t.comments.push({ id: uid("cm"), memberId: d.currentUserId, text, createdAt: now() });
          hist(t, d, "comentou");
          log(d, `comentou em “${t.title}”`, t.boardId, t.id);
        });
      },
      deleteComment(taskId: string, commentId: string) {
        mutate((d) => {
          const t = d.tasks[taskId];
          if (t) t.comments = t.comments.filter((c) => c.id !== commentId);
        });
      },
      addChecklistItem(taskId: string, text: string) {
        mutate((d) => {
          const t = d.tasks[taskId];
          if (!t) return;
          t.checklist.push({ id: uid("ck"), text, done: false });
          hist(t, d, `adicionou “${text}” ao checklist`);
        });
      },
      updateChecklistItem(taskId: string, itemId: string, patch: Partial<ChecklistItem>) {
        mutate((d) => {
          const t = d.tasks[taskId];
          const item = t?.checklist.find((c) => c.id === itemId);
          if (!t || !item) return;
          if (patch.done !== undefined && patch.done !== item.done)
            hist(t, d, `${patch.done ? "concluiu" : "desmarcou"} “${item.text}”`);
          Object.assign(item, patch);
        });
      },
      removeChecklistItem(taskId: string, itemId: string) {
        mutate((d) => {
          const t = d.tasks[taskId];
          if (t) t.checklist = t.checklist.filter((c) => c.id !== itemId);
        });
      },
      addAttachment(taskId: string, att: Omit<Attachment, "id" | "createdAt">) {
        const id = uid("att");
        mutate((d) => {
          const t = d.tasks[taskId];
          if (!t) return;
          t.attachments.push({ ...att, id, createdAt: now() });
          if (!t.coverId && att.kind === "image") t.coverId = id;
          hist(t, d, `anexou ${att.name}`);
          log(d, `anexou ${att.name} em “${t.title}”`, t.boardId, t.id);
        });
        return id;
      },
      removeAttachment(taskId: string, attId: string) {
        mutate((d) => {
          const t = d.tasks[taskId];
          if (!t) return;
          const a = t.attachments.find((x) => x.id === attId);
          t.attachments = t.attachments.filter((x) => x.id !== attId);
          if (t.coverId === attId) t.coverId = undefined;
          if (a) hist(t, d, `removeu o anexo ${a.name}`);
        });
      },
      setCover(taskId: string, attId: string | undefined) {
        mutate((d) => {
          const t = d.tasks[taskId];
          if (t) t.coverId = attId;
        });
      },

      /* ------------------------------ diversos ------------------------------ */
      createLabel(name: string, color: LabelColor) {
        const id = uid("l");
        mutate((d) => {
          d.labels[id] = { id, name, color };
        });
        return id;
      },
      markAllNotificationsRead() {
        mutate((d) => {
          d.notifications.forEach((n) => (n.read = true));
        });
      },
      markNotificationRead(id: string) {
        mutate((d) => {
          const n = d.notifications.find((x) => x.id === id);
          if (n) n.read = true;
        });
      },
      updateSettings(patch: Partial<Settings>) {
        mutate((d) => {
          Object.assign(d.settings, patch);
        });
      },
      updateProfile(patch: { name?: string; role?: string; workspaceName?: string }) {
        mutate((d) => {
          const me = d.members[d.currentUserId];
          if (patch.name) {
            me.name = patch.name;
            const parts = patch.name.trim().split(/\s+/);
            me.initials = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
          }
          if (patch.role !== undefined) me.role = patch.role;
          if (patch.workspaceName) d.workspaceName = patch.workspaceName;
        });
      },
      resetDemo() {
        setState(createSeed());
      },
      importState(next: AppState) {
        setState(sanitizeState(next));
      },
    };
  }, [mutate]);

  return {
    state,
    hydrated: state !== null,
    saveError,
    actions,
    openTaskId,
    openTask: setOpenTaskId,
    newTaskTarget,
    openNewTask: setNewTaskTarget,
    createBoardOpen,
    setCreateBoardOpen,
    searchOpen,
    setSearchOpen,
  };
}

type StoreValue = ReturnType<typeof useStoreValue>;
const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore precisa de StoreProvider");
  return ctx;
}

/** use apenas dentro de componentes renderizados após a hidratação */
export function useAppState() {
  const { state } = useStore();
  if (!state) throw new Error("estado ainda não carregado");
  return state;
}

export type Actions = StoreValue["actions"];
