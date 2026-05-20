'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTaskUIStore } from '@/stores/taskUIStore';
import { QuickAddInput } from '@/features/tasks/components/QuickAddInput';

export function QuickAddModal() {
  const { quickAddOpen, setQuickAddOpen } = useTaskUIStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickAddOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setQuickAddOpen]);

  if (!quickAddOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={() => setQuickAddOpen(false)}
        aria-hidden
      />
      <div className="fixed left-1/2 top-1/3 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-medium">Quick Add</span>
          <button onClick={() => setQuickAddOpen(false)} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-3">
          <QuickAddInput onClose={() => setQuickAddOpen(false)} />
        </div>
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          ⌘K to open · Esc to close · Enter to save
        </div>
      </div>
    </>
  );
}
