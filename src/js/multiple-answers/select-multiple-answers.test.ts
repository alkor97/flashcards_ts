import { toDataEntry } from "../parsing/repository";
import { selectMultipleAnswers } from "./select-multiple-answers";

describe("multiple answers generator tests", () => {
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
    ].map(toDataEntry);
    const result = selectMultipleAnswers(3, data).next().value;
    expect(result).toBeTruthy();
    expect(result.answers).toHaveLength(3);
    const dataIndex = data.findIndex((e) => e.key === result.query);
    expect(result.answers[result.validIndex]).toStrictEqual(
      data[dataIndex].value
    );
  });
  test("limit session length", () => {
    const data = [
      ["telefon", "el teléfono"],
      ["bank", "el banco"],
      ["lampa", "la lámpara"],
      ["fotografia", "la fotografía"],
    ].map(toDataEntry);
    const generator = selectMultipleAnswers(3, data);

    const simulateCorrectAnswer = () => {
      const result = generator.next().value;
      expect(result.done).toBeFalsy();
      result.selectAnswer(result.validIndex);
    };

    const simulateIncorrectAnswer = () => {
      const result = generator.next().value;
      expect(result.done).toBeFalsy();
      result.selectAnswer((result.validIndex + 1) % result.answers.length);
    };

    simulateCorrectAnswer();
    simulateCorrectAnswer();
    simulateIncorrectAnswer();
    simulateCorrectAnswer();
    simulateIncorrectAnswer();
    simulateCorrectAnswer();

    // up to 4 results are expected, because there are only 4 entries
    expect(generator.next().done).toBeTruthy();
  });
  test("queries do not repeat", () => {
    const data = [
      ["telefon", "el teléfono"],
      ["bank", "el banco"],
      ["lampa", "la lámpara"],
      ["bank", "el bancoco"],
      ["bank", "el bancococo"],
      ["kot", "el gato"],
    ].map(toDataEntry);

    const queries: string[] = [];
    for (let it of selectMultipleAnswers(3, data)) {
      queries.push(it.query!);
      it.selectAnswer(it.validIndex);
    }

    const expected = data.map((e) => e.key); // all keys
    expect(queries.toSorted()).toStrictEqual(expected.toSorted());
  });
  test("exclude entries with the same key in single response", () => {
    const data = [
      ["chłopak", "el nino"],
      ["chłopak", "el chico"],
      ["dziewczyna", "la chica"],
    ].map(toDataEntry);
    const result = selectMultipleAnswers(3, data).next().value;
    expect(result.answers.length).toBe(2); // only 'el chico'/'el nino' and 'la chica'
  });
});
