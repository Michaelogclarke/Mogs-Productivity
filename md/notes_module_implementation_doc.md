# Notes Module Implementation Doc

## 1. Goal

Build the second major module of the Productivity Ecosystem app after the Todo MVP.

The Notes module should be an Obsidian-inspired Markdown knowledge system, not just a basic notes CRUD app.

The Notes module must support:

```txt
Markdown-first notes
CodeMirror editor
Auto-save
Global notes list
Daily notes
Editable note templates
[[wiki links]]
Backlinks
Search
Tags
Optional projects
Optional areas
Derived note metadata
Full note pages
```

This document is the implementation blueprint for Claude Code.

---

## 2. Tech Stack

Use the existing app stack:

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
CodeMirror
```

---

## 3. Product Philosophy

Notes are global documents.

They may optionally be linked to:

```txt
Projects
Areas
Tags
Other notes
Tasks later
Calendar events later
```

Do not force notes into projects.

A note like “Random idea for an app” should not need a project.

A note like “Productivity App Database Decisions” can be linked to:

```txt
Project: Productivity Ecosystem
Area: Learning / Side Hustle / Personal
Tags: database, architecture
```

---

## 4. Folder Structure

Recommended additions:

```txt
app/
  notes/
    page.tsx
    new/
      page.tsx
    [noteId]/
      page.tsx

  notes/daily/
    page.tsx
    [date]/
      page.tsx

  notes/templates/
    page.tsx
    [templateId]/
      page.tsx

  api/
    notes/
      route.ts
    notes/[noteId]/
      route.ts
    notes/[noteId]/archive/
      route.ts
    notes/[noteId]/links/
      route.ts
    notes/[noteId]/backlinks/
      route.ts
    notes/daily/[date]/
      route.ts
    note-templates/
      route.ts
    note-templates/[templateId]/
      route.ts

features/
  notes/
    components/
      NotesList.tsx
      NoteListItem.tsx
      NoteEditor.tsx
      NoteMetadataBar.tsx
      BacklinksPanel.tsx
      WikiLinkSuggestions.tsx
      DailyNoteHeader.tsx
      NoteTemplateEditor.tsx
      NoteSearchBar.tsx
      NoteFilters.tsx
    hooks/
      useNotes.ts
      useNote.ts
      useNoteMutations.ts
      useBacklinks.ts
      useNoteTemplates.ts
    utils/
      parseWikiLinks.ts
      noteMetadata.ts
      noteSearch.ts
      noteSlug.ts
      autosave.ts
    types.ts

stores/
  noteUIStore.ts

packages/
  markdown/
    parseWikiLinks.ts
    extractNoteMetadata.ts
    types.ts
```

If `packages/markdown` feels too early, the parsing utilities can start inside `features/notes/utils` and be moved later.

---

## 5. Database Tables

Add these tables after Todo MVP:

```txt
notes
note_links
note_templates
note_tags
```

Existing tables reused:

```txt
users
areas
projects
tags
```

---

## 6. Notes Table

Markdown content is the source of truth.

Derived metadata is stored for faster lists, previews, search, and later stats.

```ts
notes
- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- project_id uuid nullable references projects(id) on delete set null
- area_id uuid nullable references areas(id) on delete set null
- title text not null
- slug text nullable
- content text not null
- type text not null default 'normal'
- note_date date nullable
- excerpt text nullable
- word_count integer not null default 0
- reading_time_minutes integer not null default 0
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

Rules:

```txt
content is the source of truth
excerpt is derived from content
word_count is derived from content
reading_time_minutes is derived from word_count
```

Daily note rule:

```txt
For type = 'daily', note_date must be set.
Only one daily note per user per date.
```

Add unique partial constraint if practical:

```txt
unique(user_id, note_date) where type = 'daily' and archived_at is null
```

If partial unique constraints are awkward in Drizzle, enforce this in the API first and add DB-level constraint later.

---

## 7. Note Links Table

Wiki links should be stored in a dedicated relationships table.

Example Markdown:

```md
Learning about [[React State]] and [[Task Management]].
```

Store links as:

```ts
note_links
- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- source_note_id uuid not null references notes(id) on delete cascade
- target_note_id uuid nullable references notes(id) on delete set null
- link_text text not null
- resolved boolean not null default false
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

Important:

```txt
source_note_id = note containing the [[link]]
target_note_id = note matched by title/slug, if found
link_text = raw text inside [[...]]
resolved = whether target_note_id exists
```

This supports unresolved links like Obsidian.

Example:

```txt
[[React State]]
```

If no note named “React State” exists yet:

```txt
target_note_id = null
resolved = false
```

Later, if the user creates a note titled “React State”, the app can resolve the link.

---

## 8. Note Templates Table

Templates are user-editable.

Daily notes should auto-create from the user’s default daily template.

```ts
note_templates
- id uuid primary key
- user_id uuid not null references users(id) on delete cascade
- name text not null
- type text not null default 'custom'
- content text not null
- is_default boolean not null default false
- archived_at timestamp nullable
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

Suggested `type` values:

```txt
daily
meeting
dev_log
journal
custom
```

Default daily template example:

```md
# {{date}}

## Focus

## Notes

## Tasks

## Wins

## Blockers
```

Template variables for MVP:

```txt
{{date}}
{{day}}
{{isoDate}}
```

Examples:

```txt
{{date}} -> 20 May 2026
{{day}} -> Wednesday
{{isoDate}} -> 2026-05-20
```

---

## 9. Note Tags Table

```ts
note_tags
- note_id uuid not null references notes(id) on delete cascade
- tag_id uuid not null references tags(id) on delete cascade
- primary key (note_id, tag_id)
```

Tags are shared with tasks.

---

## 10. Wiki Link Parsing

Supported syntax for MVP:

```md
[[Note Title]]
[[Note Title|Alias Text]]
```

Parser output:

```ts
type ParsedWikiLink = {
  raw: string;
  linkText: string;
  alias?: string;
  startIndex: number;
  endIndex: number;
};
```

Examples:

```md
[[React State]]
```

```ts
{
  raw: '[[React State]]',
  linkText: 'React State'
}
```

```md
[[React State|state notes]]
```

```ts
{
  raw: '[[React State|state notes]]',
  linkText: 'React State',
  alias: 'state notes'
}
```

Do not support embeds, block references, or advanced Obsidian syntax in MVP.

Not MVP:

```txt
![[image.png]]
[[note#heading]]
[[note^block-id]]
```

---

## 11. Link Resolution Flow

When a note is created or updated:

```txt
1. Save note content
2. Extract wiki links from content
3. Delete existing note_links for this source_note_id
4. For each wiki link:
   - Try to find target note by exact title match for same user
   - If found, set target_note_id and resolved = true
   - If not found, set target_note_id = null and resolved = false
5. Save new note_links rows
```

Future improvement:

```txt
Use slugs for more reliable matching.
Support fuzzy matching.
Support aliases.
```

MVP matching rule:

```txt
Exact case-insensitive title match within same user account.
```

---

## 12. Backlinks

Backlinks are notes that link to the current note.

Query:

```txt
Find note_links where target_note_id = current note id
```

Backlinks panel should show:

```txt
Source note title
Small excerpt/snippet
Link context later optional
```

MVP does not need full block-level link context.

---

## 13. Auto-save

Notes should auto-save.

Manual save should not be required.

Auto-save behavior:

```txt
User types
Local dirty state updates immediately
Debounce save by around 750ms-1500ms
PATCH /api/notes/:noteId
Show status: Saving...
Show status: Saved
Show status: Error if failed
```

Use optimistic local state, but be careful not to overwrite newer edits.

Minimum state needed:

```txt
idle
editing
saving
saved
error
```

Important rules:

```txt
Do not PATCH on every keystroke.
Do not lose local edits if request fails.
Do not clear dirty state until server confirms latest content.
```

---

## 14. Editor Design

Use CodeMirror for the editor.

Reason:

```txt
Real Markdown editing
Keyboard-friendly
Obsidian-like feel
Good extension ecosystem
Possible Vim mode later
Easier wiki link handling than a block editor
```

Editor UX:

```txt
Title input at top
Metadata bar under title
Markdown editor main area
Backlinks panel on side
Save status indicator
```

Suggested desktop layout:

```txt
-------------------------------------------------
Title
Metadata: type | project | area | tags | saved
-------------------------------------------------
Markdown editor                       Backlinks
-------------------------------------------------
```

Mobile later:

```txt
Editor full screen
Backlinks hidden behind tab/button
```

---

## 15. Live Preview

The editor should feel live-preview-ish, but do not overbuild this in MVP.

MVP acceptable approach:

```txt
CodeMirror markdown editor
Preview toggle or side preview
Rendered markdown preview below/side when enabled
```

Future improvement:

```txt
Inline rendered markdown like Obsidian Live Preview
```

Do not attempt a full custom Obsidian Live Preview clone in MVP.

That is too much work.

---

## 16. Daily Notes

Daily notes should auto-create when opened.

Flow:

```txt
User goes to /notes/daily/2026-05-20
API checks for existing note where:
  type = 'daily'
  note_date = 2026-05-20
  user_id = current user
  archived_at is null

If found:
  return note

If not found:
  load user's default daily template
  replace template variables
  create note
  return new note
```

Default title:

```txt
20 May 2026
```

Or:

```txt
Daily Note - 2026-05-20
```

Pick one and stay consistent.

Recommended:

```txt
2026-05-20
```

Why:

```txt
Sorts well
Searches well
Feels Obsidian-like
```

---

## 17. Notes Search

Notes search should be designed to grow.

MVP search supports:

```txt
title
content
tags
type
```

Future advanced search should support:

```txt
project
area
linked notes
daily notes
operators like tag:react type:daily project:"Productivity App"
```

API should be structured so future filters can be added without rewriting everything.

Example route:

```txt
GET /api/notes?search=react&type=normal&tag=javascript&projectId=abc&areaId=xyz
```

MVP implementation can start simple:

```txt
ILIKE search over title/content
filter by type
filter by tag if implemented
```

Later upgrade:

```txt
Postgres full-text search
ranking
search operators
```

---

## 18. Notes API Routes

### GET /api/notes

Supports query params:

```txt
search=
type=
projectId=
areaId=
tag=
archived=false
```

Returns:

```ts
{
  notes: NoteListItem[]
}
```

List item should include:

```txt
id
title
type
excerpt
word_count
reading_time_minutes
project
area
tags
updated_at
created_at
```

---

### POST /api/notes

Creates a note.

Body:

```ts
{
  title: string;
  content?: string;
  type?: 'normal' | 'daily' | 'meeting' | 'dev_log' | 'journal' | 'reference';
  projectId?: string;
  areaId?: string;
  tagIds?: string[];
}
```

Server should:

```txt
Validate input
Create note
Derive metadata
Extract wiki links
Create note_links
Return note
```

---

### GET /api/notes/:noteId

Returns full note detail.

Should include:

```txt
note
tags
project
area
outgoingLinks
backlinks summary optional
```

---

### PATCH /api/notes/:noteId

Updates note.

Supports partial updates:

```ts
{
  title?: string;
  content?: string;
  type?: string;
  projectId?: string | null;
  areaId?: string | null;
  tagIds?: string[];
}
```

If title or content changes:

```txt
Recompute metadata
Re-parse wiki links
Refresh note_links
Resolve unresolved links where possible
```

---

### POST /api/notes/:noteId/archive

Soft delete only.

```txt
archived_at = now()
```

Do not hard-delete in MVP.

---

### GET /api/notes/:noteId/backlinks

Returns backlinks.

```ts
{
  backlinks: Backlink[]
}
```

---

### GET /api/notes/daily/:date

Find or create daily note.

Date format:

```txt
YYYY-MM-DD
```

---

### GET /api/note-templates

Returns templates.

---

### POST /api/note-templates

Creates template.

---

### PATCH /api/note-templates/:templateId

Updates template.

---

### POST /api/note-templates/:templateId/archive

Archives template.

---

## 19. UI Screens

### /notes

Global notes list.

Should include:

```txt
Search
Filters
New note button
Daily note shortcut
List of notes
```

Filters:

```txt
All
Daily
Meeting
Dev Log
Journal
Reference
Project
Area
Tag
```

---

### /notes/new

Create note page.

Can be simple:

```txt
Title
Type
Optional project
Optional area
Create
```

After creation, redirect to:

```txt
/notes/:noteId
```

---

### /notes/:noteId

Full note page.

Contains:

```txt
Title input
Metadata bar
CodeMirror editor
Preview toggle or split preview
Backlinks panel
Tags/project/area controls
Save status
Archive button
```

---

### /notes/daily

Daily notes index.

Shows:

```txt
Open today
Recent daily notes
Calendar/list of previous daily notes
```

---

### /notes/daily/:date

Finds or creates that daily note and opens editor.

---

### /notes/templates

Template manager.

Shows:

```txt
Daily template
Meeting template
Dev log template
Custom templates
```

---

## 20. State Management

### TanStack Query owns:

```txt
Notes lists
Single note query
Backlinks query
Templates query
Mutations
Cache invalidation
Search results
```

### Zustand owns:

```txt
Editor UI state
Preview mode
Backlinks panel open/closed
Search input draft
Current filters UI
Autosave status if not local component state
```

Rule:

```txt
Server data = TanStack Query
UI-only state = Zustand or local state
```

---

## 21. Metadata Derivation

When content changes, derive:

```txt
excerpt
word_count
reading_time_minutes
```

Suggested rules:

```txt
excerpt = first 160 useful plain-text characters
word_count = number of words in plain text content
reading_time_minutes = Math.max(1, Math.ceil(word_count / 200))
```

Strip Markdown syntax for excerpt where practical.

This does not need to be perfect in MVP.

---

## 22. Optimistic UX Rules

### Auto-save

Use local editor state immediately.

Save in background.

If server fails:

```txt
Keep local edits
Show error
Allow retry
Do not overwrite with stale server data
```

---

### Archiving note

Immediately navigate back to notes list or show archived state.

If failure:

```txt
Restore note
Show toast
```

---

## 23. Not MVP

Do not build these in the first Notes release:

```txt
Graph view
Attachments
Image uploads
Version history
Full Obsidian plugin system
Advanced search operators
Embeds
Block references
Collaborative editing
Publishing notes
AI summarisation
```

These can come later.

---

## 24. Definition of Done

Notes MVP is complete when:

```txt
User can create notes
User can edit Markdown notes
Notes auto-save
Save status is visible
User can view all notes
User can search notes
User can filter by type
User can add tags
User can optionally link project/area
User can create/open daily note
Daily note auto-creates from editable template
User can edit daily template
[[wiki links]] are parsed
note_links table is populated
Backlinks panel works
Unresolved wiki links are supported
User can archive notes
Full note pages work
```

---

## 25. Build Order

Implement in this order:

```txt
1. Add notes, note_links, note_templates, note_tags schema
2. Add migrations
3. Add metadata utilities
4. Add wiki link parser
5. Add notes API CRUD
6. Add note_links refresh logic
7. Add backlinks API
8. Add note templates API
9. Add daily note find-or-create API
10. Add notes list page
11. Add note creation flow
12. Add CodeMirror editor page
13. Add autosave
14. Add backlinks panel
15. Add template manager
16. Add daily notes page
17. Add search and filters
18. Polish error/loading states
```

Stop after Notes MVP.

Do not start dashboard yet unless Tasks and Notes both have real working data.

