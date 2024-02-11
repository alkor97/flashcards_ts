import { Repository } from "./repository";
import { MultipleAnswersSession } from "./session";
import { parseTsv } from "./parser";

const dialog = document.querySelector("dialog")!;
document.querySelector("dialog button")?.addEventListener("click", () => {
  window.location.reload();
});

function setProgress(value: number, max: number) {
  const progress = document.querySelector("progress");
  if (progress && value >= 0 && max > 0) {
    progress.value = value;
    progress.max = max;
    progress.innerText = `${Math.floor((100 * value) / max)}%`;
  }
}
setProgress(0, 100);

function fillForm(session: MultipleAnswersSession) {
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
  const task = session.next(answers.length);

  if (task.validIndex === -1) {
    // show dialog upon session end
    dialog.showModal();
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
          const { total, completed } = session.getStatistics();
          setProgress(completed, total);
          setTimeout(() => fillForm(session), afterValidTimeout);
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

function fillTableRows() {
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
}

let session: MultipleAnswersSession;
async function start() {
  fillTableRows();
  const result = await fetch("./pol-esp.tsv");
  const text = await result.text();
  const parsed = parseTsv(text);
  const repo = new Repository(parsed);
  session = repo.getMultipleAnswersSession();
  fillForm(session);
}
start();
