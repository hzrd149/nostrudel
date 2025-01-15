import { BehaviorSubject } from "rxjs";
import { ReportResults } from "@satellite-earth/core/types";
import Report from "./report";

export default class NetworkStatusReport extends Report<"NETWORK_STATUS"> {
  readonly type = "NETWORK_STATUS";

  status = new BehaviorSubject<ReportResults["NETWORK_STATUS"] | undefined>(undefined);

  handleResult(response: ReportResults["NETWORK_STATUS"]): void {
    this.status.next(response);
  }
}
