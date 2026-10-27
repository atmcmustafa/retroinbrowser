// PostgREST's or() syntax treats , ( ) " \ as structure, so keep only characters titles need.
export function toSearchTerm(q: string) {
  return q
    .replace(/[^\p{L}\p{N}\s\-'!&.:]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}
