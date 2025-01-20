import { BehaviorSubject } from "rxjs";
import { ReportResults } from "@satellite-earth/core/types";

import Report from "./report";

export default class LogsReport extends Report<"LOGS"> {
  readonly type = "LOGS";

  ids = new Set<string>();
  entries = new BehaviorSubject<ReportResults["LOGS"][]>([]);

  handleResult(result: ReportResults["LOGS"]) {
    if (this.ids.has(result.id)) return;

    this.ids.add(result.id);
    this.entries.next(this.entries.value.concat(result).sort((a, b) => b.timestamp - a.timestamp));
  }

  clear() {
    this.entries.next([]);
  }
}
