import { Repository } from "./repository";

describe("repository tests", () => {
  test("multiple answers basics", () => {
    const data = [
      ["telefon", "el teléfono"],
      ["bank", "el banco"],
      ["lampa", "la lámpara"],
      ["fotografia", "la fotografía"],
      ["książka", "el libro"],
      ["mapa", "el mapa"],
      ["piżama", "el pijama"],
      ["planeta", "el planeta"],
      ["problem", "el problema"],
      ["dzień", "el día"],
    ];
    const repo = new Repository(data);
    const session = repo.getMultipleAnswersSession();
    const result = session.next(3);
    expect(result.answers).toHaveLength(3);
    const dataIndex = data.findIndex((e) => e[0] === result.query);
    expect(result.answers[result.validIndex]).toStrictEqual(data[dataIndex][1]);
  });
  test("skip entries with the same answer", () => {
    const data = [
      ["q1", "a1"],
      ["q2", "a2"],
      ["q3", "a2"],
      ["q4", "a1"],
    ];
    const repo = new Repository(data);
    const session = repo.getMultipleAnswersSession();
    const result = session.next(3, "q1");
    expect(result.answers).toHaveLength(2);
    expect(result.answers.includes("a1")).toBeTruthy();
    expect(result.answers.includes("a2")).toBeTruthy();
  });
  test("limit session length", () => {
    const data = [
      ["telefon", "el teléfono"],
      ["bank", "el banco"],
      ["lampa", "la lámpara"],
      ["fotografia", "la fotografía"],
    ];
    const repo = new Repository(data);
    const session = repo.getMultipleAnswersSession();

    const simulateCorrectAnswer = () => {
      const result = session.next(3);
      expect(result.validIndex).not.toBe(-1);
      result.selectAnswer(result.validIndex);
    };

    const simulateIncorrectAnswer = () => {
      const result = session.next(3);
      expect(result.validIndex).not.toBe(-1);
      result.selectAnswer((result.validIndex + 1) % result.answers.length);
    };

    simulateCorrectAnswer();
    simulateCorrectAnswer();
    simulateIncorrectAnswer();
    simulateCorrectAnswer();
    simulateIncorrectAnswer();
    simulateCorrectAnswer();

    // up to 4 results are expected, because there are only 4 entries
    expect(session.next(3).validIndex).toBe(-1);
  });
  test("queries do not repeat", () => {
    const data = [
      ["telefon", "el teléfono"],
      ["bank", "el banco"],
      ["lampa", "la lámpara"],
    ];
    const repo = new Repository(data);
    const session = repo.getMultipleAnswersSession();

    const queries = new Set<string>();
    [...data.keys()].forEach(() => {
      const result = session.next(3);
      queries.add(result.query!);
      result.selectAnswer(result.validIndex);
    });
    const expected = new Set(data.map((e) => e[0])); // all keys
    expect(queries).toStrictEqual(expected);
  });
  test("exclude entries with the same key", () => {
    const data = [
      ["chłopak", "el nino"],
      ["chłopak", "el chico"],
      ["dziewczyna", "la chica"],
    ];
    const repo = new Repository(data);
    const session = repo.getMultipleAnswersSession();

    const result = session.next(3, 2);
    expect(result.answers.length).toBe(2);
  });
});
