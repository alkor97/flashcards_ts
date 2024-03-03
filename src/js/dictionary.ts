import { parseTsv } from "./parser";
import { DataEntry, toDataEntry } from "./repository";

async function prepareData(): Promise<DataEntry[]> {
  const result = await fetch("./pol-esp.tsv");
  const text = await result.text();
  const params = new URLSearchParams(window.location.search);
  return parseTsv(text)
    .map(toDataEntry)
    .toSorted((a, b) => a.key.toLowerCase().localeCompare(b.key.toLowerCase()));
}

function createSpan(content: string): HTMLElement {
  const span = document.createElement("span");
  span.textContent = content;
  return span;
}

function ensureValidTopPosition(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) {
    element.style.top = `${element.offsetTop}`;
  }
}

(async () => {
  const data = await prepareData();
  ensureValidTopPosition(".sticky");
  const grid = document.querySelector<HTMLDivElement>(".grid-container");
  document
    .querySelector<HTMLInputElement>("input[type='text']")
    ?.addEventListener("input", (e: Event) => {
      const value = (e.target as HTMLInputElement).value.toLowerCase();
      const elements = data
        .filter(
          (entry) => entry.key.includes(value) || entry.value.includes(value)
        )
        .map((entry) => [createSpan(entry.key), createSpan(entry.value)])
        .flat();
      grid?.replaceChildren(...elements);
    });
})();
