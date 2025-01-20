import { BehaviorSubject } from "rxjs";
import { ReportResults } from "@satellite-earth/core/types";
import Report from "./report";

export default class ServicesReport extends Report<"SERVICES"> {
  readonly type = "SERVICES";

  services = new BehaviorSubject<ReportResults["SERVICES"][]>([]);

  handleResult(result: ReportResults["SERVICES"]) {
    this.services.next(this.services.value.filter((s) => s.id !== result.id).concat(result));
  }
}
