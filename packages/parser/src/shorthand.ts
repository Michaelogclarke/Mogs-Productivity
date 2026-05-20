// Normalise shorthand tokens before running chrono-node
export function normaliseShorthand(input: string): string {
  return input
    // Time shorthands: 1p -> 1pm, 2p -> 2pm, 9a -> 9am
    .replace(/\b(\d{1,2})p\b/g, '$1pm')
    .replace(/\b(\d{1,2})a\b/g, '$1am')
    // Date shorthands
    .replace(/\btm\b/gi, 'tomorrow')
    .replace(/\btmr\b/gi, 'tomorrow')
    .replace(/\btod\b/gi, 'today')
    // Day shorthands -> next X
    .replace(/\bmon\b/gi, 'next monday')
    .replace(/\btue\b/gi, 'next tuesday')
    .replace(/\bwed\b/gi, 'next wednesday')
    .replace(/\bthu\b/gi, 'next thursday')
    .replace(/\bfri\b/gi, 'next friday')
    .replace(/\bsat\b/gi, 'next saturday')
    .replace(/\bsun\b/gi, 'next sunday');
}
