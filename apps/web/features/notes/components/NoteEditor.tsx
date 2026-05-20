'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { vim, Vim } from '@replit/codemirror-vim';
import { useNoteMutations } from '../hooks/useNotes';
import { useNoteUIStore } from '@/stores/noteUIStore';
import { useTheme } from '@/components/ThemeProvider';
import { markdownHighlight } from '../utils/markdownTheme';
import type { Note } from '../types';

const AUTOSAVE_DELAY = 1000;

interface NoteEditorProps {
  note: Note;
}

const baseTheme = EditorView.theme({
  '&': { fontSize: '14px', height: '100%' },
  '.cm-scroller': { fontFamily: 'inherit', lineHeight: '1.75', overflow: 'auto' },
  '.cm-content': { padding: '0 0 200px 0', maxWidth: '680px' },
  '.cm-focused': { outline: 'none' },
  '.cm-line': { padding: '0' },
  '.cm-cursor': { display: 'block !important', borderLeftWidth: '2px' },
});

export function NoteEditor({ note }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const { updateNote } = useNoteMutations();
  const { setSaveStatus, vimMode, setVimStatusText } = useNoteUIStore();
  const { resolvedTheme } = useTheme();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContent = useRef(content);
  const latestTitle = useRef(title);

  // Reset when note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    latestContent.current = note.content;
    latestTitle.current = note.title;
    setSaveStatus('idle');
  }, [note.id]);

  // Wire up vim status line (mode display)
  useEffect(() => {
    if (!vimMode) {
      setVimStatusText('');
      return;
    }
    // @replit/codemirror-vim dispatches a custom event on the document
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.mode) setVimStatusText(detail.mode.toUpperCase());
    };
    document.addEventListener('cm-vim-mode-change', handler);
    setVimStatusText('NORMAL');
    return () => document.removeEventListener('cm-vim-mode-change', handler);
  }, [vimMode, setVimStatusText]);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('saving');
    debounceRef.current = setTimeout(async () => {
      try {
        await updateNote.mutateAsync({
          noteId: note.id,
          title: latestTitle.current,
          content: latestContent.current,
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, AUTOSAVE_DELAY);
  }, [note.id, updateNote, setSaveStatus]);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    latestContent.current = value;
    scheduleSave();
  }, [scheduleSave]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    latestTitle.current = e.target.value;
    scheduleSave();
  };

  const extensions = [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    baseTheme,
    EditorView.lineWrapping,
    markdownHighlight(resolvedTheme === 'dark'),
    ...(vimMode ? [vim()] : []),
  ];

  return (
    <div className="flex flex-col h-full">
      <input
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-muted-foreground/30 mb-3 px-0 max-w-2xl"
      />

      <div className="flex-1 overflow-y-auto">
        <CodeMirror
          value={content}
          onChange={handleContentChange}
          extensions={extensions}
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}
