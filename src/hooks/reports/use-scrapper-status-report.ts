import { useObservable } from "applesauce-react/hooks";

import useReport from "../use-report";

export default function useScrapperOverviewReport() {
  const report = useReport("SCRAPPER_STATUS", "scrapper-status", {});

  return useObservable(report?.status);
}
