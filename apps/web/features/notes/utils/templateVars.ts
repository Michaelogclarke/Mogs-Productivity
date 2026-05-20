export function applyTemplateVars(content: string, date: Date = new Date()): string {
  const isoDate = date.toISOString().slice(0, 10);
  const longDate = date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const day = date.toLocaleDateString('en-US', { weekday: 'long' });

  return content
    .replace(/\{\{isoDate\}\}/g, isoDate)
    .replace(/\{\{date\}\}/g, longDate)
    .replace(/\{\{day\}\}/g, day);
}
