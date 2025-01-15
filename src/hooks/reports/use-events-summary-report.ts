import { useObservable } from "applesauce-react/hooks";
import { ReportArguments } from "@satellite-earth/core/types";

import useReport from "../use-report";

export default function useEventsSummaryReport(id: string, args: ReportArguments["EVENTS_SUMMARY"]) {
  const report = useReport("EVENTS_SUMMARY", id, args);

  return useObservable(report?.events);
}
