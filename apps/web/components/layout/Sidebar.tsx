'use client';

import { useState } from 'react';
import { CalendarDays, CheckSquare, Clock, Inbox, List, AlertTriangle, Plus, X, FolderOpen, Layers, BookOpen, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTaskUIStore } from '@/stores/taskUIStore';
import { useProjects, useProjectMutations } from '@/features/projects/hooks/useProjects';
import { useAreas, useAreaMutations } from '@/features/areas/hooks/useAreas';
import { cn } from '@/lib/utils';

const views = [
  { id: 'today', label: 'Today', icon: CalendarDays },
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
  { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
  { id: 'all', label: 'All Tasks', icon: List },
  { id: 'completed', label: 'Completed', icon: CheckSquare },
] as const;

function InlineCreate({ placeholder, onSave, onCancel }: {
  placeholder: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || saving) return;
    setSaving(true);
    try { await onSave(value.trim()); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handle} className="flex items-center gap-1 px-3 py-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
      />
      <button type="submit" disabled={saving} className="text-muted-foreground hover:text-foreground">
        <Plus className="h-3 w-3" />
      </button>
      <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
        <X className="h-3 w-3" />
      </button>
    </form>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { currentView, setView, filterProjectId, filterAreaId, setFilterProjectId, setFilterAreaId } = useTaskUIStore();
  const { data: projects = [] } = useProjects();
  const { data: areas = [] } = useAreas();
  const { createProject } = useProjectMutations();
  const { createArea } = useAreaMutations();
  const [addingProject, setAddingProject] = useState(false);
  const [addingArea, setAddingArea] = useState(false);

  const handleViewClick = (id: typeof views[number]['id']) => {
    setView(id);
    setFilterProjectId(null);
    setFilterAreaId(null);
    if (pathname !== '/tasks') window.location.href = '/tasks';
  };

  const handleProjectClick = (projectId: string) => {
    setView('all');
    setFilterProjectId(projectId);
    setFilterAreaId(null);
  };

  const handleAreaClick = (areaId: string) => {
    setView('all');
    setFilterAreaId(areaId);
    setFilterProjectId(null);
  };

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-muted/30 py-4 overflow-y-auto">
      {/* Core views */}
      <div className="px-2">
        <nav className="flex flex-col gap-0.5">
          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleViewClick(id)}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors w-full text-left',
                currentView === id && !filterProjectId && !filterAreaId
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Inbox */}
      <div className="mt-1 px-2">
        <Link
          href="/inbox"
          className={cn(
            'flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
            pathname === '/inbox'
              ? 'bg-accent text-accent-foreground font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Inbox className="h-4 w-4 shrink-0" />
          Inbox
        </Link>
      </div>

      {/* Notes */}
      <div className="mt-1 px-2">
        <div className="flex items-center justify-between px-3 mb-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <Link
            href="/notes"
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
              pathname === '/notes'
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            All Notes
          </Link>
          <Link
            href={`/notes/daily/${new Date().toISOString().slice(0, 10)}`}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
              pathname.startsWith('/notes/daily')
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            Daily Notes
          </Link>
          <Link
            href="/notes/templates"
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
              pathname === '/notes/templates'
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <LayoutTemplate className="h-4 w-4 shrink-0" />
            Templates
          </Link>
        </div>
      </div>

      {/* Areas */}
      <div className="mt-4 px-2">
        <div className="flex items-center justify-between px-3 mb-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Areas</span>
          <button
            onClick={() => { setAddingArea(true); setAddingProject(false); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {addingArea && (
          <InlineCreate
            placeholder="Area name…"
            onSave={async (name) => { await createArea.mutateAsync({ name }); setAddingArea(false); }}
            onCancel={() => setAddingArea(false)}
          />
        )}

        <div className="flex flex-col gap-0.5">
          {areas.map((area) => (
            <button
              key={area.id}
              onClick={() => handleAreaClick(area.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors w-full text-left',
                filterAreaId === area.id
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{area.name}</span>
            </button>
          ))}
          {areas.length === 0 && !addingArea && (
            <p className="px-3 py-1 text-xs text-muted-foreground/60">No areas yet</p>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="mt-4 px-2">
        <div className="flex items-center justify-between px-3 mb-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projects</span>
          <button
            onClick={() => { setAddingProject(true); setAddingArea(false); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {addingProject && (
          <InlineCreate
            placeholder="Project name…"
            onSave={async (name) => { await createProject.mutateAsync({ name }); setAddingProject(false); }}
            onCancel={() => setAddingProject(false)}
          />
        )}

        <div className="flex flex-col gap-0.5">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors w-full text-left',
                filterProjectId === project.id
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {project.color ? (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: project.color }} />
              ) : (
                <FolderOpen className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{project.name}</span>
            </button>
          ))}
          {projects.length === 0 && !addingProject && (
            <p className="px-3 py-1 text-xs text-muted-foreground/60">No projects yet</p>
          )}
        </div>
      </div>
    </aside>
  );
}
