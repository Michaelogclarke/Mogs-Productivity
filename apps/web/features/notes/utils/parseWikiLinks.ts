export type ParsedWikiLink = {
  raw: string;
  linkText: string;
  alias?: string;
  startIndex: number;
  endIndex: number;
};

const WIKI_LINK_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

export function parseWikiLinks(content: string): ParsedWikiLink[] {
  const links: ParsedWikiLink[] = [];
  let match: RegExpExecArray | null;

  WIKI_LINK_RE.lastIndex = 0;
  while ((match = WIKI_LINK_RE.exec(content)) !== null) {
    links.push({
      raw: match[0],
      linkText: match[1].trim(),
      alias: match[2]?.trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return links;
}
