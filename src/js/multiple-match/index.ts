import {
  DataEntry,
  toDataEntry,
  withTagsIncrementally,
} from "../parsing/repository";
import { parseTsv } from "../parsing/parser";
import { Model, Element } from "./model";
import { View, ViewElementState, ViewColumn } from "./view";
import { Column } from "./common";

function sleep(millis?: number) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

class ViewModel {
  private inTransition = false;
  constructor(
    private model: Model,
    private view: View,
    private data: Iterator<DataEntry>
  ) {
    view.clickHandler = async (column: Column, index: number) => {
      if (this.inTransition) {
        // block selections during transition period
        return;
      }
      // start transition period
      this.inTransition = true;

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
        let state: ViewElementState = valid ? "valid" : "wrong";
        view.setState(Column.LEFT, leftIndex, state);
        view.setState(Column.RIGHT, rightIndex, state);
        await sleep();

        // reset view to normal state
        state = valid ? "collapsed" : "normal";
        view.setState(Column.LEFT, leftIndex, state);
        view.setState(Column.RIGHT, rightIndex, state);

        await sleep(view.getTransitionDuration(Column.LEFT, leftIndex));
        if (valid) {
          model.remove(leftIndex, rightIndex);

          if (model.length > 0) {
            // do not set normal state if the model is empty to prevent showing last matched pair
            view.setState(Column.LEFT, leftIndex, "normal");
            view.setState(Column.RIGHT, rightIndex, "normal");
          }

          // reflect model in view
          this.fillRows(column, false /* shuffle only if needed */);
        }
      }
      // end transition period
      this.inTransition = false;
    };

    // reflect model in view
    this.inTransition = true;
    this.fillRows();
    this.inTransition = false;
  }

  private fillRows(shuffleColumn?: Column, forceShuffle = true) {
    // fill model with required amount of data entries
    while (this.model.length < this.view.length) {
      const result = this.data.next();
      if (!result.done) {
        this.model.add(result.value);
      } else {
        break;
      }
    }
    if (forceShuffle || this.model.length >= this.view.length) {
      // no need to shuffle if there is less entries to be shown than number of slots
      this.model.shuffleColumn(shuffleColumn);
    }
    this.view.setProgress(this.model.matched, this.model.total);

    if (!this.model.length) {
      (async () => {
        document.querySelector("dialog")?.showModal();
        await sleep(1000);
        window.location.href = `index.html${window.location.search}`;
      })();
      return;
    }

    const targets: [Column, Element[]][] = [
      [Column.LEFT, this.model.left],
      [Column.RIGHT, this.model.right],
    ];
    for (let i = 0; i < this.view.length; ++i) {
      // reflect model into view
      targets.forEach(([column, model]) => {
        this.view.setState(column, i, "normal");
        this.view.setContent(column, i, i < model.length ? model[i].text : "");
      });
    }
  }
}

let viewModel: ViewModel | undefined = undefined;

async function runOnInit() {
  const result = await fetch("./pol-esp.tsv");
  const text = await result.text();
  const params = new URLSearchParams(window.location.search);
  const data = parseTsv(text)
    .map(toDataEntry)
    .filter(withTagsIncrementally(params.getAll("tags")));
  const model = new Model(data.length);
  const view = new View(
    new ViewColumn(document.querySelector<HTMLElement>(".left")!),
    new ViewColumn(document.querySelector<HTMLElement>(".right")!)
  );

  viewModel = new ViewModel(model, view, data[Symbol.iterator]());
}

runOnInit();
