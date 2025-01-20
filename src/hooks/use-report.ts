import { useEffect, useMemo, useState } from "react";
import { ReportArguments } from "@satellite-earth/core/types";
import { nanoid } from "nanoid";

import { useObservable } from "applesauce-react/hooks";
import reportManager$ from "../services/reports";

export default function useReport<T extends keyof ReportArguments>(type: T, id?: string, args?: ReportArguments[T]) {
  const [hookId] = useState(() => nanoid());
  const argsKey = JSON.stringify(args);

  const reportManager = useObservable(reportManager$);

  const report = useMemo(() => {
    if (id && args) return reportManager?.getOrCreateReport(type, id, args);
  }, [type, id, argsKey, reportManager]);

  useEffect(() => {
    if (args && report) {
      // @ts-expect-error
      report.setArgs(args);
      report.fireThrottle();
    }
  }, [argsKey, report]);

  useEffect(() => {
    if (report) {
      reportManager?.addDependency(hookId, report);
      return () => reportManager?.removeDependency(hookId, report);
    }
  }, [report, reportManager]);

  return report;
}
