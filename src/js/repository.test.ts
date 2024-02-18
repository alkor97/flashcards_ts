import { withTags, withTagsIncrementally, DataEntry } from "./repository";

describe("Repository tests", () => {
  function dataEntry(key: string, value: string, tags: string[]): DataEntry {
    return {
      key: key,
      value: value,
      tags: tags,
    };
  }
  test("stateless filtering by tags works", () => {
    const data: DataEntry[] = [
      dataEntry("a", "A", []),
      dataEntry("b", "B", ["bb"]),
      dataEntry("c", "C", ["bb", "cc"]),
    ];
    const [a, b, c] = data;
    expect(data.filter(withTags(["bb"]))).toStrictEqual([b, c]);
    expect(data.filter(withTags(["cc"]))).toStrictEqual([c]);
  });
  test("incremental filtering by tags works", () => {
    const data: DataEntry[] = [
        dataEntry("a", "A", []),
        dataEntry("b", "B", ["bb"]),
        dataEntry("c", "C", []),
        dataEntry("d", "D", []),
        dataEntry("e", "E", ["ee"]),
      ];
      const [a, b, c, d, e] = data;
      expect(data.filter(withTagsIncrementally(["bb"]))).toStrictEqual([b, c, d]);
    });
});
