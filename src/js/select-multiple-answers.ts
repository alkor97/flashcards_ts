import { Statistics, Selection, selectFrom, IndexSelector } from "./select";
import { DataEntry } from "./repository";
import { distance } from "./comparators";
import { shuffle } from "./random";

export interface MultipleAnswersSelection {
  readonly query: string | null;
  readonly answers: string[];
  /** index of valid answer from @see answers field */
  readonly validIndex: number;
  readonly selectAnswer: (answerIndex?: number) => void;
  readonly statistics: Statistics;
}

function addMultipleAnswersToSelection(
  selection: Selection,
  data: readonly DataEntry[],
  batchSize: number
): MultipleAnswersSelection {
  const { key, value } = selection.entry;
  const uniqueKeys = new Set(key);
  const uniqueValues = new Set([value]);
  const answers = data
    .filter((e) => e.key != key)
    .filter((e) => (uniqueKeys.has(e.key) ? false : !!uniqueKeys.add(e.key)))
    .filter((e) =>
      uniqueValues.has(e.value) ? false : !!uniqueValues.add(e.value)
    )
    .map((e) => ({
      value: e.value,
      metric: distance(value, e.value),
    }))
    .toSorted((a, b) => a.metric - b.metric)
    .map((e) => e.value)
    .slice(0, batchSize - 1);
  const allAnswers = [value, ...answers];
  shuffle(allAnswers);
  const validIndex = allAnswers.indexOf(value);
  return {
    query: key,
    answers: allAnswers,
    validIndex: validIndex,
    selectAnswer: (answerIndex?: number): void => {
      if (answerIndex === validIndex) {
        selection.remove();
      }
    },
    statistics: selection.statistics,
  };
}

export function* selectMultipleAnswers(
  batchSize: number,
  data: readonly DataEntry[],
  selector?: IndexSelector
): Generator<MultipleAnswersSelection> {
  const generator = selectFrom(data, selector);
  for (let selection of generator) {
    yield addMultipleAnswersToSelection(selection, data, batchSize);
  }
}
