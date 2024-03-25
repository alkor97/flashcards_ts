import { Column } from "./common";

function toMillis(text: string): number {
  const multiplier = text.endsWith("ms") ? 1 : 1000;
  return parseFloat(text) * multiplier;
}

export type ViewElementState = "normal" | "selected" | "wrong" | "valid" | "collapsed";

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
  public get transitionDuration(): number {
    return toMillis(getComputedStyle(this.view).transitionDuration);
  }
}

export class ViewColumn {
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
  public getTransitionDuration(index: number): number {
    return this.byIndex(index).transitionDuration;
  }
  private byIndex(index: number): ViewElement {
    return this.elements[index];
  }
  public get length() {
    return this.elements.length;
  }
}

type ClickHandler = (column: Column, index: number) => void;

export class View {
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

  public getTransitionDuration(column: Column, index: number): number {
    return this.byColumn(column).getTransitionDuration(index);
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
