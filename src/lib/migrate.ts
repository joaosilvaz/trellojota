import type { AppState } from "./types";
import { createSeed } from "./seed";

/** Mantém apenas o usuário atual: remove outros membros e reatribui o que era deles ao usuário. */
export function sanitizeState(input: AppState): AppState {
  const s = structuredClone(input);
  const me = s.currentUserId;
  const removed = Object.values(s.members).filter((m) => m.id !== me);
  s.members = { [me]: s.members[me] };
  const fix = (id: string) => (s.members[id] ? id : me);
  const uniq = (a: string[]) => [...new Set(a.map(fix))];
  for (const b of Object.values(s.boards)) b.memberIds = [me];
  for (const t of Object.values(s.tasks)) {
    t.assigneeIds = uniq(t.assigneeIds);
    t.comments.forEach((c) => (c.memberId = fix(c.memberId)));
    t.history.forEach((h) => (h.memberId = fix(h.memberId)));
  }
  s.activity.forEach((a) => (a.memberId = fix(a.memberId)));
  s.notifications = s.notifications.filter((n) => !removed.some((m) => n.text.includes(m.name)));
  s.settings.theme ??= "dark";
  if (s.members[me] && !s.members[me].photo) s.members[me].photo = "/jota.jpg";
  // adiciona o quadro do Instagram uma única vez em dados já existentes
  if (!s.settings.instagramBoardAdded) {
    s.settings.instagramBoardAdded = true;
    const seed = createSeed();
    const b = seed.boards.b_instagram;
    if (b && !s.boards[b.id]) {
      s.boards[b.id] = b;
      s.boardOrder.unshift(b.id);
      for (const cid of b.columnIds) s.columns[cid] = seed.columns[cid];
      for (const t of Object.values(seed.tasks)) if (t.boardId === b.id) s.tasks[t.id] = t;
    }
  }
  return s;
}
