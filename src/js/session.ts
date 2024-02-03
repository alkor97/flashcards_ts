import { distance } from "./comparators";
import { Entry } from "./repository";

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function shuffle(array: any[]): any[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

interface Query {
  entry: Entry | null;
  index: number;
}

interface Statistics {
  total: number;
  completed: number;
}

type Selector = string | number | undefined;

class Session {
  data: readonly Entry[];
  dataIndices: number[];

  constructor(data: readonly Entry[]) {
    this.data = data;
    this.dataIndices = [...this.data.keys()];
  }

  getDataIndex(selector: Selector): number {
    if (typeof selector === "string") {
      return this.data.findIndex((e) => e.key === selector);
    }
    if (typeof selector === "number") {
      return this.dataIndices[selector % this.dataIndices.length];
    }
    return this.dataIndices.length > 1
      ? this.getDataIndex(randomInt(this.dataIndices.length))
      : this.getDataIndex(0);
  }

  selectQuery(selector: Selector): Query {
    if (selector === undefined && this.dataIndices.length === 0) {
      return {
        entry: null,
        index: -1,
      };
    }

    const dataIndex = this.getDataIndex(selector);
    const entry = this.data[dataIndex];
    return {
      entry: entry,
      index: dataIndex,
    };
  }

  removeQuery(key: string, value: string) {
    const dataIndex = this.data.findIndex(
      (e) => e.key === key && e.value === value
    );
    this.dataIndices.splice(this.dataIndices.indexOf(dataIndex), 1);
  }

  getStatistics(): Statistics {
    return {
      total: this.data.length,
      completed: this.data.length - this.dataIndices.length,
    };
  }
}

export interface Task {
  query: string | null;
  answers: string[];
  validIndex: number;
  selectAnswer: (answerIndex?: number) => void;
}

export class MultipleAnswersSession extends Session {
  next(count: number, selector?: Selector): Task {
    const { entry, index } = this.selectQuery(selector);
    if (!entry) {
      return {
        query: null,
        answers: [],
        validIndex: -1,
        selectAnswer: () => {},
      };
    }

    const uniqueKeys = new Set(entry.key);
    const uniqueValues = new Set([entry.value]);
    const answers = this.data
      .filter((_, i) => i != index)
      .filter((e) => e.key != entry.key)
      .filter((e) => (uniqueKeys.has(e.key) ? false : !!uniqueKeys.add(e.key)))
      .filter((e) =>
        uniqueValues.has(e.value) ? false : !!uniqueValues.add(e.value)
      )
      .map((e) => ({
        value: e.value,
        metric: distance(entry.value, e.value),
      }))
      .toSorted((a, b) => a.metric - b.metric)
      .map((e) => e.value)
      .slice(0, count - 1);
    const allAnswers = [entry.value, ...answers];
    shuffle(allAnswers);
    const validIndex = allAnswers.indexOf(entry.value);
    return {
      query: entry.key,
      answers: allAnswers,
      validIndex: validIndex,
      selectAnswer: (answerIndex) => {
        if (answerIndex === validIndex) {
          this.removeQuery(entry.key, allAnswers[answerIndex]);
        }
      },
    };
  }
}
