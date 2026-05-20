import { create } from 'zustand';

type TaskView = 'today' | 'upcoming' | 'overdue' | 'all' | 'completed';

interface TaskUIState {
  // Drawer
  drawerOpen: boolean;
  selectedTaskId: string | null;
  openDrawer: (taskId: string) => void;
  closeDrawer: () => void;

  // View + filters
  currentView: TaskView;
  setView: (view: TaskView) => void;
  filterProjectId: string | null;
  filterAreaId: string | null;
  setFilterProjectId: (id: string | null) => void;
  setFilterAreaId: (id: string | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Quick Add
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
}

export const useTaskUIStore = create<TaskUIState>((set) => ({
  drawerOpen: false,
  selectedTaskId: null,
  openDrawer: (taskId) => set({ drawerOpen: true, selectedTaskId: taskId }),
  closeDrawer: () => set({ drawerOpen: false, selectedTaskId: null }),

  currentView: 'today',
  setView: (view) => set({ currentView: view }),
  filterProjectId: null,
  filterAreaId: null,
  setFilterProjectId: (id) => set({ filterProjectId: id }),
  setFilterAreaId: (id) => set({ filterAreaId: id }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  quickAddOpen: false,
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
}));
