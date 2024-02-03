import { MultipleAnswersSession } from "./session";

export interface Entry {
  key: string;
  value: string;
}

function toEntry(pair: string[]): Entry {
  return {
    key: pair[0],
    value: pair[1],
  };
}

export class Repository {
  data: readonly Entry[];

  constructor(input: readonly string[][]) {
    this.data = Object.freeze(input.map(toEntry));
  }

  getMultipleAnswersSession(): MultipleAnswersSession {
    return new MultipleAnswersSession(this.data);
  }
}
