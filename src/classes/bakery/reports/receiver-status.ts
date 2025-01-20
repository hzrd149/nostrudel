import { BehaviorSubject } from "rxjs";
import { ReportResults } from "@satellite-earth/core/types";
import Report from "./report";

export default class ReceiverStatusReport extends Report<"RECEIVER_STATUS"> {
  readonly type = "RECEIVER_STATUS";

  status = new BehaviorSubject<ReportResults["RECEIVER_STATUS"] | undefined>(undefined);

  handleResult(response: ReportResults["RECEIVER_STATUS"]): void {
    this.status.next(response);
  }
}
