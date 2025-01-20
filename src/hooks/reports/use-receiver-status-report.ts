import { useObservable } from "applesauce-react/hooks";

import useReport from "../use-report";

export default function useReceiverStatusReport() {
  const report = useReport("RECEIVER_STATUS", "receiver-status", {});

  return useObservable(report?.status);
}
