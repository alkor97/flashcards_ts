import { parseTsv } from "./parser";
import { DataEntry, toDataEntry } from "./repository";

interface DictionaryEntry {
  key: string;
  value: string;
  searchRepresentations: string[];
}

export function simplifyForSearch(text: string) {
  return text
    .toLocaleLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace("ł", "l");
}

function toDictionaryEntry(entry: DataEntry): DictionaryEntry {
  return {
    key: entry.key,
    value: entry.value,
    searchRepresentations: [entry.key, entry.value].map(simplifyForSearch),
  };
}

async function prepareData(): Promise<DictionaryEntry[]> {
  const result = await fetch("./pol-esp.tsv");
  const text = await result.text();
  return parseTsv(text)
    .map(toDataEntry)
    .map(toDictionaryEntry)
    .toSorted((a, b) => a.key.toLowerCase().localeCompare(b.key.toLowerCase()));
}

function createSpan(content: string): HTMLElement {
  const span = document.createElement("span");
  span.textContent = content;
  return span;
}

function matches(text: string, entry: DictionaryEntry): boolean {
  return entry.searchRepresentations.some((repr) => repr.includes(text));
}

function createSpans(data: DictionaryEntry[]): HTMLElement[] {
  return data
    .map((entry) => [createSpan(entry.key), createSpan(entry.value)])
    .flat();
}

async function runOnLoad() {
  const data = await prepareData();
  const grid = document.querySelector<HTMLDivElement>(".grid-container");
  document
    .querySelector<HTMLInputElement>("input[type='text']")
    ?.addEventListener("input", (e: Event) => {
      const value = simplifyForSearch((e.target as HTMLInputElement).value);
      const elements = createSpans(
        data.filter((entry) => matches(value, entry))
      );
      grid?.replaceChildren(...elements);
    });
  grid?.replaceChildren(...createSpans(data));
}

if (typeof document !== "undefined") {
  runOnLoad();
}
