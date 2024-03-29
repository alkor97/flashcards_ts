import { simplifyForSearch } from ".";

describe("dictionary", () => {
  test("Polish diacritics", () => {
    expect(simplifyForSearch("ąćęłńóśźż")).toEqual("acelnoszz");
  });
  test("Spanish diacritics", () => {
    expect(simplifyForSearch("áéíóúñü")).toEqual("aeiounu");
  });
});
