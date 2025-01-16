import { useObservable } from "applesauce-react/hooks";

import useReport from "../use-report";

export default function useNetworkOverviewReport() {
  const report = useReport("NETWORK_STATUS", "network-status", {});

  return useObservable(report?.status);
}
