import { Repository } from "./repository";
import { MultipleAnswersSession } from "./session";
import { parseTsv } from "./tsv-parser";

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
  const afterValidTimeout = 500;
  const answers = document.querySelectorAll<HTMLElement>(".answer");
  const content = session.next(answers.length);

  if (content.validIndex === -1) {
    // show dialog upon session end
    dialog.showModal();
    return;
  }

  document.getElementById("query")!.textContent = content.query;
  for (let i = 0; i < answers.length; ++i) {
    const answer = answers[i];
    answer.style.display = i < content.answers.length ? "block" : "none";
    answer.innerText = content.answers[i];

    if (i === content.validIndex) {
      answer.addEventListener(
        "click",
        () => {
          content.selectAnswer(i);
          const { total, completed } = session.getStatistics();
          setProgress(completed, total);
          setTimeout(() => fillForm(session), afterValidTimeout);
        },
        { once: true }
      );
      answer.classList.remove(invalidClass);
      answer.classList.add(validClass);
    } else {
      answer.classList.add(invalidClass);
      answer.classList.remove(validClass);
    }
  }
}

let session: MultipleAnswersSession;
async function start() {
  const result = await fetch("./pol-esp.tsv");
  const text = await result.text();
  const parsed = parseTsv(text);
  const repo = new Repository(parsed);
  session = repo.getMultipleAnswersSession();
  fillForm(session);
}
start();
