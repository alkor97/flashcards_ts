import { parseTsv } from "./parser";
import { toDataEntry } from "./repository";

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

  const container = document.querySelector("div");
  allTags.forEach((tag, index) => {
    const id = `checkbox_${index}`;
    const elements = `
        <input id="${id}" type="checkbox" name="tags" value="${tag}" checked="checked">
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
      window.location.replace(newUrl);
    });
  }
})();
