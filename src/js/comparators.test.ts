import { isEqual, distance } from "./comparators";

describe("verify comparators", () => {
  test("only plain letters", () => {
    expect(isEqual("abc", "abc")).toBeTruthy();
    expect(isEqual("abc", "cba")).toBeFalsy();
  });
  test("accented letters", () => {
    expect(isEqual("ábc", "abc", "es")).toBeTruthy();
  });
  test("word distance", () => {
    expect(distance("kitten", "sitting")).toBe(3);
  });
});
