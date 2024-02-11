import { MultipleAnswersSession } from "./session";

export interface DataEntry {
  readonly key: string;
  readonly value: string;
}

function toDataEntry(pair: string[]): DataEntry {
  return {
    key: pair[0],
    value: pair[1],
  };
}

export class Repository {
  data: readonly DataEntry[];

  constructor(input: readonly string[][]) {
    this.data = Object.freeze(input.map(toDataEntry));
  }

  getMultipleAnswersSession(): MultipleAnswersSession {
    return new MultipleAnswersSession(this.data);
  }
}
