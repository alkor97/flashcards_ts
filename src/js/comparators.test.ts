import { distance } from "./comparators";

describe("verify comparators", () => {
  test("word distance", () => {
    expect(distance("kitten", "sitting")).toBe(3);
  });
});
