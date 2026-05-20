import * as chrono from 'chrono-node';
import { normaliseShorthand } from './shorthand';
import type { ParsedCommand } from './types';

export function parseQuickAdd(input: string, referenceDate?: Date): ParsedCommand {
  const rawInput = input.trim();
  const normalised = normaliseShorthand(rawInput);
  const ref = referenceDate ?? new Date();

  const results = chrono.parse(normalised, ref, { forwardDate: true });

  if (results.length === 0) {
    return {
      suggestedType: 'task',
      title: rawInput,
      confidence: 0.5,
      rawInput,
    };
  }

  const parsed = results[0];
  const scheduledFor = parsed.start.date().toISOString();

  // Remove the matched datetime text from the title
  const titleWithoutDate =
    normalised.slice(0, parsed.index).trim() +
    ' ' +
    normalised.slice(parsed.index + parsed.text.length).trim();

  // Also strip the original shorthand tokens from the raw input so the title looks clean
  const cleanTitle = titleWithoutDate.trim().replace(/\s+/g, ' ');

  return {
    suggestedType: 'task',
    title: cleanTitle || rawInput,
    scheduledFor,
    confidence: 0.9,
    rawInput,
    metadata: {
      normalisedInput: normalised,
      chronoParsed: parsed.text,
    },
  };
}
