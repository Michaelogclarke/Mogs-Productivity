'use client';

import { useState, useRef, useEffect } from 'react';
import type { ParsedCommand } from '@mogs/parser';
import { useTaskMutations } from '../hooks/useTasks';
import { cn } from '@/lib/utils';

interface QuickAddInputProps {
  onClose?: () => void;
  className?: string;
}

export function QuickAddInput({ onClose, className }: QuickAddInputProps) {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<ParsedCommand | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { createTask } = useTaskMutations();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchPreview = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setPreview(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/parse/quick-add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: value }),
        });
        if (res.ok) {
          const data = await res.json();
          setPreview(data);
        }
      } catch {
        // ignore
      }
    }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    fetchPreview(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      await createTask.mutateAsync({
        title: preview?.title ?? input.trim(),
        scheduledFor: preview?.scheduledFor ?? null,
        dueDate: preview?.dueDate ?? null,
        rawInput: input.trim(),
        parsedMetadata: preview?.metadata ?? null,
      });
      setInput('');
      setPreview(null);
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose?.();
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder='Quick add — try "Call dentist 1p tm"'
          className="w-full border-0 border-b border-border bg-transparent px-0 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
          disabled={loading}
        />
      </form>

      {preview && input.trim() && (
        <div className="mt-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{preview.title}</span>
          {preview.scheduledFor && (
            <span className="ml-2">
              · scheduled{' '}
              {new Date(preview.scheduledFor).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          )}
          {preview.dueDate && !preview.scheduledFor && (
            <span className="ml-2">
              · due{' '}
              {new Date(preview.dueDate).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
          <span className="ml-2 text-muted-foreground/60">↵ to save · Esc to cancel</span>
        </div>
      )}
    </div>
  );
}
