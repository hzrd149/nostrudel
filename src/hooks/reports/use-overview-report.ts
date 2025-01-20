import { useObservable } from "applesauce-react/hooks";

import useReport from "../use-report";

export default function useOverviewReport() {
  // hardcode the report id to 'overview' so there is only ever one
  const report = useReport("OVERVIEW", "overview", {});

  return useObservable(report?.value);
}
