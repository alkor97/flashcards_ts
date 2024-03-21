import { DataEntry, toDataEntry, withTagsIncrementally } from "./repository";
import { shuffle, randomFrom } from "./random";
import { parseTsv } from "./parser";

class Element {
  constructor(
    public readonly id: number,
    public readonly text: string,
    public readonly matchingId: number,
    public selected: boolean = false,
    public empty: boolean = false
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

class Model {
  public readonly left: Element[] = [];
  public readonly right: Element[] = [];
  private generator = 0;
  private added = 0;

  constructor(public readonly total: number) {}

  public add(entry: DataEntry) {
    const columns = [this.left, this.right];
    toElements(entry, () => this.generator++).forEach((value, index) =>
      columns[index].push(value)
    );
    this.added++;
  }

  public select(column: Column, index: number) {
    const result: Selection[] = [];
    const elements = column === Column.LEFT ? this.left : this.right;
    const deselectedIndex = elements.findIndex(
      (e, i) => e.selected && i !== index
    );
    if (deselectedIndex >= 0 && !elements[deselectedIndex].empty) {
      elements[deselectedIndex].selected = false;
      result.push({
        index: deselectedIndex,
        selected: false,
      });
    }
    if (index < elements.length && !elements[index].empty) {
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
        return [
          leftSelectedIndex,
          rightSelectedIndex,
          this.left[leftSelectedIndex].matches(this.right[rightSelectedIndex]),
        ];
      }
    }
    return undefined;
  }

  public resetSelection(leftIndex: number, rightIndex: number) {
    this.left[leftIndex].selected = false;
    this.right[rightIndex].selected = false;
  }

  public removeEmpty() {
    function impl(data: Element[]) {
      let i = data.length;
      while (i--) {
        if (data[i].empty) {
          data.splice(i, 1);
        }
      }
    }
    impl(this.left);
    impl(this.right);
  }

  public markEmpty(leftIndex: number, rightIndex: number) {
    this.left[leftIndex].empty = true;
    this.right[rightIndex].empty = true;
  }

  public get length() {
    return Math.min(this.left.length, this.right.length);
  }

  public get nonEmptyLength() {
    return Math.max(
      this.left.filter((e) => !e.empty).length,
      this.right.filter((e) => !e.empty).length
    );
  }

  public get presented() {
    return this.added;
  }
}

type ViewElementState = "normal" | "selected" | "wrong" | "valid";

class ViewElement {
  public readonly view = document.createElement("div");
  constructor() {
    this.view.classList.add("content");
  }
  public set state(value: ViewElementState) {
    this.view.setAttribute("state", value);
  }
  public set content(value: string) {
    this.view.textContent = value;
  }
  public addClickHandler(handler: () => void) {
    this.view.addEventListener("click", handler);
  }
}

class ViewColumn {
  private readonly elements: ViewElement[] = [];
  constructor(private anchor: HTMLElement) {}
  public addElement(handler: (index: number) => void): ViewElement {
    const entry = new ViewElement();
    entry.content = " ";
    const size = this.elements.length;
    entry.addClickHandler(() => handler(size));
    this.elements.push(entry);
    this.anchor.appendChild(entry.view);
    return entry;
  }
  public setState(index: number, state: ViewElementState) {
    this.byIndex(index).state = state;
  }
  public setContent(index: number, content: string) {
    this.byIndex(index).content = content;
  }
  private byIndex(index: number): ViewElement {
    return this.elements[index];
  }
  public get length() {
    return this.elements.length;
  }
}

enum Column {
  LEFT,
  RIGHT,
}

type ClickHandler = (column: Column, index: number) => void;

class View {
  private handler: ClickHandler = () => {};
  private readonly progress = document.querySelector("progress");

  constructor(private left: ViewColumn, private right: ViewColumn) {
    const body = document.body;
    let previousHeight = body.clientHeight;
    let step = 0;
    // create enough rows to fill the screen vertically
    while (body.clientHeight + step < window.innerHeight) {
      this.left.addElement((index) => this.handler(Column.LEFT, index));
      this.right.addElement((index) => this.handler(Column.RIGHT, index));
      step = Math.max(step, body.clientHeight - previousHeight);
      previousHeight = body.clientHeight;
    }
  }

  public setState(column: Column, index: number, state: ViewElementState) {
    this.byColumn(column).setState(index, state);
  }

  public setContent(column: Column, index: number, content: string) {
    this.byColumn(column).setContent(index, content);
  }

  private byColumn(column: Column): ViewColumn {
    return column === Column.LEFT ? this.left : this.right;
  }

  public get length() {
    return Math.min(this.left.length, this.right.length);
  }

  public set clickHandler(value: ClickHandler) {
    this.handler = value;
  }

  public setProgress(current: number, total: number) {
    if (this.progress && current >= 0 && total > 0) {
      const percentage = Math.round((100 * current) / total);
      this.progress.value = percentage;
      this.progress.max = 100;
    }
  }
}

function runLater(callback: () => void, delay?: number) {
  setTimeout(callback, delay);
}

class ViewModel {
  private inTransition = false;
  constructor(
    private model: Model,
    private view: View,
    private data: Iterator<DataEntry>
  ) {
    view.clickHandler = (column: Column, index: number) => {
      if (this.inTransition) {
        // block selections during transition period
        return;
      }

      // report selection to the model
      model.select(column, index).forEach((s) => {
        // reflect selection updates in view
        view.setState(column, s.index, s.selected ? "selected" : "normal");
      });

      // check if selections do match
      const match = model.challengeSelection();
      if (match !== undefined) {
        const [leftIndex, rightIndex, valid] = match;

        // reset selection in model
        model.resetSelection(leftIndex, rightIndex);

        // reflect match state in view
        const state: ViewElementState = valid ? "valid" : "wrong";
        view.setState(Column.LEFT, leftIndex, state);
        view.setState(Column.RIGHT, rightIndex, state);

        // start transition period
        this.inTransition = valid;
        runLater(() => {
          // reset view to normal state
          view.setState(Column.LEFT, leftIndex, "normal");
          view.setState(Column.RIGHT, rightIndex, "normal");

          runLater(() => {
            if (valid) {
              model.markEmpty(leftIndex, rightIndex);
              model.removeEmpty();

              // reflect model in view
              this.fillRows(column);
            }
            // end transition period
            this.inTransition = false;
          }, 1000);
        });
      }
    };

    // reflect model in view
    this.fillRows();
  }

  private fillRows(shuffleColumn?: Column) {
    // fill model with required amount of data entries
    while (this.model.length < this.view.length) {
      const result = this.data.next();
      if (!result.done) {
        this.model.add(result.value);
      } else {
        break;
      }
    }
    this.model.shuffleColumn(shuffleColumn);
    this.view.setProgress(this.model.presented, this.model.total);

    if (!this.model.length) {
      runLater(
        () => (window.location.href = `index.html${window.location.search}`),
        1000
      );
      document.querySelector("dialog")?.showModal();
      return;
    }

    const targets: [Column, Element[]][] = [
      [Column.LEFT, this.model.left],
      [Column.RIGHT, this.model.right],
    ];
    for (let i = 0; i < this.view.length; ++i) {
      // reflect model into target
      targets.forEach(([column, model]) => {
        this.view.setState(column, i, "normal");
        this.view.setContent(
          column,
          i,
          i < model.length ? (model[i].empty ? " " : model[i].text) : ""
        );
      });
    }
  }
}

let viewModel: ViewModel | undefined = undefined;

async function runOnInit() {
  const result = await fetch("./pol-esp.tsv");
  const text = await result.text();
  const params = new URLSearchParams(window.location.search);
  const data = shuffle(
    parseTsv(text)
      .map(toDataEntry)
      .filter(withTagsIncrementally(params.getAll("tags")))
  );

  const model = new Model(data.length);
  const view = new View(
    new ViewColumn(document.querySelector<HTMLElement>(".left")!),
    new ViewColumn(document.querySelector<HTMLElement>(".right")!)
  );

  viewModel = new ViewModel(model, view, data[Symbol.iterator]());
}

runOnInit();
