export type ParsedCommand = {
  suggestedType: 'task' | 'event' | 'note' | 'inbox';
  title: string;
  dueDate?: string | null;
  scheduledFor?: string | null;
  reminderAt?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null;
  confidence: number;
  rawInput: string;
  metadata?: Record<string, unknown>;
};
