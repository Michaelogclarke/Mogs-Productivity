import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NoteUIState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterType: string | null;
  setFilterType: (t: string | null) => void;
  backlinksOpen: boolean;
  setBacklinksOpen: (open: boolean) => void;
  previewMode: boolean;
  setPreviewMode: (on: boolean) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  setSaveStatus: (s: 'idle' | 'saving' | 'saved' | 'error') => void;
  vimMode: boolean;
  setVimMode: (on: boolean) => void;
  vimStatusText: string;
  setVimStatusText: (s: string) => void;
}

export const useNoteUIStore = create<NoteUIState>()(
  persist(
    (set) => ({
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      filterType: null,
      setFilterType: (t) => set({ filterType: t }),
      backlinksOpen: true,
      setBacklinksOpen: (open) => set({ backlinksOpen: open }),
      previewMode: false,
      setPreviewMode: (on) => set({ previewMode: on }),
      saveStatus: 'idle',
      setSaveStatus: (s) => set({ saveStatus: s }),
      vimMode: false,
      setVimMode: (on) => set({ vimMode: on }),
      vimStatusText: '',
      setVimStatusText: (s) => set({ vimStatusText: s }),
    }),
    {
      name: 'note-ui',
      partialize: (s) => ({ vimMode: s.vimMode, backlinksOpen: s.backlinksOpen }),
    }
  )
);
