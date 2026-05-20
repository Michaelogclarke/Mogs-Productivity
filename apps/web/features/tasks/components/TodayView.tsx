'use client';

import { useMemo, useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { TaskRow } from './TaskRow';
import { QuickAddInput } from './QuickAddInput';
import type { Task } from '../types';

function todayBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function Section({ title, tasks, empty }: { title: string; tasks: Task[]; empty?: string }) {
  if (tasks.length === 0 && !empty) return null;
  return (
    <div>
      <h2 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
        <span className="ml-2 font-normal normal-case tracking-normal">
          {tasks.length > 0 ? tasks.length : ''}
        </span>
      </h2>
      {tasks.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        tasks.map((t) => <TaskRow key={t.id} task={t} />)
      )}
    </div>
  );
}

export function TodayView() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Fetch all tasks relevant to today — overdue + today
  const { data: allTodayTasks = [], isLoading } = useTasks({ view: 'today' });

  // Also fetch upcoming for preview
  const { data: upcomingTasks = [] } = useTasks({ view: 'upcoming' });

  const { overdue, dueToday, scheduledToday } = useMemo(() => {
    const { start, end } = todayBounds();

    const overdue = allTodayTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < start,
    );
    const dueToday = allTodayTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) >= start && new Date(t.dueDate) < end,
    );
    const scheduledToday = allTodayTasks.filter(
      (t) =>
        t.scheduledFor &&
        new Date(t.scheduledFor) >= start &&
        new Date(t.scheduledFor) < end &&
        // Don't double-show if it's also due today
        !dueToday.find((d) => d.id === t.id),
    );

    return { overdue, dueToday, scheduledToday };
  }, [allTodayTasks]);

  const upcomingPreview = upcomingTasks.slice(0, 5);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Date heading */}
      <div>
        <h1 className="text-2xl font-semibold">Today</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      {/* Quick Add */}
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
        {quickAddOpen ? (
          <QuickAddInput onClose={() => setQuickAddOpen(false)} />
        ) : (
          <button
            onClick={() => setQuickAddOpen(true)}
            className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            + Quick add a task…
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="px-3 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="flex flex-col gap-5">
          <Section
            title="Overdue"
            tasks={overdue}
          />
          <Section
            title="Due today"
            tasks={dueToday}
            empty="Nothing due today."
          />
          <Section
            title="Scheduled today"
            tasks={scheduledToday}
          />

          {upcomingPreview.length > 0 && (
            <div>
              <h2 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Coming up
              </h2>
              {upcomingPreview.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
