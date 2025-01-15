import { useObservable } from "applesauce-react/hooks";

import useReport from "../use-report";

export default function useLogsReport(service?: string) {
  const report = useReport("LOGS", `logs-${service || "all"}`, { service });

  const logs = useObservable(report?.entries);
  return { report, logs };
}
