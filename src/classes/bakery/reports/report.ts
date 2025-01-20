import { ReportArguments, ReportResults } from "@satellite-earth/core/types";
import _throttle from "lodash.throttle";
import { nanoid } from "nanoid";
import { Debugger } from "debug";

import BakeryControlApi from "../control-api";
import { logger } from "../../../helpers/debug";

export default class Report<T extends keyof ReportArguments> {
  id: string;
  args: ReportArguments[T];
  running = false;
  log: Debugger;

  error: string | undefined;

  control: BakeryControlApi;
  constructor(id: string = nanoid(), args: ReportArguments[T], control: BakeryControlApi) {
    this.id = id;
    this.args = args;
    this.control = control;
    this.log = logger.extend(this.type + ":" + id);
  }

  // override
  // @ts-expect-error
  readonly type: T = "unset";
  onFire(args: ReportArguments[T]) {}
  handleResult(result: ReportResults[T]) {}
  handleError(message: string) {
    this.error = message;
  }

  // public api
  fireThrottle = _throttle(this.fire.bind(this), 10, { leading: false });
  fire() {
    this.onFire(this.args);
    // @ts-expect-error
    this.control.send(["CONTROL", "REPORT", "SUBSCRIBE", this.id, this.type, this.args]);
    this.running = true;
  }
  setArgs(args: ReportArguments[T]) {
    this.args = args;
  }
  close() {
    this.control.send(["CONTROL", "REPORT", "CLOSE", this.id]);
    this.running = false;
  }
}
