# Database Design and Dataflow

This document defines the database structure and dataflow for the personal productivity ecosystem.

The first product area to build is the Todo/Tasks module, but the schema should support future notes, calendar, projects, habits, inbox capture, and dashboard aggregation.

---

## 1. Core Principle

Tasks, notes, calendar events, habits, projects, and areas are first-class entities.

They should be globally accessible in their own sections, but optionally linked together.

Do not force everything to belong to a project.

Good model:

```txt
Tasks exist globally
Notes exist globally
Events exist globally
Projects exist globally
Areas exist globally

Relationships connect them optionally
```

Bad model:

```txt
Projects own everything
```

A task like “Buy milk” should not need a project. A note like “Random idea for a game” should not need a project. A project like “Productivity App” should still be able to show its related tasks, notes, and events.

---

## 2. Recommended Stack

Use this stack:

```txt
Database: Supabase Postgres
ORM: Drizzle ORM
Language: TypeScript
Backend: Next.js App Router API routes
Frontend: Next.js React web app first, Expo React Native later
Auth: Supabase Auth
Validation: Zod
Package manager: pnpm workspace
Deployment: Vercel + Supabase
Dates: Store timestamps in UTC
```

SQLite is acceptable for experiments, but the actual app should use Supabase Postgres because the long-term goal is synced web and mobile access.

---

## 3. Main Entities

Long-term entities:

```txt
users
areas
projects
tasks
notes
calendar_events
inbox_items
tags
task_tags
note_tags
event_tags
habits
habit_logs
```

For the first Todo MVP, implement only:

```txt
users
areas
projects
tasks
inbox_items
tags
task_tags
```

Notes, calendar events, and habits can be added after the Todo module is working.

Important MVP decisions:

```txt
Do not implement recurring tasks yet.
Do not implement the dashboard yet.
Do not implement real notifications yet.
Store reminder_at only as future notification foundation.
Use archive/soft-delete instead of hard delete.
```

---

## 4. Users Table

Every record should belong to a user.

```ts
users
- id uuid primary key
- email text unique not null
- name text nullable
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

All queries must be scoped by `user_id`.

Never trust user IDs sent from the client. Resolve the authenticated user through Supabase Auth on the server.

---

## 5. Areas Table

Areas are long-term responsibility buckets.

They are not the same as projects.

Examples:

```txt
Work
Personal
Health
Finance
Learning
Side Hustle
```

Areas should be user-defined records, not hard-coded text enums.

```ts
areas
- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- name text not null
- color text nullable
- icon text nullable
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

Add unique constraint:

```txt
unique(user_id, name)
```

---

## 6. Projects Table

Projects are containers for related work, but they are not required for every task or note.

A project may optionally belong to an area.

```ts
projects
- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- area_id uuid nullable references areas(id) on delete set null
- name text not null
- description text nullable
- status text not null default 'active'
- color text nullable
- archived_at timestamp nullable
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

Suggested `status` values:

```txt
active
paused
completed
archived
```

---

## 7. Tasks Table

Tasks are global. A task may optionally link to a project and/or area.

```ts
tasks
- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- project_id uuid nullable references projects(id) on delete set null
- area_id uuid nullable references areas(id) on delete set null
- title text not null
- description text nullable
- status text not null default 'todo'
- priority text not null default 'none'
- due_date timestamp nullable
- scheduled_for timestamp nullable
- reminder_at timestamp nullable
- completed_at timestamp nullable
- archived_at timestamp nullable
- raw_input text nullable
- parsed_metadata jsonb nullable
- sort_order integer nullable
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

MVP decision:

```txt
Do not add recurrence_rule yet.
Recurring tasks are intentionally out of scope for the Todo MVP.
```

Important distinction:

```txt
due_date = when it must be done
scheduled_for = when the user plans to do it
reminder_at = when the user should be notified later
```

Example:

```txt
Task: Submit application
Due date: Friday 5pm
Scheduled for: Thursday 7pm
Reminder: Thursday 6:30pm
```

Suggested `status` values:

```txt
todo
doing
done
cancelled
archived
```

Suggested `priority` values:

```txt
none
low
medium
high
urgent
```

Archive rule:

```txt
Do not hard-delete tasks in the MVP.
Archive by setting archived_at = now() and status = 'archived'.
```

Completion rule:

```txt
Complete by setting completed_at = now() and status = 'done'.
Reopen by setting completed_at = null and status = 'todo'.
```

Area inheritance rule:

```txt
If task.area_id exists -> use it.
Else if task.project_id exists and project.area_id exists -> inherit project area.
Else -> no effective area.
```

---

## 8. Inbox Items Table

The inbox is the universal capture layer.

It stores unprocessed ideas, tasks, links, reminders, notes, or random thoughts.

```ts
inbox_items
- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- content text not null
- type text not null default 'text'
- processed boolean not null default false
- processed_into_type text nullable
- processed_into_id uuid nullable
- archived_at timestamp nullable
- raw_input text nullable
- parsed_metadata jsonb nullable
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

Suggested `type` values:

```txt
text
link
idea
task_candidate
note_candidate
event_candidate
```

Suggested `processed_into_type` values:

```txt
task
note
event
project
habit
```

Example flow:

```txt
User types: "Call dentist 1p tm"
Save to inbox_items first OR directly parse into a task
Parser extracts title and time
If accepted, create task
Set inbox_items.processed = true
Set processed_into_type = 'task'
Set processed_into_id = created task id
```

---

## 9. Tags Tables

Tags are global per user.

```ts
tags
- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- name text not null
- color text nullable
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

Add unique constraint:

```txt
unique(user_id, name)
```

Task tags:

```ts
task_tags
- task_id uuid not null references tasks(id) on delete cascade
- tag_id uuid not null references tags(id) on delete cascade
- primary key (task_id, tag_id)
```

Future tables:

```ts
note_tags
- note_id uuid not null references notes(id) on delete cascade
- tag_id uuid not null references tags(id) on delete cascade
- primary key (note_id, tag_id)

event_tags
- event_id uuid not null references calendar_events(id) on delete cascade
- tag_id uuid not null references tags(id) on delete cascade
- primary key (event_id, tag_id)
```

---

## 10. Future Notes Table

Do not implement this until the task module is working.

```ts
notes
- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- project_id uuid nullable references projects(id) on delete set null
- area_id uuid nullable references areas(id) on delete set null
- title text not null
- content text not null
- type text not null default 'normal'
- note_date date nullable
- archived_at timestamp nullable
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

Suggested `type` values:

```txt
normal
daily
meeting
dev_log
journal
reference
```

Notes should be browsable globally in an All Notes section. Project-linked notes should also appear inside the relevant project page.

---

## 11. Future Calendar Events Table

Do not implement this until the task module and quick-add parser are working.

```ts
calendar_events
- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- project_id uuid nullable references projects(id) on delete set null
- area_id uuid nullable references areas(id) on delete set null
- title text not null
- description text nullable
- start_time timestamp not null
- end_time timestamp nullable
- location text nullable
- is_all_day boolean not null default false
- source text not null default 'internal'
- external_id text nullable
- archived_at timestamp nullable
- raw_input text nullable
- parsed_metadata jsonb nullable
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

Suggested `source` values:

```txt
internal
google
outlook
apple
```

External integrations should not be implemented until internal events work first.

Calendar compatibility rule:

```txt
Tasks remain tasks.
If a task has scheduled_for, the future calendar module may render it visually.
Tasks do not become calendar_events.
Calendar queries can later return both events and scheduledTasks.
```

---

## 12. Future Habits Tables

Do not implement this until tasks, notes, and calendar are stable.

```ts
habits
- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- project_id uuid nullable references projects(id) on delete set null
- area_id uuid nullable references areas(id) on delete set null
- name text not null
- description text nullable
- frequency text not null default 'daily'
- target_count integer not null default 1
- archived_at timestamp nullable
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

```ts
habit_logs
- id uuid primary key
- habit_id uuid not null references habits(id) on delete cascade
- user_id uuid not null references users(id) on delete cascade
- log_date date not null
- completed boolean not null default false
- value integer nullable
- note text nullable
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

Add unique constraint:

```txt
unique(habit_id, log_date)
```

---

## 13. Natural Language Quick Add Parser

Todoist-style input should be handled by a parser layer before saving to the database.

This does not need a special database.

Example inputs:

```txt
"Call dentist 1p tm"
"Review notes 2p 19th"
"Study TypeScript 2p tue"
"Pay bill tomorrow 9a"
```

Parser output should look like:

```ts
type ParsedCommand = {
  suggestedType: 'task' | 'event' | 'note' | 'inbox';
  title: string;
  dueDate?: string | null;
  scheduledFor?: string | null;
  reminderAt?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null;
  confidence: number;
  rawInput: string;
  metadata?: Record<string, unknown>;
};
```

MVP rule:

```txt
Quick Add creates tasks only.
Smart capture comes after the Todo MVP.
```

Recommended parser approach:

```txt
1. Custom shorthand normalisation
2. Date/time parsing with chrono-node
3. Remove parsed date/time tokens from task title
4. Return structured parsed command
5. Show preview in UI
6. Save if accepted
```

Examples of shorthand normalisation:

```txt
tm -> tomorrow
tmr -> tomorrow
tod -> today
2p -> 2pm
1p -> 1pm
9a -> 9am
tue -> next Tuesday
fri -> next Friday
19th -> next matching 19th of the month
```

This parser should live in a shared package:

```txt
packages/parser
```

It should be reusable by:

```txt
web quick add
mobile quick add
command palette
inbox processing
calendar event creation
```

Store the original text in:

```txt
tasks.raw_input
calendar_events.raw_input
inbox_items.raw_input
```

Store parse details in:

```txt
parsed_metadata jsonb
```

This helps debugging parser mistakes later.

---

## 14. Core Dataflow

### Creating a normal task

```txt
Next.js UI
  -> API route
  -> validate with Zod
  -> resolve authenticated Supabase user
  -> insert into tasks with user_id
  -> return created task
  -> update TanStack Query cache
```

### Creating a task with quick add

```txt
User enters: "Call dentist 1p tm"
  -> parseQuickAdd(input)
  -> UI shows preview: "Call dentist, scheduled tomorrow at 1pm"
  -> User presses Enter
  -> POST /api/tasks
  -> save title, scheduled_for, raw_input, parsed_metadata
  -> return created task
```

### Completing a task

```txt
User clicks checkbox
  -> optimistically remove task from active list
  -> POST /api/tasks/:id/complete
  -> set status = 'done'
  -> set completed_at = now()
```

### Archiving a task

```txt
User archives task
  -> POST /api/tasks/:id/archive
  -> set status = 'archived'
  -> set archived_at = now()
```

### Capturing to inbox

```txt
User enters random thought
  -> POST /api/inbox
  -> save inbox item
  -> later user processes it into task/note/event
```

### Processing inbox item into task

```txt
GET /api/inbox/unprocessed
  -> user selects item
  -> parse or manually edit
  -> POST /api/tasks
  -> PATCH /api/inbox/:id as processed
```

### Today screen dataflow

The Today screen is a mini command centre for the Todo MVP.

```txt
GET /api/tasks?view=today
  -> fetch overdue tasks
  -> fetch tasks due today
  -> fetch tasks scheduled today
  -> fetch inbox count summary
  -> fetch small upcoming preview
```

The Today screen is not the full dashboard.

### Dashboard dataflow later

```txt
GET /api/dashboard/today
  -> fetch tasks due today
  -> fetch tasks scheduled today
  -> fetch overdue tasks
  -> fetch today's events
  -> fetch active projects
  -> fetch inbox count
  -> fetch today's habits
```

The dashboard should not own most data. It should aggregate data from other tables.

---

## 15. API Routes for Todo MVP

Implement these first:

```txt
GET    /api/tasks
GET    /api/tasks/:id
POST   /api/tasks
PATCH  /api/tasks/:id
POST   /api/tasks/:id/complete
POST   /api/tasks/:id/reopen
POST   /api/tasks/:id/archive
```

Useful filters for `GET /api/tasks`:

```txt
view=today
view=upcoming
view=overdue
view=all
view=completed
status
priority
project_id
area_id
tag
scheduled_for=today
due_date=today
overdue=true
completed=true
search
```

Example:

```txt
GET /api/tasks?view=today
GET /api/tasks?overdue=true
GET /api/tasks?project_id=abc123
GET /api/tasks?search=dentist
```

Projects:

```txt
GET    /api/projects
POST   /api/projects
PATCH  /api/projects/:id
POST   /api/projects/:id/archive
GET    /api/projects/:id/tasks
```

Areas:

```txt
GET    /api/areas
POST   /api/areas
PATCH  /api/areas/:id
POST   /api/areas/:id/archive
```

Inbox:

```txt
GET    /api/inbox
POST   /api/inbox
PATCH  /api/inbox/:id
POST   /api/inbox/:id/archive
POST   /api/inbox/:id/convert-to-task
```

Parser:

```txt
POST /api/parse/quick-add
```

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

---

## 16. Todo UI Requirements

First Todo section should include:

```txt
Today
All Tasks
Upcoming
Overdue
Inbox
Completed
Project filter
Area filter
Tag filter
Search
Quick Add input
```

Task item should show:

```txt
title
status
priority
due date if present
scheduled date/time if present
project if linked
area if explicitly linked or inherited
tags if linked
complete checkbox
```

Task create/edit form should support:

```txt
title
description
status
priority
project optional
area optional
due date optional
scheduled date/time optional
reminder optional
tags optional
```

Quick Add should support:

```txt
Create task from shorthand input
Show parsed preview before save
Allow user to edit parsed fields before save
```

---

## 17. First Implementation Order

Build in this order:

```txt
1. Set up pnpm workspace
2. Set up Next.js app in apps/web
3. Set up Supabase Auth
4. Set up database connection
5. Add users table
6. Add areas table
7. Add projects table
8. Add tasks table
9. Add tags + task_tags
10. Add inbox_items
11. Add task CRUD API
12. Add archive/soft-delete behavior
13. Add task search
14. Add task list UI
15. Add quick add parser package
16. Add quick add UI
17. Add projects and areas filters
18. Add Today mini command centre
19. Add inbox capture
20. Add convert inbox item to task
```

Do not build the dashboard yet.

The dashboard should come after the core task, note, calendar, and habit systems have real data.

---

## 18. Important Rules

- Tasks are global and may optionally link to projects and areas.
- Notes are global and may optionally link to projects and areas.
- Calendar events are global and may optionally link to projects and areas.
- Areas are user-defined records, not hard-coded text enums.
- Do not force random life tasks into fake projects.
- Store UTC timestamps in the database.
- Keep `due_date` and `scheduled_for` separate.
- Keep raw quick-add input for debugging.
- Do not add recurring tasks in the MVP.
- Do not hard-delete tasks in the MVP; archive them.
- Do not use an LLM for basic Todoist-style parsing at first.
- Build parser logic as a shared package.
- Dashboard is an aggregator and should be built later.
- Build Todo first.

---

## 19. Immediate Goal

The immediate goal is to build the Todo module.

Definition of done:

```txt
User can sign in
User can create tasks
User can view Today/Upcoming/Overdue/All/Completed tasks
User can complete/reopen tasks
User can archive tasks instead of hard-deleting them
User can search tasks
User can optionally assign tasks to projects and areas
User can use quick add like "Call dentist 1p tm"
User can see parsed quick-add preview before saving
Today screen shows overdue, due today, scheduled today, inbox count, upcoming preview, and quick add
```

Once this works, move on to Notes.

