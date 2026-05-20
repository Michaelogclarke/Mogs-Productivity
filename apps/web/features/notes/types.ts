export type NoteType = 'normal' | 'daily' | 'meeting' | 'dev_log' | 'journal' | 'reference';

export interface NoteListItem {
  id: string;
  title: string;
  type: NoteType;
  excerpt: string | null;
  wordCount: number;
  readingTimeMinutes: number;
  projectId: string | null;
  areaId: string | null;
  noteDate: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Note extends NoteListItem {
  userId: string;
  content: string;
  slug: string | null;
  archivedAt: string | null;
}

export interface Backlink {
  id: string;
  linkText: string;
  resolved: boolean;
  sourceNoteId: string;
  sourceTitle: string;
  sourceExcerpt: string | null;
}

export interface NoteTemplate {
  id: string;
  userId: string;
  name: string;
  type: string;
  content: string;
  isDefault: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
