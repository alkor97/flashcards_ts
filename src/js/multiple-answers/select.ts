import { DataEntry } from "../parsing/repository";
import { randomInt } from "../utils/random";

export interface Statistics {
  total: number;
  completed: number;
}

export interface Selection {
  readonly entry: DataEntry;
  readonly index: number;
  readonly remove: () => void;
  readonly statistics: Statistics;
}

export type IndexSelector = (
  data: readonly DataEntry[],
  dataIndices: readonly number[]
) => number;

function randomIndexSelector(
  _: readonly DataEntry[],
  dataIndices: readonly number[]
): number {
  return dataIndices[randomInt(dataIndices.length)];
}

export function* selectFrom(
  data: readonly DataEntry[],
  selector?: IndexSelector
): Generator<Selection> {
  const dataIndices = [...data.keys()];
  while (dataIndices.length > 0) {
    const dataIndex = (selector ?? randomIndexSelector)(data, dataIndices);
    yield {
      entry: data[dataIndex],
      index: dataIndex,
      remove: () => dataIndices.splice(dataIndices.indexOf(dataIndex), 1),
      statistics: {
        total: data.length,
        completed: data.length - dataIndices.length,
      },
    };
  }
}
