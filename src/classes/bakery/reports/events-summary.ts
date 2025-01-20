import { BehaviorSubject } from "rxjs";
import { ReportResults } from "@satellite-earth/core/types";
import Report from "./report";

export default class EventsSummaryReport extends Report<"EVENTS_SUMMARY"> {
  readonly type = "EVENTS_SUMMARY";

  events = new BehaviorSubject<ReportResults["EVENTS_SUMMARY"][]>([]);

  onFire(): void {
    this.events.next([]);
  }

  handleResult(result: ReportResults["EVENTS_SUMMARY"]): void {
    if (this.events.value) this.events.next([...this.events.value, result]);
    else this.events.next([result]);
  }
}
