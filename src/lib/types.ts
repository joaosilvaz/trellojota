export type Priority = "baixa" | "media" | "alta" | "urgente";

export type LabelColor =
  | "violet"
  | "blue"
  | "cyan"
  | "amber"
  | "green"
  | "pink"
  | "red";

export interface Member {
  id: string;
  name: string;
  initials: string;
  role: string;
  /** gradient key used by the avatar */
  hue: number;
}

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Comment {
  id: string;
  memberId: string;
  text: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  memberId: string;
  text: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  /** "cover:<preset>" for generated art, or a data URL for uploaded images */
  src: string;
  kind: "image" | "file";
  size?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  labelIds: string[];
  priority: Priority;
  assigneeIds: string[];
  startDate?: string;
  dueDate?: string;
  checklist: ChecklistItem[];
  comments: Comment[];
  attachments: Attachment[];
  /** attachment id used as the card preview */
  coverId?: string;
  history: HistoryEntry[];
  createdAt: string;
  completedAt?: string;
  archived: boolean;
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  taskIds: string[];
  /** tasks in this column count as completed */
  isDone?: boolean;
}

export type BoardAccent = "violet" | "blue" | "cyan" | "pink" | "amber" | "green";

export interface Board {
  id: string;
  title: string;
  description: string;
  accent: BoardAccent;
  memberIds: string[];
  columnIds: string[];
  favorite: boolean;
  createdAt: string;
}

export interface Activity {
  id: string;
  memberId: string;
  text: string;
  boardId?: string;
  taskId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  text: string;
  taskId?: string;
  boardId?: string;
  read: boolean;
  createdAt: string;
}

export interface Settings {
  reducedMotion: "system" | "reduce";
  sidebarCollapsed: boolean;
}

export interface AppState {
  version: number;
  currentUserId: string;
  workspaceName: string;
  members: Record<string, Member>;
  labels: Record<string, Label>;
  boards: Record<string, Board>;
  boardOrder: string[];
  columns: Record<string, Column>;
  tasks: Record<string, Task>;
  activity: Activity[];
  notifications: Notification[];
  settings: Settings;
}

export type ViewMode = "board" | "list" | "calendar";

export type SortMode = "manual" | "due" | "priority" | "title" | "recent";

export interface BoardFilters {
  query: string;
  assigneeIds: string[];
  labelIds: string[];
  priorities: Priority[];
  showArchived: boolean;
}
