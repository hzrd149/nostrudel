import { ReportArguments, ControlResponse } from "@satellite-earth/core/types";
import { BehaviorSubject } from "rxjs";
import _throttle from "lodash.throttle";

import BakeryControlApi from "../classes/bakery/control-api";
import { controlApi$ } from "./bakery";
import Report from "../classes/bakery/reports/report";
import SuperMap from "../classes/super-map";
import { logger } from "../helpers/debug";
import { ReportClasses, ReportTypes } from "../classes/bakery/reports";

class ReportManager {
  log = logger.extend("ReportManager");
  control: BakeryControlApi;

  reports = new Map<string, Report<any>>();

  constructor(control: BakeryControlApi) {
    this.control = control;

    this.control.on("message", this.handleMessage.bind(this));
  }

  private handleMessage(message: ControlResponse) {
    if (message[1] === "REPORT") {
      const id = message[3];
      const report = this.reports.get(id);
      switch (message[2]) {
        case "RESULT":
          if (report) report.handleResult(message[4]);
          break;
        case "ERROR":
          if (report) report.handleError(message[4]);
          break;

        default:
          break;
      }
    }
  }

  // public api
  getOrCreateReport<T extends keyof ReportArguments>(type: T, id: string, args: ReportArguments[T]) {
    let report = this.getReport(type, id);
    if (!report) report = this.createReport(type, id, args);
    return report;
  }
  createReport<T extends keyof ReportArguments>(type: T, id: string, args: ReportArguments[T]): ReportTypes[T] {
    const ReportClass = ReportClasses[type];
    if (!ReportClass) throw new Error(`Failed to create report ${type}`);
    const report = new ReportClass(id, args, this.control);
    this.reports.set(id, report);
    // @ts-expect-error
    return report as ReportTypes[T];
  }
  getReport<T extends keyof ReportArguments>(type: T, id: string) {
    return this.reports.get(id) as ReportTypes[T] | undefined;
  }
  removeReport<T extends keyof ReportArguments>(type: T, id: string) {
    const report = this.reports.get(id) as ReportTypes[T] | undefined;
    if (report && report.running) {
      report.close();
      this.reports.delete(id);
    }
  }

  dependencies = new SuperMap<Report<any>, Set<string>>(() => new Set());
  addDependency(id: string, report: Report<any>) {
    const set = this.dependencies.get(report);
    set.add(id);
    report.fireThrottle();
  }
  removeDependency(id: string, report: Report<any>) {
    const set = this.dependencies.get(report);
    set.delete(id);
    this.closeUnusedReportsThrottle();
  }

  private closeUnusedReportsThrottle = _throttle(this.closeUnusedReports.bind(this), 1000, { leading: false });
  private closeUnusedReports() {
    for (const [report, dependencies] of this.dependencies) {
      if (report.running && dependencies.size === 0) {
        this.log(`Closing ${report.type} ${report.id}`);
        report.close();
      }
    }
  }
}

const reportManager$ = new BehaviorSubject<ReportManager | null>(null);

controlApi$.subscribe((api) => {
  if (api) reportManager$.next(new ReportManager(api));
  else reportManager$.next(null);
});

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.reportManager$ = reportManager$;
}

export default reportManager$;
