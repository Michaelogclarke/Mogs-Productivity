'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNoteUIStore } from '@/stores/noteUIStore';
import { useNoteMutations } from './useNotes';

/**
 * Global keyboard shortcuts active on any notes page.
 *
 * Cmd/Ctrl + E  — toggle preview
 * Cmd/Ctrl + B  — toggle backlinks panel
 * Cmd/Ctrl + .  — toggle vim mode
 * Cmd/Ctrl + N  — new note
 * Cmd/Ctrl + D  — go to today's daily note
 */
export function useNoteShortcuts() {
  const { setPreviewMode, previewMode, setBacklinksOpen, backlinksOpen, setVimMode, vimMode } = useNoteUIStore();
  const { createNote } = useNoteMutations();
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      // Don't fire inside regular text inputs/textareas that aren't CodeMirror
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isCodemirror = target.closest('.cm-editor');

      switch (e.key) {
        case 'e':
          if (!isInput) {
            e.preventDefault();
            setPreviewMode(!previewMode);
          }
          break;
        case 'b':
          if (!isInput) {
            e.preventDefault();
            setBacklinksOpen(!backlinksOpen);
          }
          break;
        case '.':
          e.preventDefault();
          setVimMode(!vimMode);
          break;
        case 'n':
          if (!isInput && !isCodemirror) {
            e.preventDefault();
            createNote.mutate({ title: 'Untitled', content: '' });
          }
          break;
        case 'd':
          if (!isInput && !isCodemirror) {
            e.preventDefault();
            const today = new Date().toISOString().slice(0, 10);
            router.push(`/notes/daily/${today}`);
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [previewMode, backlinksOpen, vimMode, setPreviewMode, setBacklinksOpen, setVimMode, createNote, router]);
}
