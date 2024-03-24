import levenshtein from "js-levenshtein";

export function distance(a: string, b: string): number {
  return levenshtein(a, b);
}
