import { BehaviorSubject } from "rxjs";
import { ReportResults } from "@satellite-earth/core/types";
import Report from "./report";

export default class ScrapperStatusReport extends Report<"SCRAPPER_STATUS"> {
  readonly type = "SCRAPPER_STATUS";

  status = new BehaviorSubject<ReportResults["SCRAPPER_STATUS"] | undefined>(undefined);

  handleResult(response: ReportResults["SCRAPPER_STATUS"]): void {
    this.status.next(response);
  }
}
