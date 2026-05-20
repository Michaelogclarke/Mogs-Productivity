export type TaskStatus = 'todo' | 'doing' | 'done' | 'cancelled' | 'archived';
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  userId: string;
  projectId: string | null;
  areaId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  scheduledFor: string | null;
  reminderAt: string | null;
  completedAt: string | null;
  archivedAt: string | null;
  rawInput: string | null;
  parsedMetadata: Record<string, unknown> | null;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  projectId?: string | null;
  areaId?: string | null;
  dueDate?: string | null;
  scheduledFor?: string | null;
  reminderAt?: string | null;
  priority?: TaskPriority;
  rawInput?: string | null;
  parsedMetadata?: Record<string, unknown> | null;
}
