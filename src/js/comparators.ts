import levenshtein from "js-levenshtein";

interface Rule {
  from: string;
  to: string;
}

interface Replacement {
  regex: RegExp;
  value: string;
}

function createReplacements(r: Rule): Replacement[] {
  const result: Replacement[] = [];
  for (let i = 0; i < Math.min(r.from.length, r.to.length); ++i) {
    const regex = new RegExp(r.from.charAt(i), "g");
    const repl = r.to.charAt(i);
    result.push({ regex, value: repl });
  }
  return result;
}

const spanishReplacements: Replacement[] = createReplacements({
  from: "áéíóúýÁÉÍÓÚÝñÑ",
  to: "aeiouyAEIOUYnN",
});

function commonize(text: string, replacements: Replacement[]): string {
  for (const repl of replacements) {
    text = text.replace(repl.regex, repl.value);
  }
  return text;
}

function getReplacements(locale?: string): Replacement[] {
  if ((locale || "").toLowerCase() === "es") {
    return spanishReplacements;
  }
  return [];
}

export function isEqual(a: string, b: string, locale?: string): boolean {
  const replacements = getReplacements(locale);
  return commonize(a, replacements) === commonize(b, replacements);
}

export function distance(a: string, b: string): number {
  return levenshtein(a, b);
}
