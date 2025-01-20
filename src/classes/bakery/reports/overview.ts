import { BehaviorSubject } from "rxjs";
import { ReportResults } from "@satellite-earth/core/types";
import Report from "./report";

export default class OverviewReport extends Report<"OVERVIEW"> {
  type = "OVERVIEW" as const;

  value = new BehaviorSubject<ReportResults["OVERVIEW"][]>([]);

  handleResult(response: ReportResults["OVERVIEW"]): void {
    // remove duplicates
    const next = this.value.value?.filter((r) => r.pubkey !== response.pubkey).concat(response) ?? [response];
    const sorted = next.sort((a, b) => b.events - a.events);

    this.value.next(sorted);
  }
}
