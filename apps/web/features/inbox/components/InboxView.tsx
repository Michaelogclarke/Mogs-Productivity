'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, Plus } from 'lucide-react';
import { parseQuickAdd } from '@mogs/parser';

interface InboxItem {
  id: string;
  content: string;
  type: string;
  processed: boolean;
  createdAt: string;
}

function useInbox() {
  return useQuery({
    queryKey: ['inbox'],
    queryFn: async () => {
      const res = await fetch('/api/inbox');
      if (!res.ok) throw new Error('Failed to fetch inbox');
      return (await res.json()).items as InboxItem[];
    },
  });
}

export function InboxView() {
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useInbox();

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim(), rawInput: input.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setInput('');
      qc.invalidateQueries({ queryKey: ['inbox'] });
      toast.success('Captured');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const convertToTask = useMutation({
    mutationFn: async (item: InboxItem) => {
      const parsed = parseQuickAdd(item.content);
      const res = await fetch(`/api/inbox/${item.id}/convert-to-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: parsed.title || item.content,
          scheduledFor: parsed.scheduledFor ?? null,
        }),
      });
      if (!res.ok) throw new Error('Failed to convert');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Converted to task');
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-sm text-muted-foreground">Capture anything — process it later.</p>
      </div>

      {/* Capture input */}
      <form onSubmit={addItem} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What's on your mind?"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={saving || !input.trim()}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Capture
        </button>
      </form>

      {/* Items */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Inbox is empty.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-muted/40"
            >
              <span className="text-sm">{item.content}</span>
              <button
                onClick={() => convertToTask.mutate(item)}
                disabled={convertToTask.isPending}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Convert to task"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Task
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
