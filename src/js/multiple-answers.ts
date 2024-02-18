import { toDataEntry, withTagsIncrementally } from "./repository";
import {
  selectMultipleAnswers,
  MultipleAnswersSelection,
} from "./select-multiple-answers";
import { parseTsv } from "./parser";

function setProgress(value: number, max: number) {
  const progress = document.querySelector("progress");
  if (progress && value >= 0 && max > 0) {
    const percentage = Math.round((100 * value) / max);
    progress.value = percentage;
    progress.max = 100;
  }
}
setProgress(0, 100);

function fillForm(generator: Generator<MultipleAnswersSelection>) {
  const invalidClass = "invalid";
  const validClass = "valid";
  const afterValidTimeout = 2000;
  const answers = document.querySelectorAll<HTMLElement>(".answer");
  for (let answer of answers) {
    const tr = answer.parentElement?.parentElement;
    if (tr) {
      tr.style.display = "";
    }
  }
  const it = generator.next();

  if (it.done) {
    window.location.href = "index.html";
    return;
  }

  function onValidChosen(element: HTMLElement) {
    element.classList.remove(invalidClass);
    element.classList.add(validClass);
  }

  function onInvalidChosen(element: HTMLElement) {
    element.classList.add(invalidClass);
    element.classList.remove(validClass);
  }

  function clearValidInvalidClasses(element: HTMLElement) {
    element.classList.remove(invalidClass);
    element.classList.remove(validClass);
  }

  function hideRow(element: HTMLElement) {
    const style = element.parentElement?.parentElement?.style;
    if (style) {
      style.display = "none";
    }
  }

  const task = it.value;
  document.getElementById("query")!.textContent = task.query;
  for (let i = 0; i < answers.length; ++i) {
    const answer: HTMLElement = answers[i];
    answer.style.display = i < task.answers.length ? "block" : "none";
    answer.innerText = task.answers[i];

    if (i === task.validIndex) {
      answer.addEventListener(
        "click",
        () => {
          task.selectAnswer(i);
          for (let j = 0; j < answers.length; ++j) {
            if (j != i) {
              hideRow(answers[j]);
            } else {
              clearValidInvalidClasses(answers[j]);
            }
          }
          const { total, completed } = task.statistics;
          setProgress(completed, total);
          setTimeout(() => fillForm(generator), afterValidTimeout);
        },
        { once: true }
      );
      onValidChosen(answer);
    } else {
      onInvalidChosen(answer);
    }
  }
}

function findParentOfType(
  element: Element | null | undefined,
  type: string
): Element | null | undefined {
  for (
    ;
    element &&
    element.parentElement &&
    element.nodeName.toUpperCase() !== type.toUpperCase();
    element = element.parentElement
  ) {
    // just iterate
  }
  return element;
}

function prepareTableRows(): number {
  const row = findParentOfType(document.querySelector(".answer"), "TR");
  const rowContainer = row?.parentElement;
  const body = document.body;
  if (row && rowContainer && body) {
    let previousHeight = body.clientHeight;
    let step = 0;
    while (body.clientHeight + step < window.innerHeight) {
      rowContainer.appendChild(row.cloneNode(true));
      step = Math.max(step, body.clientHeight - previousHeight);
      previousHeight = body.clientHeight;
    }
  }
  return document.querySelectorAll<HTMLElement>(".answer").length;
}

(async () => {
  const rowCount = prepareTableRows();
  const result = await fetch("./pol-esp.tsv");
  const text = await result.text();
  const params = new URLSearchParams(window.location.search);
  const data = parseTsv(text)
    .map(toDataEntry)
    .filter(withTagsIncrementally(params.getAll("tags")));
  fillForm(selectMultipleAnswers(rowCount, data));
})();
