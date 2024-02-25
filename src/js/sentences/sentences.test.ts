import { parseTsv } from "../parser";
import { toDataEntry } from "../repository";
import { Repository, parseGrammarElements } from "./parser";
import { generateRandomSentence } from "./sentences";
import fs from "fs";

describe("verify sentences generation", () => {
  function repoFromFile(file: string): Repository {
    const data = fs.readFileSync(file);
    const text = data.toString();
    const parsed = parseTsv(text);
    const entries = parsed.map(toDataEntry);
    return parseGrammarElements(entries);
  }
  const repo = repoFromFile("src/data/sentences.tsv");

  test("generate sentences", () => {
    for (let i = 0; i < 10; ++i) {
      const sentence = generateRandomSentence(repo);
      fs.appendFileSync("example.txt", sentence + "\n");
    }
  });
});
