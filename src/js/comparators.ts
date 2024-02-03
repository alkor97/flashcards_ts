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
  const minLength = Math.min(r.from.length, r.to.length);
  return Array.from({ length: minLength }, (_, i) => {
    const regex = new RegExp(r.from.charAt(i), "g");
    const value = r.to.charAt(i);
    return { regex, value };
  });
}

const replacementsMap = new Map<string, Replacement[]>();
replacementsMap.set("es", createReplacements({
  from: "áéíóúýÁÉÍÓÚÝñÑ",
  to: "aeiouyAEIOUYnN",
}));

function commonize(text: string, replacements: Replacement[]): string {
  const combinedRegex = new RegExp(replacements.map(r => r.regex.source).join('|'), 'g');
  const replacementDict = Object.fromEntries(replacements.map(r => [r.regex.source, r.value]));
  return text.replace(combinedRegex, match => replacementDict[match]);
}

function getReplacements(locale?: string): Replacement[] {
  return replacementsMap.get((locale || "").toLowerCase()) || [];
}

export function isEqual(a: string, b: string, locale?: string): boolean {
  const replacements = getReplacements(locale);
  return commonize(a, replacements) === commonize(b, replacements);
}

export function distance(a: string, b: string): number {
  return levenshtein(a, b);
}
