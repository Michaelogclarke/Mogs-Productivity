# Todo Module Implementation Doc

## 1. Goal

Build the first production-ready module of the Productivity Ecosystem app.

The Todo module must support:

```txt
Task creation
Task completion
Task editing
Task search
Task filtering
Today view
Quick Add input
Task drawer detail view
Projects + Areas support
Soft delete/archive
```

This document is the implementation blueprint for Claude Code.

---

## 2. Tech Stack (Locked)

```txt
Next.js App Router
React
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
Zustand
Supabase Auth
Supabase Postgres
Drizzle ORM
Zod
Vercel deployment
```

---

## 3. Folder Structure

Recommended structure:

```txt
app/
  (auth)/
    login/
    signup/

  today/
    page.tsx

  tasks/
    page.tsx
    [taskId]/
      page.tsx

  completed/
    page.tsx

  inbox/
    page.tsx

  api/
    tasks/
      route.ts
    tasks/[taskId]/
      route.ts
    tasks/[taskId]/complete/
      route.ts
    tasks/[taskId]/archive/
      route.ts
    parse/quick-add/
      route.ts

components/
  layout/
  ui/

features/
  tasks/
    components/
      TaskList.tsx
      TaskRow.tsx
      TaskDrawer.tsx
      TaskForm.tsx
      QuickAddInput.tsx
      TaskFilters.tsx
      SearchBar.tsx
      TodayOverview.tsx
    hooks/
      useTasks.ts
      useTaskMutations.ts
    utils/
      taskSorting.ts
      taskFilters.ts
    types.ts

lib/
  auth/
  db/
  api/
  validation/

packages/
  parser/
    parseQuickAdd.ts
    shorthand.ts
    types.ts

stores/
  taskUIStore.ts
```

---

## 4. Database Tables (Todo MVP)

Implement:

```txt
users
areas
projects
tasks
tags
task_tags
inbox_items
```

---

## 5. Drizzle Schema (Conceptual)

### Areas

```ts
areas
- id
- user_id
- name
- color
- icon
- created_at
- updated_at
```

---

### Projects

```ts
projects
- id
- user_id
- area_id nullable
- name
- description
- status
- created_at
- updated_at
```

---

### Tasks

```ts
tasks
- id
- user_id
- project_id nullable
- area_id nullable
- title
- description nullable
- status
- priority
- due_date nullable
- scheduled_for nullable
- reminder_at nullable
- completed_at nullable
- archived_at nullable
- raw_input nullable
- parsed_metadata jsonb nullable
- created_at
- updated_at
```

Rules:

```txt
If task.area_id exists -> use it
Else if task.project_id exists and project.area_id exists -> inherit project area
Else -> no area
```

---

## 6. Auth Flow

Use Supabase Auth.

All API routes must:

```txt
Check session
Resolve authenticated user
Query only by user_id
Reject unauthorized access
```

Never trust client user IDs.

---

## 7. Task API Routes

### GET /api/tasks

Supports:

Query params:

```txt
view=today
view=upcoming
view=overdue
view=all
view=completed

search=
projectId=
areaId=
priority=
```

Returns:

```ts
{
  tasks: Task[]
}
```

---

### POST /api/tasks

Creates task.

Body:

```ts
{
  title
  description?
  projectId?
  areaId?
  dueDate?
  scheduledFor?
  reminderAt?
  priority?
  rawInput?
  parsedMetadata?
}
```

---

### PATCH /api/tasks/\:taskId

Edits task.

Supports partial updates.

---

### POST /api/tasks/\:taskId/complete

Rules:

```txt
status = done
completed_at = now
```

Task disappears from active list immediately.

---

### POST /api/tasks/\:taskId/reopen

Rules:

```txt
status = todo
completed_at = null
```

---

### POST /api/tasks/\:taskId/archive

Rules:

```txt
archived_at = now
status = archived
```

Soft delete only.

---

## 8. Quick Add Parser Route

### POST /api/parse/quick-add

Input:

```json
{
  "input": "Call dentist 1p tm"
}
```

Output:

```json
{
  "suggestedType": "task",
  "title": "Call dentist",
  "scheduledFor": "2026-05-21T13:00:00.000Z",
  "confidence": 0.95,
  "rawInput": "Call dentist 1p tm"
}
```

MVP rule:

```txt
Always create tasks only
```

Smart capture comes later.

---

## 9. Parser Package Rules

Supported shorthand:

```txt
tm -> tomorrow
tmr -> tomorrow
tod -> today
1p -> 1pm
2p -> 2pm
9a -> 9am
tue -> next Tuesday
fri -> next Friday
19th -> next matching 19th
```

Flow:

```txt
Normalize shorthand
Run chrono-node
Extract datetime
Remove datetime tokens from title
Return parsed command
```

Always preserve:

```txt
raw_input
parsed_metadata
```

---

## 10. UI State Management

### React Query owns:

```txt
Task lists
Single task queries
Mutations
Cache invalidation
Search results
Today payload
```

### Zustand owns:

```txt
Task drawer open/closed
Selected task ID
Current filters UI
Current task list view
Search input draft
Quick Add UI state
```

Rule:

```txt
Server data = React Query
UI-only state = Zustand
```

---

## 11. Task List UI

### Main tasks page

Default:

Dense Todoist-style list.

Task row shows only:

```txt
Checkbox
Title
Priority indicator if important
Due/scheduled date if present
Project badge if present
```

No metadata overload.

---

### Clicking a task

Desktop:

```txt
Open right-side drawer
URL updates to /tasks/:taskId
```

Mobile later:

```txt
Open full page
```

---

## 12. Task Drawer

Task drawer shows:

```txt
Title
Description
Status
Priority
Due date
Scheduled for
Reminder
Project
Area
Tags
Created date
Completed date
Raw quick-add input
```

Actions:

```txt
Edit
Complete
Reopen
Archive
```

---

## 13. Inline Task Creation

Tasks page should support:

```txt
+ Add Task
```

Inline expansion like Todoist.

Fields:

```txt
Title required
Optional quick date parsing
Priority optional
Project optional
Area optional
```

Expanded form for full details.

---

## 14. Quick Add Component

Global quick-add input available from tasks page and later command palette.

Flow:

```txt
User types shorthand
Parser route called
Preview shown
User accepts
Task created
List updates optimistically
```

Examples:

```txt
Call dentist 1p tm
Pay rent fri
Review notes 2p tue
```

---

## 15. Search

MVP search:

Supports:

```txt
Task title
Description later optional
Project name later optional
```

Simple search input on Tasks page.

Debounced API query.

---

## 16. Task Sorting Rules

### Today view

Sort by:

```txt
1. Overdue first
2. Scheduled time
3. Due date
4. Priority
5. Created date
```

---

### Upcoming view

Sort by:

```txt
1. Nearest due date
2. Scheduled time
3. Priority
4. Created date
```

---

### All Tasks

Sort by:

```txt
1. Incomplete first
2. Due soon
3. Priority
4. Newest
```

---

### Completed

Sort by:

```txt
Newest completed first
```

---

## 17. Today Screen Logic

Today is not just a filtered list.

It is a mini command centre.

Should show:

```txt
Overdue section
Due today section
Scheduled today section
Inbox count summary
Upcoming preview
Quick Add input
```

This is NOT the full dashboard.

Just a richer daily task screen.

---

## 18. Calendar Compatibility Rule

Tasks remain tasks.

But:

```txt
If scheduled_for exists
```

Later calendar module may render them visually.

Tasks do NOT become events.

Calendar query later:

```ts
{
  events: [],
  scheduledTasks: []
}
```

---

## 19. Optimistic UX Rules

### Completing task

Immediately:

```txt
Checkbox animates
Task disappears from current list
Background mutation runs
```

If failure:

```txt
Restore task
Show toast
```

---

### Creating task

Immediately:

```txt
Task appears optimistically
Background mutation runs
```

---

## 20. Definition of Done

Todo MVP is complete when:

```txt
User can sign in
User can create tasks
User can edit tasks
User can complete tasks
User can reopen tasks
User can archive tasks
User can search tasks
User can use quick-add shorthand
User can see parsed quick-add preview
User can use Today view
User can filter by project/area
User can open task drawer
Task routes work
Optimistic updates work
```

---

## 21. Build Order

Implement in this order:

```txt
1. Next.js project scaffold
2. Supabase auth setup
3. Drizzle setup
4. DB schema + migrations
5. API routes
6. React Query setup
7. Zustand task UI store
8. Tasks page list UI
9. Task drawer
10. Inline task create
11. Search
12. Parser package
13. Quick Add
14. Today page
15. Optimistic UX polish
```

Stop after Todo MVP. Do NOT build dashboard next. Build Notes next.

