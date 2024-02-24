import { parseTsv } from "../parser";
import { toDataEntry } from "../repository";
import { parseGrammarElements, generateRandomSentence } from "./sentences";
import fs from "fs";

describe("verify sentences parsing", () => {
  test("parse grammar elements", () => {
    const data = fs.readFileSync("src/data/sentences.tsv");
    expect(data).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    const text = data.toString();
    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(0);

    const parsed = parseTsv(text);
    expect(parsed).toBeTruthy();
    expect(parsed.length).toBeGreaterThan(0);

    const entries = parsed.map(toDataEntry);
    expect(entries).toBeTruthy();
    expect(entries.length).toBeGreaterThan(0);

    const repo = parseGrammarElements(entries);
    expect(repo).toBeTruthy();

    expect(repo.verbs.length).toBeGreaterThan(0);
    expect(repo.adjectives.length).toBeGreaterThan(0);
    expect(repo.articles.length).toBeGreaterThan(0);
    expect(repo.nouns.length).toBeGreaterThan(0);
    expect(repo.pronouns.length).toBeGreaterThan(0);

    for (let i = 0; i < 10; ++i) {
      const sentence = generateRandomSentence(repo);
      fs.appendFileSync("example.txt", sentence + "\n");
    }
  });
});
