import { DataEntry } from "../parsing/repository";
import { shuffle, randomFrom } from "../utils/random";
import { Column } from "./common";

export class Element {
  constructor(
    public readonly id: number,
    public readonly text: string,
    public readonly matchingId: number,
    public selected: boolean = false
  ) {}

  public matches(other: Element): boolean {
    return this.id === other.matchingId && this.matchingId === other.id;
  }
}

type IdGenerator = () => number;

function toElements(entry: DataEntry, nextId: IdGenerator): [Element, Element] {
  const leftId = nextId();
  const rightId = nextId();
  return [
    new Element(leftId, entry.key, rightId),
    new Element(rightId, entry.value, leftId),
  ];
}

interface Selection {
  index: number;
  selected: boolean;
}

export class Model {
  public readonly left: Element[] = [];
  public readonly right: Element[] = [];
  private generator = 0;
  private matchedPairs = 0;

  constructor(public readonly total: number) {}

  public add(entry: DataEntry) {
    const columns = [this.left, this.right];
    toElements(entry, () => this.generator++).forEach((value, index) =>
      columns[index].push(value)
    );
  }

  public select(column: Column, index: number): Selection[] {
    const result: Selection[] = [];
    const elements = column === Column.LEFT ? this.left : this.right;
    const deselectedIndex = elements.findIndex(
      (e, i) => e.selected && i !== index
    );
    if (deselectedIndex >= 0) {
      elements[deselectedIndex].selected = false;
      result.push({
        index: deselectedIndex,
        selected: false,
      });
    }
    if (index < elements.length) {
      elements[index].selected = true;
      result.push({
        index,
        selected: true,
      });
    }
    return result;
  }

  public shuffleColumn(column?: Column) {
    shuffle(
      column === Column.LEFT
        ? this.left
        : column === Column.RIGHT
        ? this.right
        : randomFrom([this.left, this.right])
    );
  }

  public challengeSelection(): [number, number, boolean] | undefined {
    const leftSelectedIndex = this.left.findIndex((e) => e.selected);
    if (leftSelectedIndex >= 0) {
      const rightSelectedIndex = this.right.findIndex((e) => e.selected);
      if (rightSelectedIndex >= 0) {
        const matched = this.left[leftSelectedIndex].matches(
          this.right[rightSelectedIndex]
        );
        if (matched) {
          this.matchedPairs++;
        }
        return [leftSelectedIndex, rightSelectedIndex, matched];
      }
    }
    return undefined;
  }

  public resetSelection(leftIndex: number, rightIndex: number) {
    this.left[leftIndex].selected = false;
    this.right[rightIndex].selected = false;
  }

  public remove(leftIndex: number, rightIndex: number) {
    this.left.splice(leftIndex, 1);
    this.right.splice(rightIndex, 1);
  }

  public get length() {
    return Math.min(this.left.length, this.right.length);
  }

  public get matched() {
    return this.matchedPairs;
  }
}
