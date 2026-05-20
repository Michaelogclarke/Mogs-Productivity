'use client';

import { useState } from 'react';
import { useNoteTemplates, useNoteMutations } from '@/features/notes/hooks/useNotes';
import { Plus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteTemplate } from '@/features/notes/types';

const TYPE_OPTIONS = ['normal', 'daily', 'meeting', 'dev_log', 'journal', 'reference'] as const;

function TemplateEditor({
  template,
  onSave,
  onCancel,
}: {
  template: Partial<NoteTemplate>;
  onSave: (data: { name: string; content: string; type: string; isDefault: boolean }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template.name ?? '');
  const [content, setContent] = useState(template.content ?? '');
  const [type, setType] = useState(template.type ?? 'normal');
  const [isDefault, setIsDefault] = useState(template.isDefault ?? false);
  const [saving, setSaving] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try { await onSave({ name: name.trim(), content, type, isDefault }); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handle} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-center gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name"
          required
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded"
          />
          Default
        </label>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Template content (supports Markdown and {{date}}, {{day}}, {{isoDate}} variables)"
        rows={10}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ring resize-none"
      />

      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useNoteTemplates();
  const { saveTemplate } = useNoteMutations();
  const [editing, setEditing] = useState<string | null>(null); // templateId or 'new'

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          New template
        </button>
      </div>

      {editing === 'new' && (
        <TemplateEditor
          template={{}}
          onSave={async (data) => {
            await saveTemplate.mutateAsync(data);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : templates.length === 0 && editing !== 'new' ? (
        <p className="text-sm text-muted-foreground">No templates yet. Create one to get started.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((t) => (
            <div key={t.id}>
              {editing === t.id ? (
                <TemplateEditor
                  template={t}
                  onSave={async (data) => {
                    await saveTemplate.mutateAsync({ templateId: t.id, ...data });
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div
                  className={cn(
                    'flex items-start justify-between rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors cursor-pointer',
                  )}
                  onClick={() => setEditing(t.id)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{t.name}</span>
                      {t.isDefault && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground capitalize">
                        {t.type.replace('_', ' ')}
                      </span>
                    </div>
                    {t.content && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.content.slice(0, 120)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
