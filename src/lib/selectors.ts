import type { AppState, BoardFilters, SortMode, Task } from "./types";
import { addDays, diffDays, priorityWeight, today, toISODate } from "./utils";

export function isDone(state: AppState, task: Task) {
  return !!state.columns[task.columnId]?.isDone;
}

export function activeTasks(state: AppState, boardId?: string) {
  return Object.values(state.tasks).filter(
    (t) => !t.archived && (!boardId || t.boardId === boardId) && state.boards[t.boardId],
  );
}

export function taskStats(state: AppState, boardId?: string) {
  const t0 = today();
  let open = 0,
    done = 0,
    overdue = 0,
    soon = 0;
  for (const t of activeTasks(state, boardId)) {
    if (isDone(state, t)) {
      done++;
      continue;
    }
    open++;
    if (t.dueDate) {
      const d = diffDays(t.dueDate, t0);
      if (d < 0) overdue++;
      else if (d <= 3) soon++;
    }
  }
  return { open, done, overdue, soon, total: open + done };
}

export function completedSeries(state: AppState, days = 14) {
  const t0 = today();
  const buckets = new Map<string, { date: string; concluidas: number; criadas: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(t0, -i);
    buckets.set(date, { date, concluidas: 0, criadas: 0 });
  }
  for (const t of Object.values(state.tasks)) {
    if (!state.boards[t.boardId]) continue;
    if (t.completedAt && isDone(state, t)) {
      const k = toISODate(new Date(t.completedAt));
      const b = buckets.get(k);
      if (b) b.concluidas++;
    }
    const c = buckets.get(toISODate(new Date(t.createdAt)));
    if (c) c.criadas++;
  }
  return [...buckets.values()];
}

export function boardProgress(state: AppState, boardId: string) {
  const tasks = activeTasks(state, boardId);
  const done = tasks.filter((t) => isDone(state, t)).length;
  return { total: tasks.length, done, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
}

export function priorityDistribution(state: AppState) {
  const counts = { urgente: 0, alta: 0, media: 0, baixa: 0 };
  for (const t of activeTasks(state)) if (!isDone(state, t)) counts[t.priority]++;
  return counts;
}

/** agrupa por estágio normalizado entre quadros: posição relativa da coluna */
export function statusDistribution(state: AppState) {
  const buckets = { Planejamento: 0, "Em execução": 0, Revisão: 0, Concluído: 0 };
  for (const t of activeTasks(state)) {
    const b = state.boards[t.boardId];
    const col = state.columns[t.columnId];
    if (!b || !col) continue;
    if (col.isDone) {
      buckets["Concluído"]++;
      continue;
    }
    const idx = b.columnIds.indexOf(col.id);
    const ratio = b.columnIds.length > 1 ? idx / (b.columnIds.length - 1) : 0;
    if (ratio < 0.4) buckets.Planejamento++;
    else if (ratio < 0.7) buckets["Em execução"]++;
    else buckets["Revisão"]++;
  }
  return buckets;
}

export function upcomingTasks(state: AppState, days = 7, includeOverdue = true) {
  const t0 = today();
  return activeTasks(state)
    .filter((t) => {
      if (!t.dueDate || isDone(state, t)) return false;
      const d = diffDays(t.dueDate, t0);
      return (includeOverdue || d >= 0) && d <= days;
    })
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : priorityWeight[b.priority] - priorityWeight[a.priority]));
}

export function memberWorkload(state: AppState, boardId?: string) {
  const map = new Map<string, number>();
  for (const t of activeTasks(state, boardId)) {
    if (isDone(state, t)) continue;
    for (const m of t.assigneeIds) map.set(m, (map.get(m) ?? 0) + 1);
  }
  return map;
}

export const emptyFilters: BoardFilters = {
  query: "",
  assigneeIds: [],
  labelIds: [],
  priorities: [],
  showArchived: false,
};

export function hasActiveFilters(f: BoardFilters) {
  return !!(f.query.trim() || f.assigneeIds.length || f.labelIds.length || f.priorities.length || f.showArchived);
}

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function matchesFilters(task: Task, f: BoardFilters, state: AppState) {
  if (task.archived !== f.showArchived) return false;
  if (f.assigneeIds.length && !f.assigneeIds.some((m) => task.assigneeIds.includes(m))) return false;
  if (f.labelIds.length && !f.labelIds.some((l) => task.labelIds.includes(l))) return false;
  if (f.priorities.length && !f.priorities.includes(task.priority)) return false;
  const q = normalize(f.query.trim());
  if (q) {
    const hay = normalize(
      [
        task.title,
        task.description,
        ...task.labelIds.map((l) => state.labels[l]?.name ?? ""),
        ...task.assigneeIds.map((m) => state.members[m]?.name ?? ""),
      ].join(" "),
    );
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function sortTasks(tasks: Task[], sort: SortMode) {
  if (sort === "manual") return tasks;
  const arr = [...tasks];
  if (sort === "due") arr.sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  if (sort === "priority") arr.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  if (sort === "title") arr.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  if (sort === "recent") arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return arr;
}

export function searchAll(state: AppState, query: string) {
  const q = normalize(query.trim());
  if (!q) return { boards: [], tasks: [] };
  const boards = state.boardOrder
    .map((id) => state.boards[id])
    .filter((b) => b && normalize(b.title + " " + b.description).includes(q))
    .slice(0, 4);
  const tasks = Object.values(state.tasks)
    .filter((t) => state.boards[t.boardId] && normalize(t.title + " " + t.description).includes(q))
    .sort((a, b) => Number(a.archived) - Number(b.archived))
    .slice(0, 8);
  return { boards, tasks };
}
