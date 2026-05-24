# Calendar Events Implementation Doc

## 1. Goal

Build the Calendar Events module as the third production-ready module of the Productivity Ecosystem app.

The Calendar Events module must support:

```txt
Event creation
Event editing
Event deletion (soft archive)
Day view
Week view
Month view
Event detail drawer
Quick Add input (time-range parsing)
Projects + Areas support
Scheduled tasks rendered alongside events
Tags support
```

This document is the implementation blueprint for Claude Code.

Tasks remain tasks. If a task has `scheduled_for`, the calendar module renders it visually. Tasks do not become calendar_events.

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
react-big-calendar (calendar grid)
date-fns (date formatting and manipulation)
Vercel deployment
```

Add `react-big-calendar` and `date-fns` as new dependencies.

---

## 3. Folder Structure

```txt
app/
  (app)/
    calendar/
      page.tsx

    api/
      events/
        route.ts
      events/[eventId]/
        route.ts
      events/[eventId]/archive/
        route.ts

features/
  events/
    components/
      EventCalendar.tsx
      EventDrawer.tsx
      EventForm.tsx
      EventRow.tsx
      QuickAddEvent.tsx
    hooks/
      useEvents.ts
      useEventMutations.ts
    utils/
      eventFormatting.ts
      calendarHelpers.ts
    types.ts

stores/
  eventUIStore.ts
```

---

## 4. Database Tables (Calendar MVP)

Add to existing schema:

```txt
calendar_events
event_tags
```

`event_tags` links to the existing global `tags` table.

---

## 5. Drizzle Schema

### Calendar Events

```ts
calendar_events
- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- project_id uuid nullable references projects(id) on delete set null
- area_id uuid nullable references areas(id) on delete set null
- title text not null
- description text nullable
- start_time timestamp with time zone not null
- end_time timestamp with time zone nullable
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

Rules:

```txt
external_id is null for internally created events
external_id is set when event is synced from Google/Outlook/Apple (future)
start_time is required
end_time is optional (point-in-time events)
is_all_day events ignore the time portion of start_time
All timestamps stored in UTC
```

---

### Event Tags

```ts
event_tags
- event_id uuid not null references calendar_events(id) on delete cascade
- tag_id uuid not null references tags(id) on delete cascade
- primary key (event_id, tag_id)
```

---

## 6. Auth Flow

All API routes must:

```txt
Check session
Resolve authenticated user
Query only by user_id
Reject unauthorized access
```

Never trust client user IDs.

---

## 7. Events API Routes

### GET /api/events

Supports query params:

```txt
view=day         (single date)
view=week        (date range Mon-Sun)
view=month       (full month)
date=YYYY-MM-DD  (anchor date for day/week/month view)
projectId=
areaId=
search=
```

Returns:

```ts
{
  events: CalendarEvent[]
}
```

The API scopes results to the authenticated user. Archived events are excluded unless explicitly requested.

---

### POST /api/events

Creates an event.

Body:

```ts
{
  title
  description?
  startTime
  endTime?
  location?
  isAllDay?
  projectId?
  areaId?
  rawInput?
  parsedMetadata?
}
```

Returns created event with 201 status.

---

### PATCH /api/events/\:eventId

Edits an event.

Supports partial updates.

Fields that can be updated:

```txt
title
description
startTime
endTime
location
isAllDay
projectId
areaId
```

---

### POST /api/events/\:eventId/archive

Soft deletes an event.

Rules:

```txt
archived_at = now()
```

No hard deletes.

---

## 8. Calendar Compatibility Rule

```txt
The calendar page fetches two things in parallel:
  1. calendar_events (GET /api/events)
  2. scheduled tasks (GET /api/tasks with scheduledFor=date-range)

Both are rendered on the same calendar grid.

Tasks rendered on the calendar are read-only in calendar context.
Clicking a scheduled task opens the task drawer, not the event drawer.
Clicking a calendar_event opens the event drawer.
```

Combined payload shape:

```ts
{
  events: CalendarEvent[]
  scheduledTasks: Task[]
}
```

---

## 9. Quick Add Parser Extensions

Extend `packages/parser/src/parseQuickAdd.ts` to support event-style input.

Event input patterns:

```txt
"Team standup 9am-10am tmr"
"Dentist appointment 2pm-3pm fri"
"Lunch with Mike 12pm thu"
"All day conference 19th"
"Flight to London 8am next mon"
```

New parser output fields for events:

```ts
startTime?: string | null
endTime?: string | null
durationMinutes?: number | null
isAllDay?: boolean
```

Parser rules:

```txt
If input contains a time range (9am-10am) -> extract startTime and endTime
If input contains a single time -> extract startTime only
If input contains 'all day' or no time -> set isAllDay = true
Duration shorthand: 9am 1h -> endTime = 10am
Remove extracted tokens from title
Preserve raw_input and parsed_metadata
```

The parser's `suggestedType` field should return `'event'` when:

```txt
Input contains a time range
Input contains location keywords (at, @)
Input contains meeting/appointment keywords
```

Otherwise default to `'task'` as before.

MVP rule for Quick Add on the calendar page:

```txt
Quick Add on /calendar creates calendar_events
Quick Add on /tasks creates tasks
The parser suggests a type, the page context determines the final type
```

---

## 10. UI State Management

### React Query owns:

```txt
Event lists by date range
Single event queries
Mutations
Cache invalidation
Combined events + scheduled tasks query
```

### Zustand owns:

```txt
Event drawer open/closed
Selected event ID
Current calendar view (day/week/month)
Current anchor date
Filter project ID
Filter area ID
Quick Add open state
```

Rule:

```txt
Server data = React Query
UI-only state = Zustand
```

Zustand store: `stores/eventUIStore.ts`

---

## 11. UI Screens

### Calendar page `/calendar`

Default view: Week.

The calendar grid shows:

```txt
calendar_events as colored blocks
scheduled tasks as lighter/outlined blocks (visual distinction from events)
All-day events in the all-day row at top
Navigation: Previous / Today / Next
View switcher: Day | Week | Month
```

Clicking empty slot:

```txt
Open Quick Add pre-filled with clicked time slot
```

Clicking event:

```txt
Open EventDrawer
```

Clicking scheduled task:

```txt
Open TaskDrawer (existing component)
```

---

### Event Drawer

Event drawer shows:

```txt
Title
Description
Start time
End time
Location
All-day toggle
Project (optional)
Area (optional)
Tags
Created date
Raw quick-add input
```

Actions:

```txt
Edit
Archive
```

---

### Quick Add Event

Same UX as task quick add.

Flow:

```txt
User types shorthand
Parser route called (POST /api/parse/quick-add)
Preview shown: "Team standup — tomorrow 9am–10am"
User accepts
Event created
Calendar updates optimistically
```

---

## 12. Event Sorting and Rendering Rules

### Day view

Sort by:

```txt
1. All-day events first
2. Start time ascending
3. Duration (longer events first at same start time)
```

---

### Week view

```txt
All-day row at top
Timed events rendered as blocks proportional to duration
Overlapping events shown side by side
```

---

### Month view

```txt
Events shown as compact pills per day
Max 3 visible per day, "+ N more" overflow
All-day events shown at top of day cell
```

---

## 13. Optimistic UX Rules

### Creating an event

Immediately:

```txt
Event appears on calendar optimistically
Background mutation runs
```

If failure:

```txt
Remove optimistic event
Show toast error
```

---

### Archiving an event

Immediately:

```txt
Event disappears from calendar
Background mutation runs
```

If failure:

```txt
Restore event
Show toast error
```

---

### Updating an event

Immediately:

```txt
Event updates in place
Background mutation runs
```

If failure:

```txt
Restore previous values
Show toast error
```

All mutations use the snapshot + rollback pattern established in the tasks module.

---

## 14. Not MVP

```txt
Google Calendar sync
Outlook sync
Apple Calendar sync
Recurring events
Event invites / attendees
Notifications / reminders
Event conflict detection
Drag-to-reschedule on calendar grid
Colour-coding per project/area
Mobile calendar view
```

---

## 15. Definition of Done

Calendar Events MVP is complete when:

```txt
User can create events via Quick Add
User can create events via event form
User can edit events in the drawer
User can archive events (soft delete)
User can view events in Day view
User can view events in Week view
User can view events in Month view
User can navigate between dates
User can see scheduled tasks rendered alongside events
Clicking a scheduled task opens the task drawer
Clicking an event opens the event drawer
Parser correctly extracts start/end times from shorthand
Optimistic updates work for create, update, archive
Projects and areas can be linked to events
Tags can be linked to events
API routes are auth-protected
```

---

## 16. Build Order

Implement in this order:

```txt
1. Add calendar_events and event_tags to Drizzle schema
2. Run database migration
3. Add CalendarEvent TypeScript types (features/events/types.ts)
4. Build GET /api/events route with date-range filtering
5. Build POST /api/events route with Zod validation
6. Build PATCH /api/events/[eventId] route
7. Build POST /api/events/[eventId]/archive route
8. Build eventUIStore Zustand store
9. Build useEvents React Query hook (includes combined events + scheduled tasks)
10. Build useEventMutations hook with optimistic updates
11. Extend packages/parser to handle event-style input and time ranges
12. Build EventForm component (create/edit)
13. Build EventDrawer component
14. Build EventCalendar component using react-big-calendar
15. Build /calendar page with Day/Week/Month view switcher
16. Wire Quick Add to event creation on /calendar page
17. Style calendar to match app theme
18. Polish optimistic UX and toast feedback
```
