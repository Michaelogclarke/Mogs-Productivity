// Strip Markdown syntax to get plain text for excerpt/word count
function stripMarkdown(content: string): string {
  return content
    .replace(/^#{1,6}\s+/gm, '')         // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')      // bold
    .replace(/\*(.+?)\*/g, '$1')          // italic
    .replace(/`{3}[\s\S]*?`{3}/g, '')     // code blocks
    .replace(/`(.+?)`/g, '$1')            // inline code
    .replace(/\[\[([^\]|]+?)(?:\|[^\]]+?)?\]\]/g, '$1') // wiki links
    .replace(/\[([^\]]+?)\]\([^)]+?\)/g, '$1') // md links
    .replace(/^[-*+]\s+/gm, '')           // list bullets
    .replace(/^\d+\.\s+/gm, '')           // ordered list
    .replace(/^>\s+/gm, '')               // blockquote
    .replace(/\n{2,}/g, ' ')
    .trim();
}

export function deriveExcerpt(content: string, maxLength = 160): string {
  const plain = stripMarkdown(content);
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trimEnd() + '…';
}

export function deriveWordCount(content: string): number {
  const plain = stripMarkdown(content);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

export function deriveReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function deriveMetadata(content: string) {
  const wordCount = deriveWordCount(content);
  return {
    excerpt: deriveExcerpt(content),
    wordCount,
    readingTimeMinutes: deriveReadingTime(wordCount),
  };
}
