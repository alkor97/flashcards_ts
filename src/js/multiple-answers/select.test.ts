import { selectFrom } from "./select";
import { toDataEntry } from "../parsing/repository";

describe("data view generator tests", () => {
  test("test generator with for-of statement", () => {
    const data = [
      ["telefon", "el teléfono"],
      ["bank", "el banco"],
      ["lampa", "la lámpara"],
    ].map(toDataEntry);
    let counter = 0;
    for (let entry of selectFrom(data)) {
      entry.remove(); // without this selectFrom never ends!
      counter++;
    }
    expect(counter).toBe(data.length);
  });
  test("test generator with iterator", () => {
    const data = [
      ["telefon", "el teléfono"],
      ["bank", "el banco"],
      ["lampa", "la lámpara"],
    ].map(toDataEntry);
    const generator = selectFrom(data);

    function nextAndRemove(): boolean | undefined {
      const result = generator.next();
      if (!result.done) {
        result.value.remove();
      }
      return result.done;
    }

    expect(nextAndRemove()).toBeFalsy();
    expect(nextAndRemove()).toBeFalsy();
    expect(nextAndRemove()).toBeFalsy();
    expect(nextAndRemove()).toBeTruthy();
  });
});
