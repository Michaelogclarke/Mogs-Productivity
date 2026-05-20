import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

export function markdownHighlight(dark: boolean): Extension {
  const c = dark
    ? {
        heading1:   '#f8fafc',
        heading2:   '#e2e8f0',
        heading3:   '#cbd5e1',
        heading4:   '#94a3b8',
        strong:     '#f8fafc',
        em:         '#e2e8f0',
        strike:     '#52525b',
        codeText:   '#7dd3fc',
        codeBg:     'rgba(125,211,252,0.10)',
        link:       '#93c5fd',
        url:        '#93c5fd',
        quote:      '#71717a',
        listMarker: '#60a5fa',
        punct:      '#3f3f46',
        separator:  '#27272a',
        tag:        '#fca5a5',
        attr:       '#fde68a',
        string:     '#bbf7d0',
      }
    : {
        heading1:   '#0f172a',
        heading2:   '#1e293b',
        heading3:   '#334155',
        heading4:   '#475569',
        strong:     '#0f172a',
        em:         '#1e293b',
        strike:     '#a1a1aa',
        codeText:   '#0369a1',
        codeBg:     'rgba(3,105,161,0.07)',
        link:       '#1d4ed8',
        url:        '#1d4ed8',
        quote:      '#71717a',
        listMarker: '#2563eb',
        punct:      '#d4d4d8',
        separator:  '#e4e4e7',
        tag:        '#dc2626',
        attr:       '#d97706',
        string:     '#166534',
      };

  return syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.heading1,        fontWeight: '700', fontSize: '1.5em',  color: c.heading1, lineHeight: '1.3' },
      { tag: tags.heading2,        fontWeight: '700', fontSize: '1.25em', color: c.heading2, lineHeight: '1.3' },
      { tag: tags.heading3,        fontWeight: '600', fontSize: '1.1em',  color: c.heading3 },
      { tag: tags.heading4,        fontWeight: '600',                     color: c.heading4 },
      { tag: tags.heading5,        fontWeight: '600',                     color: c.heading4 },
      { tag: tags.heading6,        fontWeight: '600',                     color: c.heading4 },
      { tag: tags.strong,          fontWeight: '700',                     color: c.strong },
      { tag: tags.emphasis,        fontStyle: 'italic',                   color: c.em },
      { tag: tags.strikethrough,   textDecoration: 'line-through',        color: c.strike },
      {
        tag: tags.monospace,
        fontFamily: 'var(--font-geist-mono, monospace)',
        fontSize: '0.875em',
        color: c.codeText,
        backgroundColor: c.codeBg,
        borderRadius: '3px',
        padding: '1px 4px',
      },
      { tag: tags.link,             color: c.link,       textDecoration: 'underline' },
      { tag: tags.url,              color: c.url },
      { tag: tags.quote,            color: c.quote,      fontStyle: 'italic' },
      { tag: tags.list,             color: c.listMarker, fontWeight: '600' },
      { tag: tags.processingInstruction, color: c.punct },
      { tag: tags.meta,             color: c.punct },
      { tag: tags.contentSeparator, color: c.separator },
      { tag: tags.tagName,          color: c.tag },
      { tag: tags.attributeName,    color: c.attr },
      { tag: tags.string,           color: c.string },
    ])
  );
}
