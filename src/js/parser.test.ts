import { parseTsv } from "./parser";
import fs from "fs";

describe("tab-separated values parsing", () => {
  test("empty content returns empty output", () => {
    expect(parseTsv("")).toStrictEqual([]);
  });
  test("empty lines are ignored", () => {
    expect(
      parseTsv(`
        
        `)
    ).toStrictEqual([]);
  });
  test("comments are ignored", () => {
    expect(parseTsv("# a comment")).toStrictEqual([]);
    expect(parseTsv("a\tb  # a comment")).toStrictEqual([["a", "b"]]);
  });
  test("a word pairs are parsed correctly", () => {
    expect(
      parseTsv(`
        pies\t\tel perro              # multiple tabs separation
        restauracja\tel restaurante   # tab separation
        kurtka  la chaqueta           # double spaces separation
        `)
    ).toStrictEqual([
      ["pies", "el perro"],
      ["restauracja", "el restaurante"],
      ["kurtka", "la chaqueta"],
    ]);
  });
  test("parse production data", () => {
    const data = fs.readFileSync("src/data/pol-esp.tsv");
    expect(data).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    const text = data.toString();
    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(0);

    const parsed = parseTsv(text);
    expect(parsed).toBeTruthy();
    expect(parsed.length).toBeGreaterThan(0);
  });
});
