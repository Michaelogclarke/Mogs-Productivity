// Refresh note_links for a note after save
import { eq, and } from 'drizzle-orm';
import { db, notes, noteLinks } from './index';
import { parseWikiLinks } from '@/features/notes/utils/parseWikiLinks';

export async function refreshNoteLinks(sourceNoteId: string, userId: string, content: string) {
  const parsed = parseWikiLinks(content);

  // Delete existing links for this note
  await db.delete(noteLinks).where(eq(noteLinks.sourceNoteId, sourceNoteId));

  if (parsed.length === 0) return;

  // Resolve each link text to a target note (case-insensitive title match)
  const rows = await Promise.all(
    parsed.map(async (link) => {
      const [target] = await db
        .select({ id: notes.id })
        .from(notes)
        .where(
          and(
            eq(notes.userId, userId),
            // Use lower() via raw SQL comparison
          ),
        )
        .limit(1);

      // Fallback: in-process case-insensitive match
      const allMatches = await db
        .select({ id: notes.id, title: notes.title })
        .from(notes)
        .where(and(eq(notes.userId, userId)));

      const matched = allMatches.find(
        (n) => n.title.toLowerCase() === link.linkText.toLowerCase(),
      );

      return {
        userId,
        sourceNoteId,
        targetNoteId: matched?.id ?? null,
        linkText: link.linkText,
        resolved: !!matched,
      };
    }),
  );

  await db.insert(noteLinks).values(rows);
}
