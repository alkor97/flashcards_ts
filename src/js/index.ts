import { parseTsv } from "./parsing/parser";
import { toDataEntry } from "./parsing/repository";

(async () => {
  const result = await fetch("./pol-esp.tsv");
  const text = await result.text();
  const allTags = parseTsv(text)
    .map(toDataEntry)
    .map((entry) => entry.tags)
    .flat()
    .toSorted()
    .filter((entry, index, array) =>
      index > 0 ? entry !== array[index + 1] : true
    );

  const params = new URLSearchParams(window.location.search);
    const selectedTags = params.getAll("tags") ?? [];

  const container = document.querySelector("div");
  allTags.forEach((tag, index) => {
    const id = `checkbox_${index}`;
    const checked = selectedTags.includes(tag) ? "checked" : "";
    const elements = `
        <input id="${id}" type="checkbox" name="tags" value="${tag}" ${checked}>
        <label for="${id}">${tag}</input>
    `;

    const line = document.createElement("p");
    line.innerHTML = elements;
    container?.appendChild(line);
  });

  const select = document.querySelector("select");
  if (select) {
    document.querySelector("button")?.addEventListener("click", () => {
      const checkBoxes: NodeListOf<HTMLSelectElement> =
        document.querySelectorAll("input[type='checkbox']:checked");
      const query = Array.from(checkBoxes.values())
        .map(
          (e) => `${encodeURIComponent(e.name)}=${encodeURIComponent(e.value)}`
        )
        .join("&");
      const newUrl = `${select.value}.html?${query}`;
      window.location.href = newUrl;
    });
  }
})();
