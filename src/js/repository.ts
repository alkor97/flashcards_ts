export interface DataEntry {
  readonly key: string;
  readonly value: string;
  readonly tags: string[];
}

export function toDataEntry(entries: string[]): DataEntry {
  return {
    key: entries[0],
    value: entries[1],
    tags: entries.length > 2 ? entries.slice(2) : [],
  };
}

export function withTags(tags: string[]): (entry: DataEntry) => boolean {
  return (entry: DataEntry) => tags.some((tag) => entry.tags.includes(tag));
}

export function withTagsIncrementally(tags: string[]): (entry: DataEntry) => boolean {
  const useTags = withTags(tags);
  if (tags.length === 0) {
    return useTags;
  }
  let lastTags = [];
  let matched = false;
  return (entry: DataEntry) => {
    if (entry.tags.length > 0) {
      lastTags = entry.tags;
      matched = useTags(entry);
    }
    return matched;
  }
}