import { NextRequest } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db, notes, noteTemplates } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/supabase-server';
import { ok, err, unauthorized } from '@/lib/api/response';
import { deriveMetadata } from '@/features/notes/utils/noteMetadata';
import { applyTemplateVars } from '@/features/notes/utils/templateVars';
import { refreshNoteLinks } from '@/lib/db/noteLinks';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return err('Invalid date format — use YYYY-MM-DD');

  // Try to find existing daily note
  const [existing] = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.userId, user.id),
        eq(notes.type, 'daily'),
        eq(notes.noteDate, date),
        isNull(notes.archivedAt),
      ),
    );

  if (existing) return ok({ note: existing, created: false });

  // Create from template
  const [defaultTemplate] = await db
    .select()
    .from(noteTemplates)
    .where(
      and(
        eq(noteTemplates.userId, user.id),
        eq(noteTemplates.type, 'daily'),
        eq(noteTemplates.isDefault, true),
        isNull(noteTemplates.archivedAt),
      ),
    );

  const refDate = new Date(date + 'T12:00:00Z');
  const templateContent = defaultTemplate
    ? applyTemplateVars(defaultTemplate.content, refDate)
    : applyTemplateVars(
        `# {{isoDate}}\n\n## Focus\n\n## Notes\n\n## Tasks\n\n## Wins\n\n## Blockers\n`,
        refDate,
      );

  const meta = deriveMetadata(templateContent);

  const [note] = await db
    .insert(notes)
    .values({
      userId: user.id,
      title: date,
      content: templateContent,
      type: 'daily',
      noteDate: date,
      ...meta,
    })
    .returning();

  await refreshNoteLinks(note.id, user.id, templateContent);

  return ok({ note, created: true }, 201);
}
