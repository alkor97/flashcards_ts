import { Element, Model } from "./model";
import { Column } from "./common";

describe("Element", () => {
  it("is matchable", () => {
    const id = 13;
    const otherId = 14;
    expect(
      new Element(id, "some text", otherId).matches(
        new Element(otherId, "another text", id)
      )
    );
  });
});

describe("Model", () => {
  const model = new Model(3);
  model.add({ key: "left1", value: "right1", tags: [] });
  model.add({ key: "left2", value: "right2", tags: [] });

  it("provides valid length", () => {
    expect(model.length).toEqual(2);
  });
  it("supports adding a data entry", () => {
    // verify key is distributed to left column and value to right
    expect(model.left.map((e) => e.text)).toEqual(["left1", "left2"]);
    expect(model.right.map((e) => e.text)).toEqual(["right1", "right2"]);

    // verify every entry has unique identifier
    const ids = [
      model.left.map((e) => e.id),
      model.right.map((e) => e.id),
    ].flat();
    expect(new Set(ids).size).toBe(4);

    expect(model.left.length).toEqual(model.right.length);
    for (let i = 0; i < model.left.length; ++i) {
      const left = model.left[i];
      const right = model.right[i];

      // verify matching relation
      expect(left.id).toEqual(right.matchingId);
      expect(left.matchingId).toEqual(right.id);

      // verify proper state of selection
      expect(left.selected).toBeFalsy();
      expect(right.selected).toBeFalsy();
    }
  });
  it("supports selecting cells in both columns", () => {
    [Column.LEFT, Column.RIGHT].forEach((column) => {
      const [column1, column2, otherColumn] =
        column === Column.LEFT
          ? [model.left, model.right, Column.RIGHT]
          : [model.right, model.left, Column.LEFT];

      // it is possible to select a cell in column
      let result = model.select(column, 1);
      expect(result).toEqual([{ index: 1, selected: true }]);
      expect(column1.filter((e) => e.selected).length).toEqual(1);
      expect(column1[1].selected).toBeTruthy();
      expect(column2.every((e) => !e.selected)).toBeTruthy();

      // only one cell in column can be selected
      result = model.select(column, 0);
      expect(result).toEqual([
        { index: 1, selected: false },
        { index: 0, selected: true },
      ]);
      expect(column1.filter((e) => e.selected).length).toEqual(1);

      // it is possible to select values in both columns
      result = model.select(otherColumn, 1);
      expect(result).toEqual([{ index: 1, selected: true }]);
      expect(column2.filter((e) => e.selected).length).toEqual(1);

      // reset to deselected by indices
      model.resetSelection(0, 1);
      model.resetSelection(1, 0);

      expect(column1.every((e) => !e.selected)).toBeTruthy();
      expect(column2.every((e) => !e.selected)).toBeTruthy();
    });
  });
  it("supports challenging current selection", () => {
    // handle lack of selection without problem
    expect(model.challengeSelection()).toBeUndefined();

    // handle selection mismatch
    model.select(Column.LEFT, 0);
    model.select(Column.RIGHT, 1);
    expect(model.challengeSelection()).toEqual([0, 1, false]);

    // verify matched counter
    expect(model.matched).toEqual(0);

    // handle selection match
    model.select(Column.RIGHT, 0);
    expect(model.challengeSelection()).toEqual([0, 0, true]);

    // verify matched counter
    expect(model.matched).toEqual(1);

    // reset to deselected by indices
    model.resetSelection(0, 0);
  });
  it("removes entries", () => {
    model.remove(0, 1);
    expect(model.length).toEqual(1);
    model.remove(0, 0);
    expect(model.length).toEqual(0);
  })
});
