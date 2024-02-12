
export interface DataEntry {
  readonly key: string;
  readonly value: string;
}

export function toDataEntry(pair: string[]): DataEntry {
  return {
    key: pair[0],
    value: pair[1],
  };
}
