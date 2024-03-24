import { shuffle } from "./random";

describe("randomize tools", () => {
  it("shuffles array content", () => {
    const array = [1, 2, 3, 4];
    const length = array.length;
    shuffle(array);
    expect(array.length).toEqual(length);
    expect(array).toContain(1);
    expect(array).toContain(2);
    expect(array).toContain(3);
    expect(array).toContain(4);
  });
});
